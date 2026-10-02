import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  createCallbackProof,
  sameOriginUrl,
  validateReportedTransaction,
  verifyCallbackProof,
  verifyLegacyCallbackProof,
  type CheckoutProofInput,
} from "../src/lib/payments/security-contract.ts";
import { paymentContentSecurityPolicy } from "../src/lib/content-security-policy.ts";

const proofInput: CheckoutProofInput = {
  terminalId: "terminal-a",
  reference: "8dcc8eae-e18c-4af1-8bdc-a882f71e98b6",
  amount: 10,
  currency: "ILS",
  expiresAt: "2026-10-02T12:20:00.000Z",
};

test("same-origin URLs reject lookalikes and protocol-relative URLs", () => {
  const origin = "https://impactify.example";
  assert.equal(sameOriginUrl("https://impactify.example/donate/thanks", origin), "https://impactify.example/donate/thanks");
  assert.equal(sameOriginUrl("https://impactify.example.evil.test/", origin), null);
  assert.equal(sameOriginUrl("//evil.test/path", origin), null);
  assert.equal(sameOriginUrl("javascript:alert(1)", origin), null);
});

test("callback proof is constant-format and bound to every checkout field", () => {
  const secret = "test-only-secret-value";
  const proof = createCallbackProof(secret, proofInput);
  assert.match(proof, /^[a-f0-9]{64}$/);
  assert.equal(verifyCallbackProof(secret, proofInput, proof), true);
  for (const mutation of [
    { amount: 10.01 },
    { currency: "USD" },
    { terminalId: "terminal-b" },
    { reference: "7dcc8eae-e18c-4af1-8bdc-a882f71e98b6" },
    { expiresAt: "2026-10-02T12:21:00.000Z" },
  ]) {
    assert.equal(verifyCallbackProof(secret, { ...proofInput, ...mutation }, proof), false);
  }
  assert.equal(verifyCallbackProof(secret, proofInput, "not-a-proof"), false);
});

test("legacy callback proof is accepted only for its original terminal and reference", () => {
  const secret = "test-only-secret-value";
  const legacy = createHmac("sha256", secret)
    .update(`impactify:tranzila:${proofInput.terminalId}:${proofInput.reference}`)
    .digest("hex");
  assert.equal(verifyLegacyCallbackProof(secret, proofInput.terminalId, proofInput.reference, legacy), true);
  assert.equal(verifyLegacyCallbackProof(secret, proofInput.terminalId, "different-reference", legacy), false);
});

test("reported transaction must match identity, approval, terminal, currency, and amount", () => {
  const transaction = {
    index: 41711,
    amount: 10,
    currency: "1",
    processor_response_code: "000",
    child_terminal: "terminal-a",
    ccno: "4207",
    card_description: "Visa",
  };
  const expected = { transactionIndex: 41711, terminalId: "terminal-a", amount: 10, currency: "ILS" };
  assert.deepEqual(validateReportedTransaction(transaction, expected), {
    transactionId: 41711,
    lastFour: "4207",
    cardBrand: "Visa",
  });
  assert.throws(() => validateReportedTransaction({ ...transaction, index: 41712 }, expected), /transaction mismatch/);
  assert.throws(() => validateReportedTransaction({ ...transaction, processor_response_code: "001" }, expected), /declined/);
  assert.throws(() => validateReportedTransaction({ ...transaction, child_terminal: "terminal-b" }, expected), /terminal mismatch/);
  assert.throws(() => validateReportedTransaction({ ...transaction, currency: "2" }, expected), /currency mismatch/);
  assert.throws(() => validateReportedTransaction({ ...transaction, amount: 10.01 }, expected), /amount mismatch/);
});

test("payment CSP requires a nonce and never permits inline scripts", () => {
  const policy = paymentContentSecurityPolicy("nonce-value", false);
  const scriptDirective = policy.split("; ").find((part) => part.startsWith("script-src"));
  assert.equal(scriptDirective?.includes("'nonce-nonce-value'"), true);
  assert.equal(scriptDirective?.includes("'strict-dynamic'"), true);
  assert.equal(scriptDirective?.includes("'unsafe-inline'"), false);
  assert.equal(policy.includes("form-action 'self' https://directng.tranzila.com"), true);
});
