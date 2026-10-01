import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readJsonBody, validateSameOriginMutation } from "@/lib/http-security";
import { createHostedCheckout } from "@/lib/payments/hosted-checkout";
import { isPaymentProvider, type PaymentProvider } from "@/lib/payments/provider-catalog";
import { randomUUID } from "node:crypto";

type Customer = { contact: string; email: string; country: string; zip: string; address: string; city: string };
type Body = { org_id?: unknown; amount?: unknown; return_url?: unknown; cancel_url?: unknown; customer?: unknown };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const parsed = await readJsonBody<Body>(request, 2_048);
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const orgId = typeof parsed.data.org_id === "string" ? parsed.data.org_id : "";
  const amount = Number(parsed.data.amount);
  if (!UUID.test(orgId) || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return NextResponse.json({ error: "Invalid payment request" }, { status: 400 });
  const customer = readCustomer(parsed.data.customer);
  const admin = createAdminClient();
  let provider: string | null = null;
  let stage = "terminal lookup";
  try {
    const { data: connection } = await withTimeout(
      admin.from("org_payment_connections").select("provider,terminal_id,status")
        .eq("org_id", orgId).eq("connection_kind", "regular").in("status", ["setup_required", "pending_verification", "active"]).order("created_at", { ascending: true }).limit(1).maybeSingle(),
      10_000,
      "Payment terminal lookup timed out",
    );
    if (!connection || !isPaymentProvider(connection.provider)) return NextResponse.json({ error: "No configured payment terminal" }, { status: 503 });
    if (connection.provider === "tranzila" && !customer) return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
    provider = connection.provider;
    const origin = request.nextUrl.origin;
    const returnUrl = typeof parsed.data.return_url === "string" && parsed.data.return_url.startsWith(origin) ? parsed.data.return_url : `${origin}/donate/complete`;
    const cancelUrl = typeof parsed.data.cancel_url === "string" && parsed.data.cancel_url.startsWith(origin) ? parsed.data.cancel_url : `${origin}/donate/cancelled`;
    stage = "provider handshake";
    const checkout = await createHostedCheckout({ provider: connection.provider as PaymentProvider, terminalId: connection.terminal_id, amount, reference: randomUUID(), returnUrl, cancelUrl, customer: customer ?? undefined });
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
