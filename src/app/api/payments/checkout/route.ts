import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readJsonBody, validateSameOriginMutation } from "@/lib/http-security";
import { createHostedCheckout } from "@/lib/payments/hosted-checkout";
import { isPaymentProvider, type PaymentProvider } from "@/lib/payments/provider-catalog";
import { sameOriginUrl } from "@/lib/payments/security-contract";
import { paymentContentSecurityPolicy } from "@/lib/content-security-policy";
import { logSecurityEvent } from "@/lib/security-events";
import { consumeRequestRateLimit } from "@/lib/request-rate-limit";
import { randomUUID } from "node:crypto";

type Customer = { contact: string; email: string; country: string; zip: string; address: string; city: string };
type Body = { org_id?: unknown; campaign_id?: unknown; product_id?: unknown; amount?: unknown; return_url?: unknown; cancel_url?: unknown; customer?: unknown };
type ReadResult = { data: Body; error: null; status: 200 } | { data: null; error: string; status: 400 | 413 | 415 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isFormSubmission(request: NextRequest) {
  return request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() === "application/x-www-form-urlencoded";
}

async function readCheckoutBody(request: NextRequest, isForm: boolean): Promise<ReadResult> {
  if (!isForm) return readJsonBody<Body>(request, 2_048);
  const text = await request.text().catch(() => "");
  if (!text || new TextEncoder().encode(text).byteLength > 2_048) {
    return { data: null, error: text ? "Request body is too large" : "Invalid form", status: text ? 413 : 400 };
  }
  const form = new URLSearchParams(text);
  const value = (name: string) => form.get(name) ?? undefined;
  return {
    data: {
      org_id: value("org_id"), campaign_id: value("campaign_id"), product_id: value("product_id"), amount: value("amount"), return_url: value("return_url"), cancel_url: value("cancel_url"),
      customer: { contact: value("contact"), email: value("email"), country: value("country"), zip: value("zip"), address: value("address"), city: value("city") },
    },
    error: null,
    status: 200,
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function hostedNavigationResponse(checkout: Awaited<ReturnType<typeof createHostedCheckout>>, nonce: string) {
  if (checkout.method === "GET") return NextResponse.redirect(checkout.url, 303);
  const fields = Object.entries(checkout.fields ?? {}).map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`).join("");
  return new NextResponse(`<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>מעבירים לתשלום מאובטח</title></head><body><p>מעבירים לתשלום מאובטח…</p><form id="checkout" method="POST" action="${escapeHtml(checkout.url)}">${fields}</form><script nonce="${escapeHtml(nonce)}">document.getElementById("checkout").submit()</script></body></html>`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": paymentContentSecurityPolicy(nonce, process.env.NODE_ENV === "development"),
      "Reporting-Endpoints": 'impactify-csp="/api/security/csp-report"',
      "Referrer-Policy": "no-referrer",
    },
  });
}

function readCustomer(value: unknown): Customer | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const text = (key: keyof Customer) => typeof record[key] === "string" ? record[key].trim() : "";
  const customer = {
    contact: text("contact"), email: text("email"), country: text("country"),
    zip: text("zip"), address: text("address"), city: text("city"),
  };
  if (!customer.contact || customer.contact.length > 120 || !EMAIL.test(customer.email) || customer.email.length > 254 || !customer.country || customer.country.length > 80 || !customer.zip || customer.zip.length > 20 || !customer.address || customer.address.length > 160 || !customer.city || customer.city.length > 80) return null;
  return customer;
}

function withTimeout<T>(operation: PromiseLike<T>, milliseconds: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), milliseconds);
    Promise.resolve(operation).then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export async function POST(request: NextRequest) {
  if (!validateSameOriginMutation(request)) return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
  const formSubmission = isFormSubmission(request);
  const parsed = await readCheckoutBody(request, formSubmission);
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const orgId = typeof parsed.data.org_id === "string" ? parsed.data.org_id : "";
  let amount = Number(parsed.data.amount);
  if (!UUID.test(orgId) || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return NextResponse.json({ error: "Invalid payment request" }, { status: 400 });
  const customer = readCustomer(parsed.data.customer);
  const admin = createAdminClient();
  let provider: string | null = null;
  let stage = "terminal lookup";
  try {
    const globalLimit = await consumeRequestRateLimit(admin, request, "payment_checkout", 10, 60)
      .catch(() => ({ allowed: true, unavailable: true }));
    if (globalLimit.unavailable) {
      logSecurityEvent("rate_limit_backend_unavailable", "payment_checkout");
    }
    if (!globalLimit.allowed) {
      logSecurityEvent("payment_checkout_rate_limited", "global_ip_window_exceeded");
      return NextResponse.json({ error: "Too many payment attempts" }, { status: 429 });
    }
    const { data: connection } = await withTimeout(
      admin.from("org_payment_connections").select("provider,terminal_id")
        .eq("org_id", orgId).eq("connection_kind", "regular").eq("status", "active").order("created_at", { ascending: true }).limit(1).maybeSingle(),
      10_000,
      "Payment terminal lookup timed out",
    );
    if (!connection || !isPaymentProvider(connection.provider)) return NextResponse.json({ error: "No configured payment terminal" }, { status: 503 });
    if (connection.provider !== "tranzila") {
      logSecurityEvent("payment_provider_blocked", "unverified_completion_flow");
      return NextResponse.json({ error: "This payment provider is not available" }, { status: 503 });
    }
    if (!customer) return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
    provider = connection.provider;
    const origin = request.nextUrl.origin;
    const reference = randomUUID();
    const campaignId = typeof parsed.data.campaign_id === "string" && UUID.test(parsed.data.campaign_id) ? parsed.data.campaign_id : null;
    const productId = typeof parsed.data.product_id === "string" && UUID.test(parsed.data.product_id) ? parsed.data.product_id : null;
    if (!campaignId && !productId) return NextResponse.json({ error: "Campaign or product reference required" }, { status: 400 });
    if (campaignId) {
      const { data: campaign } = await admin.from("campaigns").select("org_id,status").eq("id", campaignId).maybeSingle();
      if (!campaign || campaign.org_id !== orgId || campaign.status !== "active") return NextResponse.json({ error: "Campaign is not available" }, { status: 400 });
    }
    if (productId) {
      const { data: product } = await admin.from("products").select("org_id,price,active").eq("id", productId).maybeSingle();
      if (!product || product.org_id !== orgId || !product.active) return NextResponse.json({ error: "Product is not available" }, { status: 400 });
      amount = Number(product.price);
    }
    const defaultReturn = sameOriginUrl(parsed.data.return_url, origin) ?? `${origin}/`;
    const defaultCancel = sameOriginUrl(parsed.data.cancel_url, origin) ?? `${origin}/`;
    let returnUrl = defaultReturn;
    let cancelUrl = defaultCancel;
    let notifyUrl: string | undefined;
    const sessionExpiresAt = new Date(Date.now() + 20 * 60_000).toISOString();
    if (connection.provider === "tranzila") {
      const recent = await admin.from("payment_checkout_sessions").select("reference", { count: "exact", head: true }).eq("org_id", orgId).gte("created_at", new Date(Date.now() - 60_000).toISOString());
      if (recent.error) throw new Error("Unable to enforce payment rate limit");
      if ((recent.count ?? 0) >= 30) {
        logSecurityEvent("payment_checkout_rate_limited", "organization_window_exceeded");
        return NextResponse.json({ error: "Too many payment attempts" }, { status: 429 });
      }
      const callbackBase = `${origin}/api/payments/tranzila/callback?reference=${reference}`;
      returnUrl = `${callbackBase}&outcome=success`;
      cancelUrl = `${callbackBase}&outcome=failure`;
      notifyUrl = `${callbackBase}&outcome=notify`;
      const { error: sessionError } = await admin.from("payment_checkout_sessions").insert({
        reference, provider: "tranzila", terminal_id: connection.terminal_id, org_id: orgId, campaign_id: campaignId,
        product_id: productId, amount, currency: "ILS", expires_at: sessionExpiresAt, customer_email: customer?.email ?? "", customer_name: customer?.contact ?? "",
        customer_address: customer?.address ?? "", customer_city: customer?.city ?? "", customer_zip: customer?.zip ?? "", customer_country: customer?.country ?? "",
      });
      if (sessionError) throw new Error("Unable to create payment session");
    }
    stage = "provider handshake";
    const checkout = await withTimeout(
      createHostedCheckout({
        provider: connection.provider as PaymentProvider,
        terminalId: connection.terminal_id,
        amount,
        currency: "ILS",
        reference,
        expiresAt: sessionExpiresAt,
        returnUrl,
        cancelUrl,
        notifyUrl,
        customer: customer ?? undefined,
      }),
      15_000,
      "Payment terminal initialization timed out",
    );
    if (formSubmission) {
      const nonce = request.headers.get("x-nonce");
      if (!nonce) throw new Error("Payment security nonce unavailable");
      return hostedNavigationResponse(checkout, nonce);
    }
    return NextResponse.json(checkout, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Payment checkout initialization failed", {
      stage,
      provider,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Payment terminal is not ready" }, { status: 503 });
  }
}
