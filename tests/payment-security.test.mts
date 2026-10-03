import assert from "node:assert/strict";
import test from "node:test";
import {
  createCallbackProof,
  sameOriginUrl,
  validateReportedTransaction,
  verifyBearerSecret,
  verifyCallbackProof,
  type CheckoutProofInput,
} from "../src/lib/payments/security-contract.ts";
import { applicationContentSecurityPolicy, paymentContentSecurityPolicy } from "../src/lib/content-security-policy.ts";
import { normalizeRateLimitAddress } from "../src/lib/request-identity.ts";

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

test("internal Cron bearer authentication fails closed and accepts only the exact secret", () => {
  const secret = "test-only-cron-secret-value";
  assert.equal(verifyBearerSecret(undefined, `Bearer ${secret}`), false);
  assert.equal(verifyBearerSecret("too-short", "Bearer too-short"), false);
  assert.equal(verifyBearerSecret(secret, null), false);
  assert.equal(verifyBearerSecret(secret, `bearer ${secret}`), false);
  assert.equal(verifyBearerSecret(secret, `Bearer ${secret}-wrong`), false);
  assert.equal(verifyBearerSecret(secret, `Bearer ${secret} `), false);
  assert.equal(verifyBearerSecret(secret, `Bearer ${secret}`), true);
});

test("rate-limit addresses reject invalid input and aggregate IPv6 by /64", () => {
  assert.equal(normalizeRateLimitAddress("203.0.113.7"), "203.0.113.7");
  assert.equal(normalizeRateLimitAddress("2001:db8:1234:5678::1"), "2001:0db8:1234:5678::/64");
  assert.equal(normalizeRateLimitAddress("2001:db8:1234:5678:ffff::9"), "2001:0db8:1234:5678::/64");
  assert.equal(normalizeRateLimitAddress("unknown"), null);
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
  assert.equal(policy.includes("report-to impactify-csp"), true);
});

test("application CSP also uses a nonce while retaining approved media frames", () => {
  const policy = applicationContentSecurityPolicy("app-nonce", false);
  assert.equal(policy.includes("'nonce-app-nonce'"), true);
  assert.equal(policy.includes("script-src 'self' 'unsafe-inline'"), false);
  assert.equal(policy.includes("frame-src https://www.youtube-nocookie.com https://player.vimeo.com"), true);
});
