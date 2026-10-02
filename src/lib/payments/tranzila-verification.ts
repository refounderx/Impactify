import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { findTerminalCredential } from "@/lib/payments/server-config";
import {
  createCallbackProof,
  validateReportedTransaction,
  verifyCallbackProof,
  verifyLegacyCallbackProof,
  type CheckoutProofInput,
  type ReportedTransaction,
} from "@/lib/payments/security-contract";

export function createTranzilaCallbackProof(input: CheckoutProofInput) {
  const credential = findTerminalCredential("tranzila", input.terminalId);
  if (!credential?.secret) throw new Error("Tranzila callback credentials unavailable");
  return createCallbackProof(credential.secret, input);
}

export function verifyTranzilaCallbackProof(input: CheckoutProofInput, supplied: string) {
  const credential = findTerminalCredential("tranzila", input.terminalId);
  if (!credential?.secret) return false;
  return verifyCallbackProof(credential.secret, input, supplied);
}

export function verifyLegacyTranzilaCallbackProof(terminalId: string, reference: string, supplied: string) {
  const credential = findTerminalCredential("tranzila", terminalId);
  if (!credential?.secret) return false;
  return verifyLegacyCallbackProof(credential.secret, terminalId, reference, supplied);
}

export async function verifyTranzilaTransaction(
  terminalId: string,
  transactionIndex: number,
  expectedAmount: number,
  expectedCurrency: string,
) {
  const credential = findTerminalCredential("tranzila", terminalId);
  if (!credential?.appKey || !credential.secret) throw new Error("Tranzila verification credentials unavailable");
  const requestTime = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(40).toString("hex");
  const accessToken = createHmac("sha256", `${credential.secret}${requestTime}${nonce}`).update(credential.appKey).digest("hex");
  const response = await fetch("https://api.tranzila.com/v1/transactions", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(12_000),
    headers: {
      "Content-Type": "application/json", "X-tranzila-api-app-key": credential.appKey,
      "X-tranzila-api-request-time": requestTime, "X-tranzila-api-nonce": nonce,
      "X-tranzila-api-access-token": accessToken,
    },
    body: JSON.stringify({ terminal_name: terminalId, transaction_index: transactionIndex }),
  });
  const body = await response.json().catch(() => null) as { transactions?: ReportedTransaction[] } | ReportedTransaction[] | null;
  const transactions = Array.isArray(body) ? body : body?.transactions;
  const transaction = transactions?.find((item) => Number(item.index) === transactionIndex);
  if (!response.ok || !transaction) throw new Error("Tranzila transaction was not found");
  return validateReportedTransaction(transaction, {
    transactionIndex,
    terminalId,
    amount: expectedAmount,
    currency: expectedCurrency,
  });
}
