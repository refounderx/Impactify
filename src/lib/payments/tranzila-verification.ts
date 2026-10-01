import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { findTerminalCredential } from "@/lib/payments/server-config";

type Transaction = {
  index?: unknown; amount?: unknown; currency?: unknown; processor_response_code?: unknown;
  child_terminal?: unknown; ccno?: unknown; card_description?: unknown;
};

function callbackProof(secret: string, terminalId: string, reference: string) {
  return createHmac("sha256", secret).update(`impactify:tranzila:${terminalId}:${reference}`).digest("hex");
}

export function createTranzilaCallbackProof(terminalId: string, reference: string) {
  const credential = findTerminalCredential("tranzila", terminalId);
  if (!credential?.secret) throw new Error("Tranzila callback credentials unavailable");
  return callbackProof(credential.secret, terminalId, reference);
}

export function verifyTranzilaCallbackProof(terminalId: string, reference: string, supplied: string) {
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const credential = findTerminalCredential("tranzila", terminalId);
  if (!credential?.secret) return false;
  const expected = Buffer.from(callbackProof(credential.secret, terminalId, reference), "hex");
  return timingSafeEqual(expected, Buffer.from(supplied, "hex"));
}

export async function verifyTranzilaTransaction(terminalId: string, transactionIndex: number, expectedAmount: number) {
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
  const body = await response.json().catch(() => null) as { transactions?: Transaction[] } | Transaction[] | null;
  const transactions = Array.isArray(body) ? body : body?.transactions;
  const transaction = transactions?.find((item) => Number(item.index) === transactionIndex);
  if (!response.ok || !transaction) throw new Error("Tranzila transaction was not found");
  if (String(transaction.processor_response_code).padStart(3, "0") !== "000") throw new Error("Tranzila transaction was declined");
  if (transaction.child_terminal !== terminalId) throw new Error("Tranzila terminal mismatch");
  if (!["1", "ILS"].includes(String(transaction.currency))) throw new Error("Tranzila currency mismatch");
  const reportedAmount = Number(transaction.amount);
  if (!Number.isFinite(reportedAmount) || Math.abs(reportedAmount - expectedAmount) > 0.001) throw new Error("Tranzila amount mismatch");
  return {
    transactionId: transactionIndex,
    lastFour: typeof transaction.ccno === "string" ? transaction.ccno.slice(-4) : null,
    cardBrand: typeof transaction.card_description === "string" ? transaction.card_description.slice(0, 40) : null,
  };
}
