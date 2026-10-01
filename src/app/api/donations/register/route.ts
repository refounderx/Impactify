import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { readJsonBody, validateSameOriginMutation } from "@/lib/http-security";

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
  const { data: session } = await admin.from("payment_checkout_sessions")
    .select("customer_email,status").eq("donation_id", donationId).eq("receipt_id", receiptId).maybeSingle();
  if (!session || session.status !== "completed") return NextResponse.json({ error: "Verified donation not found" }, { status: 404 });
  await admin.from("payment_checkout_sessions").update({ registration_opt_in_at: new Date().toISOString() }).eq("donation_id", donationId).is("registration_opt_in_at", null);
  const sb = await createClient();
  const redirect = `${request.nextUrl.origin}/auth/callback?donation=${encodeURIComponent(donationId)}`;
  const { error } = await sb.auth.signInWithOtp({ email: session.customer_email, options: { emailRedirectTo: redirect } });
  if (error) return NextResponse.json({ error: "Unable to send sign-in link" }, { status: 503 });
  return NextResponse.json({ sent: true });
}
