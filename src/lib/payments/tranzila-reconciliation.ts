import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { findTerminalCredential } from "@/lib/payments/server-config";
import type { ReportedTransaction } from "@/lib/payments/security-contract";

type TerminalField = { field_id?: unknown; api_parameter_name?: unknown };
type ReportTransaction = ReportedTransaction & { user_defined_20?: unknown };
const referenceFields = new Map<string, Promise<string>>();

async function signedReportRequest(terminalId: string, path: string, body: Record<string, unknown>) {
  const credential = findTerminalCredential("tranzila", terminalId);
  if (!credential?.appKey || !credential.secret) throw new Error("Tranzila report credentials unavailable");
  const requestTime = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(40).toString("hex");
  const accessToken = createHmac("sha256", `${credential.secret}${requestTime}${nonce}`)
    .update(credential.appKey).digest("hex");
  const response = await fetch(`https://report.tranzila.com${path}`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "Content-Type": "application/json",
      "X-tranzila-api-app-key": credential.appKey,
      "X-tranzila-api-request-time": requestTime,
      "X-tranzila-api-nonce": nonce,
      "X-tranzila-api-access-token": accessToken,
    },
    body: JSON.stringify({ terminal_name: terminalId, ...body }),
  });
  const value = await response.json().catch(() => null) as unknown;
  if (!response.ok || value === null) throw new Error("Tranzila report request failed");
  return value;
}
async function loadReferenceField(terminalId: string) {
  const fields = await signedReportRequest(terminalId, "/v1/terminals/settings/fields/list", {});
  if (!Array.isArray(fields)) throw new Error("Tranzila field configuration unavailable");
  const match = (fields as TerminalField[]).find((field) => Number(field.field_id) === 20);
  const name = typeof match?.api_parameter_name === "string" ? match.api_parameter_name : "";
  if (!/^[A-Za-z0-9_]{1,80}$/.test(name)) throw new Error("Tranzila reference field unavailable");
  return name;
}

function referenceField(terminalId: string) {
  const existing = referenceFields.get(terminalId);
  if (existing) return existing;
  const pending = loadReferenceField(terminalId).catch((error: unknown) => {
    referenceFields.delete(terminalId);
    throw error;
  });
  referenceFields.set(terminalId, pending);
  return pending;
}

export async function findTranzilaTransactionByReference(
  terminalId: string,
  reference: string,
  createdAt: string,
) {
  const fieldName = await referenceField(terminalId);
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) throw new Error("Invalid reconciliation date");
  start.setUTCDate(start.getUTCDate() - 1);
  const body = await signedReportRequest(terminalId, "/v1/transaction", {
    transaction_start_date: start.toISOString().slice(0, 10),
    transaction_end_date: new Date().toISOString().slice(0, 10),
    page: 1,
    page_results: 10,
    ufields: [{ name: fieldName, operator: "equals", value: reference }],
  }) as { transactions?: ReportTransaction[] };
  const matches = (body.transactions ?? []).filter((item) => item.user_defined_20 === reference);
  if (matches.length > 1) throw new Error("Duplicate Tranzila reference");
  return matches[0] ?? null;
}
