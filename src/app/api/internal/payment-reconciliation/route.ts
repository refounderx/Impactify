import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findTranzilaTransactionByReference } from "@/lib/payments/tranzila-reconciliation";
import { validateReportedTransaction, verifyBearerSecret } from "@/lib/payments/security-contract";
import { logSecurityEvent } from "@/lib/security-events";

export const maxDuration = 60;
const GRACE_MILLISECONDS = 48 * 60 * 60 * 1_000;
const MAX_BATCH_SIZE = 20;
const PROCESSING_BUDGET_MILLISECONDS = 45_000;

type LookupControl = {
  reference: string;
  terminal_id: string;
  amount: number;
  currency: string;
  created_at: string;
  provider_transaction_id: number | null;
};

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!verifyBearerSecret(secret, request.headers.get("authorization"))) {
    return new NextResponse(null, { status: 401 });
  }

  const startedAt = Date.now();
  const admin = createAdminClient();
  const { data: sessions, error } = await admin.from("payment_checkout_sessions")
    .select("reference,terminal_id,amount,currency,created_at,expires_at")
    .in("status", ["pending", "expired"])
    .in("reconciliation_status", ["pending", "retry"])
    .lt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true })
    .limit(MAX_BATCH_SIZE + 1);
  if (error) return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });

  const queued = sessions ?? [];
  const batch = queued.slice(0, MAX_BATCH_SIZE);
  const terminalIds = [...new Set(batch.map((session) => session.terminal_id))];
  const controls = new Map<string, LookupControl>();
  await Promise.all(terminalIds.map(async (terminalId) => {
    const { data, error: controlError } = await admin.from("payment_checkout_sessions")
      .select("reference,terminal_id,amount,currency,created_at,provider_transaction_id")
      .eq("terminal_id", terminalId)
      .eq("status", "completed")
      .eq("reconciliation_status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1);
    if (controlError) {
      logSecurityEvent("payment_reconciliation_failed", "positive_control_query_failed");
    } else if (data?.[0]) {
      controls.set(terminalId, data[0]);
    }
  }));

  const controlHealth = new Map<string, boolean>();
  async function lookupIsHealthy(terminalId: string) {
    const cached = controlHealth.get(terminalId);
    if (cached !== undefined) return cached;
    const control = controls.get(terminalId);
    if (!control?.provider_transaction_id) {
      controlHealth.set(terminalId, false);
      logSecurityEvent("payment_reconciliation_failed", "positive_control_unavailable");
      return false;
    }
    try {
      const transaction = await findTranzilaTransactionByReference(terminalId, control.reference, control.created_at);
      if (!transaction) throw new Error("Positive control not found");
      validateReportedTransaction(transaction, {
        transactionIndex: control.provider_transaction_id,
        terminalId,
        amount: Number(control.amount),
        currency: control.currency,
      });
      controlHealth.set(terminalId, true);
      return true;
    } catch {
      controlHealth.set(terminalId, false);
      logSecurityEvent("payment_reconciliation_failed", "positive_control_failed");
      return false;
    }
  }

  const counts = { reviewed: 0, notFound: 0, retry: 0, deferredNotFound: 0, persistenceFailures: 0 };
  let processed = 0;
  let operationalFailures = 0;
  for (const session of batch) {
    if (Date.now() - startedAt >= PROCESSING_BUDGET_MILLISECONDS) break;
    processed += 1;
    try {
      const transaction = await findTranzilaTransactionByReference(session.terminal_id, session.reference, session.created_at);
      if (!transaction) {
        const oldEnough = Date.now() - new Date(session.expires_at).getTime() >= GRACE_MILLISECONDS;
        const lookupHealthy = oldEnough ? await lookupIsHealthy(session.terminal_id) : false;
        const canRecordNotFound = oldEnough && lookupHealthy;
        const result = await admin.rpc("record_payment_reconciliation", {
          p_reference: session.reference,
          p_outcome: canRecordNotFound ? "not_found" : "retry",
          p_transaction_id: null,
          p_reason: canRecordNotFound ? "provider_not_found" : (oldEnough ? "field_configuration_error" : "provider_error"),
        });
        if (result.error || !result.data) throw new Error("Unable to record reconciliation result");
        if (canRecordNotFound) counts.notFound += 1;
        else {
          counts.retry += 1;
          if (oldEnough) counts.deferredNotFound += 1;
        }
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
      operationalFailures += 1;
      const result = await admin.rpc("record_payment_reconciliation", {
        p_reference: session.reference,
        p_outcome: "retry",
        p_transaction_id: null,
        p_reason: "provider_error",
      });
      if (result.error || !result.data) counts.persistenceFailures += 1;
      else counts.retry += 1;
      logSecurityEvent("payment_reconciliation_failed", result.error || !result.data
        ? "retry_state_persistence_failed"
        : "provider_or_database_unavailable");
    }
  }

  const hasMore = queued.length > processed;
  if (hasMore) logSecurityEvent("payment_reconciliation_failed", "reconciliation_backlog_remaining");
  const ok = !hasMore && operationalFailures === 0 && counts.persistenceFailures === 0 && counts.deferredNotFound === 0;
  return NextResponse.json({
    ok,
    processed,
    hasMore,
    oldestQueuedAt: queued[0]?.expires_at ?? null,
    ...counts,
  }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
