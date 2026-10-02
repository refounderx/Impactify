import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { readJsonBody, validateSameOriginMutation } from "@/lib/http-security";
import { logSecurityEvent } from "@/lib/security-events";
import { consumeRequestRateLimit } from "@/lib/request-rate-limit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RECEIPT = /^[A-Za-z0-9-]{1,80}$/;

export async function POST(request: NextRequest) {
  if (!validateSameOriginMutation(request)) return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
  const parsed = await readJsonBody<{ donation_id?: unknown; receipt_id?: unknown }>(request, 512);
  if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const donationId = typeof parsed.data.donation_id === "string" ? parsed.data.donation_id : "";
  const receiptId = typeof parsed.data.receipt_id === "string" ? parsed.data.receipt_id : "";
  if (!UUID.test(donationId) || !RECEIPT.test(receiptId)) return NextResponse.json({ error: "Invalid registration request" }, { status: 400 });
  const admin = createAdminClient();
  const globalLimit = await consumeRequestRateLimit(admin, request, "donation_registration", 5, 3_600)
    .catch(() => ({ allowed: true, unavailable: true }));
  if (globalLimit.unavailable) {
    logSecurityEvent("rate_limit_backend_unavailable", "donation_registration");
  }
  if (!globalLimit.allowed) {
    logSecurityEvent("registration_rate_limited", "global_ip_window_exceeded");
    return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
  }
  const { data: session } = await admin.from("payment_checkout_sessions")
    .select("customer_email,status,registration_opt_in_at").eq("donation_id", donationId).eq("receipt_id", receiptId).maybeSingle();
  if (!session || session.status !== "completed" || !session.customer_email) return NextResponse.json({ error: "Verified donation not found" }, { status: 404 });
  if (session.registration_opt_in_at && Date.now() - new Date(session.registration_opt_in_at).getTime() < 60_000) {
    logSecurityEvent("registration_rate_limited", "resend_cooldown");
    return NextResponse.json({ error: "A sign-in link was already requested. Please wait before trying again." }, { status: 429 });
  }
  const optInAt = new Date().toISOString();
  let optInUpdate = admin.from("payment_checkout_sessions")
    .update({ registration_opt_in_at: optInAt }).eq("donation_id", donationId);
  optInUpdate = session.registration_opt_in_at
    ? optInUpdate.eq("registration_opt_in_at", session.registration_opt_in_at)
    : optInUpdate.is("registration_opt_in_at", null);
  const { data: updatedSession, error: optInError } = await optInUpdate.select("reference").maybeSingle();
  if (optInError) return NextResponse.json({ error: "Unable to record registration approval" }, { status: 503 });
  if (!updatedSession) {
    logSecurityEvent("registration_rate_limited", "concurrent_request");
    return NextResponse.json({ error: "A sign-in link was already requested. Please wait before trying again." }, { status: 429 });
  }
  const sb = await createClient();
  const redirect = `${request.nextUrl.origin}/auth/callback?donation=${encodeURIComponent(donationId)}`;
  const { error } = await sb.auth.signInWithOtp({ email: session.customer_email, options: { emailRedirectTo: redirect } });
  if (error) return NextResponse.json({ error: "Unable to send sign-in link" }, { status: 503 });
  return NextResponse.json({ sent: true });
}
