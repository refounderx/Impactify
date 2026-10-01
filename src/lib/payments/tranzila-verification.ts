import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { findTerminalCredential } from "@/lib/payments/server-config";

type Transaction = {
  index?: unknown; amount?: unknown; currency?: unknown; processor_response_code?: unknown;
  child_terminal?: unknown; ccno?: unknown; card_description?: unknown;
};

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
  if (transaction.child_terminal && transaction.child_terminal !== terminalId) throw new Error("Tranzila terminal mismatch");
  if (transaction.currency !== undefined && !["1", "ILS"].includes(String(transaction.currency))) throw new Error("Tranzila currency mismatch");
  if (Math.abs(Number(transaction.amount) - expectedAmount) > 0.001) throw new Error("Tranzila amount mismatch");
  return {
    transactionId: transactionIndex,
    lastFour: typeof transaction.ccno === "string" ? transaction.ccno.slice(-4) : null,
    cardBrand: typeof transaction.card_description === "string" ? transaction.card_description.slice(0, 40) : null,
  };
}
