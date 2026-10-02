import "server-only";

type SecurityEvent =
  | "payment_callback_rejected"
  | "payment_callback_verification_failed"
  | "payment_checkout_rate_limited"
  | "registration_rate_limited"
  | "donation_claim_failed"
  | "rate_limit_backend_unavailable";

export function logSecurityEvent(event: SecurityEvent, reason: string) {
  console.warn("security_event", {
    event,
    reason,
    occurredAt: new Date().toISOString(),
  });
}
