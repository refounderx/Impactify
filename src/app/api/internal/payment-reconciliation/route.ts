import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findTranzilaTransactionByReference } from "@/lib/payments/tranzila-reconciliation";
import { validateReportedTransaction } from "@/lib/payments/security-contract";
import { logSecurityEvent } from "@/lib/security-events";

export const maxDuration = 60;
const GRACE_MILLISECONDS = 48 * 60 * 60 * 1_000;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16 || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse(null, { status: 401 });
  }
  const admin = createAdminClient();
  const { data: sessions, error } = await admin.from("payment_checkout_sessions")
    .select("reference,terminal_id,amount,currency,created_at,expires_at")
    .in("status", ["pending", "expired"])
    .in("reconciliation_status", ["pending", "retry"])
    .lt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true })
    .limit(5);
  if (error) return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });

  const counts = { reviewed: 0, notFound: 0, retry: 0 };
  for (const session of sessions ?? []) {
    try {
      const transaction = await findTranzilaTransactionByReference(session.terminal_id, session.reference, session.created_at);
      if (!transaction) {
        const oldEnough = Date.now() - new Date(session.expires_at).getTime() >= GRACE_MILLISECONDS;
        const outcome = oldEnough ? "not_found" : "retry";
        const result = await admin.rpc("record_payment_reconciliation", {
          p_reference: session.reference,
          p_outcome: outcome,
          p_transaction_id: null,
          p_reason: oldEnough ? "provider_not_found" : "provider_error",
        });
        if (result.error || !result.data) throw new Error("Unable to record reconciliation result");
        if (oldEnough) counts.notFound += 1; else counts.retry += 1;
        continue;
      }
      const transactionIndex = Number(transaction.index);
      const verified = validateReportedTransaction(transaction, {
        transactionIndex,
        terminalId: session.terminal_id,
        amount: Number(session.amount),
        currency: session.currency,
      });
      const result = await admin.rpc("record_payment_reconciliation", {
        p_reference: session.reference,
        p_outcome: "review",
        p_transaction_id: verified.transactionId,
        p_reason: "provider_match",
      });
      if (result.error || !result.data) throw new Error("Unable to record reconciliation review");
      counts.reviewed += 1;
      logSecurityEvent("payment_reconciliation_review", "provider_match_requires_manual_review");
    } catch {
      counts.retry += 1;
      await admin.rpc("record_payment_reconciliation", {
        p_reference: session.reference,
        p_outcome: "retry",
        p_transaction_id: null,
        p_reason: "provider_error",
      });
      logSecurityEvent("payment_reconciliation_failed", "provider_or_database_unavailable");
    }
  }
  return NextResponse.json({ ok: true, processed: sessions?.length ?? 0, ...counts }, { headers: { "Cache-Control": "no-store" } });
}
