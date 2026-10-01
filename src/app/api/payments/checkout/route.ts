import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readJsonBody, validateSameOriginMutation } from "@/lib/http-security";
import { createHostedCheckout } from "@/lib/payments/hosted-checkout";
import { isPaymentProvider, type PaymentProvider } from "@/lib/payments/provider-catalog";
import { randomUUID } from "node:crypto";

type Body = { org_id?: unknown; amount?: unknown; return_url?: unknown; cancel_url?: unknown };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!validateSameOriginMutation(request)) return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
  const parsed = await readJsonBody<Body>(request, 2_048);
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const orgId = typeof parsed.data.org_id === "string" ? parsed.data.org_id : "";
  const amount = Number(parsed.data.amount);
  if (!UUID.test(orgId) || !Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return NextResponse.json({ error: "Invalid payment request" }, { status: 400 });
  const admin = createAdminClient();
  const { data: connection } = await admin.from("org_payment_connections").select("provider,terminal_id,status")
    .eq("org_id", orgId).eq("connection_kind", "regular").in("status", ["setup_required", "pending_verification", "active"]).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!connection || !isPaymentProvider(connection.provider)) return NextResponse.json({ error: "No configured payment terminal" }, { status: 503 });
  const origin = request.nextUrl.origin;
  const returnUrl = typeof parsed.data.return_url === "string" && parsed.data.return_url.startsWith(origin) ? parsed.data.return_url : `${origin}/donate/complete`;
  const cancelUrl = typeof parsed.data.cancel_url === "string" && parsed.data.cancel_url.startsWith(origin) ? parsed.data.cancel_url : `${origin}/donate/cancelled`;
  try {
    const checkout = await createHostedCheckout({ provider: connection.provider as PaymentProvider, terminalId: connection.terminal_id, amount, reference: randomUUID(), returnUrl, cancelUrl });
    return NextResponse.json(checkout, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Payment terminal is not ready" }, { status: 503 });
  }
}
