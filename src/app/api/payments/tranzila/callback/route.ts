import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyLegacyTranzilaCallbackProof,
  verifyTranzilaCallbackProof,
  verifyTranzilaTransaction,
} from "@/lib/payments/tranzila-verification";
import { logSecurityEvent } from "@/lib/security-events";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function responseValues(request: NextRequest) {
  if (request.method === "GET") return request.nextUrl.searchParams;
  const type = request.headers.get("content-type")?.split(";", 1)[0].toLowerCase();
  if (type !== "application/x-www-form-urlencoded") return new URLSearchParams();
  const text = await request.text().catch(() => "");
  return text.length <= 16_384 ? new URLSearchParams(text) : new URLSearchParams();
}

async function handle(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference") ?? "";
  const outcome = request.nextUrl.searchParams.get("outcome") ?? "notify";
  const notify = outcome === "notify";
  if (!UUID.test(reference)) return NextResponse.json({ error: "Invalid callback" }, { status: 400 });
  const values = await responseValues(request);
  const responseCode = values.get("Response") ?? values.get("response") ?? "";
  const transactionIndex = Number(values.get("transaction_id") ?? values.get("index"));
  const admin = createAdminClient();
  const { data: session } = await admin.from("payment_checkout_sessions")
    .select("terminal_id,amount,currency,status,donation_id,receipt_id,expires_at,campaign_id,product_id").eq("reference", reference).maybeSingle();
  if (!session) return notify ? new NextResponse(null, { status: 404 }) : NextResponse.redirect(new URL("/", request.url));
  if (session.status === "completed" && session.donation_id && session.receipt_id) {
    const targetId = session.campaign_id ?? session.product_id;
    const url = new URL(`/donate/${targetId}/thanks?id=${session.donation_id}&receipt=${encodeURIComponent(session.receipt_id)}`, request.url);
    return notify ? new NextResponse(null, { status: 204 }) : NextResponse.redirect(url, 303);
  }
  if (outcome === "failure" || !["000", "0"].includes(responseCode)) {
    return notify ? new NextResponse(null, { status: 204 }) : NextResponse.redirect(new URL("/donate/cancelled", request.url), 303);
  }
  const checkoutProof = values.get("checkout_proof") ?? "";
  const proofVersion = values.get("proof_version");
  const currentProofValid = proofVersion === "2" && verifyTranzilaCallbackProof({
    terminalId: session.terminal_id,
    reference,
    amount: Number(session.amount),
    currency: session.currency,
    expiresAt: session.expires_at,
  }, checkoutProof);
  const inFlightLegacyProofValid = proofVersion === null
    && verifyLegacyTranzilaCallbackProof(session.terminal_id, reference, checkoutProof);
  if (values.get("reference") !== reference || (!currentProofValid && !inFlightLegacyProofValid)) {
    logSecurityEvent("payment_callback_rejected", "reference_or_proof_mismatch");
    return new NextResponse(null, { status: 400 });
  }
  if (!Number.isSafeInteger(transactionIndex) || transactionIndex <= 0) {
    logSecurityEvent("payment_callback_rejected", "invalid_transaction_index");
    return new NextResponse(null, { status: 400 });
  }
  try {
    const verified = await verifyTranzilaTransaction(session.terminal_id, transactionIndex, Number(session.amount), session.currency);
    const receiptId = `R-${new Date().getFullYear()}-${randomBytes(8).toString("hex").toUpperCase()}`;
    const { data, error } = await admin.rpc("complete_verified_checkout", {
      p_reference: reference, p_transaction_id: verified.transactionId, p_receipt_id: receiptId,
      p_last_four: verified.lastFour, p_card_brand: verified.cardBrand,
    });
    if (error || !data?.[0]) throw new Error("Unable to complete verified checkout");
    if (notify) return new NextResponse(null, { status: 204 });
    const targetId = session.campaign_id ?? session.product_id;
    const url = new URL(`/donate/${targetId}/thanks?id=${data[0].donation_id}&receipt=${encodeURIComponent(data[0].receipt_id)}`, request.url);
    return NextResponse.redirect(url, 303);
  } catch {
    logSecurityEvent("payment_callback_verification_failed", "provider_or_completion_verification_failed");
    return new NextResponse(null, { status: 503, headers: { "Retry-After": "15" } });
  }
}

export const GET = handle;
export const POST = handle;
