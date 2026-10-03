import { createHmac, timingSafeEqual } from "node:crypto";

export type CheckoutProofInput = {
  terminalId: string;
  reference: string;
  amount: number;
  currency: string;
  expiresAt: string;
};

export type ReportedTransaction = {
  index?: unknown;
  amount?: unknown;
  currency?: unknown;
  processor_response_code?: unknown;
  child_terminal?: unknown;
  ccno?: unknown;
  card_description?: unknown;
};

export type ExpectedTransaction = {
  transactionIndex: number;
  terminalId: string;
  amount: number;
  currency: string;
};

export function canonicalAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid checkout amount");
  return amount.toFixed(2);
}

export function callbackProofPayload(input: CheckoutProofInput) {
  const expiresAt = new Date(input.expiresAt);
  if (!input.terminalId || !input.reference || Number.isNaN(expiresAt.getTime())) {
    throw new Error("Invalid checkout proof input");
  }
  return [
    "impactify:tranzila:v2",
    input.terminalId,
    input.reference,
    canonicalAmount(input.amount),
    input.currency.toUpperCase(),
    expiresAt.toISOString(),
  ].join(":");
}

export function createCallbackProof(secret: string, input: CheckoutProofInput) {
  return createHmac("sha256", secret).update(callbackProofPayload(input)).digest("hex");
}

export function verifyCallbackProof(secret: string, input: CheckoutProofInput, supplied: string) {
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = Buffer.from(createCallbackProof(secret, input), "hex");
  const actual = Buffer.from(supplied, "hex");
  return timingSafeEqual(expected, actual);
}

export function verifyBearerSecret(secret: string | undefined, authorization: string | null) {
  if (!secret || secret.length < 16 || !authorization?.startsWith("Bearer ")) return false;
  const supplied = authorization.slice("Bearer ".length);
  if (!supplied) return false;
  const context = "impactify:internal-cron:v1";
  const expectedDigest = createHmac("sha256", secret).update(context).digest();
  const suppliedDigest = createHmac("sha256", supplied).update(context).digest();
  return timingSafeEqual(expectedDigest, suppliedDigest);
}

export function sameOriginUrl(value: unknown, origin: string) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin === origin ? url.toString() : null;
  } catch {
    return null;
  }
}

export function validateReportedTransaction(
  transaction: ReportedTransaction,
  expected: ExpectedTransaction,
) {
  if (Number(transaction.index) !== expected.transactionIndex) throw new Error("Tranzila transaction mismatch");
  if (String(transaction.processor_response_code).padStart(3, "0") !== "000") throw new Error("Tranzila transaction was declined");
  if (transaction.child_terminal !== expected.terminalId) throw new Error("Tranzila terminal mismatch");
  const expectedCurrency = expected.currency.toUpperCase();
  const acceptedCurrencies = expectedCurrency === "ILS" ? ["1", "ILS"] : [expectedCurrency];
  if (!acceptedCurrencies.includes(String(transaction.currency).toUpperCase())) throw new Error("Tranzila currency mismatch");
  const reportedAmount = Number(transaction.amount);
  if (!Number.isFinite(reportedAmount) || Math.abs(reportedAmount - expected.amount) > 0.001) {
    throw new Error("Tranzila amount mismatch");
  }
  return {
    transactionId: expected.transactionIndex,
    lastFour: typeof transaction.ccno === "string" ? transaction.ccno.slice(-4) : null,
    cardBrand: typeof transaction.card_description === "string" ? transaction.card_description.slice(0, 40) : null,
  };
}
