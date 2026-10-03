# Payment Security Review — updated 2026-10-03

## Executive summary

The Tranzila path has strong server-side transaction binding, authenticated provider verification, atomic donation completion, replay protection, tenant-isolated terminal administration, and a hosted payment page that keeps card data outside Impactify. No confirmed critical or high-severity defect was found in the reviewed code.

The 2026-10-03 remediation adds safe reconciliation before expiry, fixes the PII cleanup defect, removes legacy callback proofs, blocks incomplete Cardcom/Grow checkout paths, hardens rate-limit identity, extends nonce CSP to the full application, and adds CSP reporting. Three database migrations are now applied. The latest repository hardening adds a known-good lookup circuit breaker, constant-time Cron authentication, bounded backlog handling, persistence-failure reporting, transient cache recovery, and a full dependency audit with one expiring development-only exception; this latest code still needs production deployment evidence.

Production readiness remains **conditional**. A non-PII diagnostic proved that the four original sessions were marked `expired/not_found` by the old cleanup path with zero reconciliation attempts and no checked timestamp. They are now safely requeued as `retry`, with PII still blank, and can no longer become `not_found` unless a completed checkout for the same terminal passes the positive control. The live database currently has no completed checkout sample, the new Supabase cleanup job has not recorded its first successful run, manual-review contact/alert operations are incomplete, and `CRON_SECRET`, the real payment/account-claim flow, production CSP/cache behavior, WAF enforcement, and external assurance remain unverified.

This is an engineering review, not a penetration-test certificate, PCI attestation, or legal opinion.

## Current evidence

| Evidence | Result |
|---|---|
| Latest GitHub Security CI | Passed at commit `2478f97`, run `37124684278`, in 1 minute 7 seconds; lint, typecheck, 7 tests, the full dependency audit, history scan, production build, and client-bundle scan all completed |
| Previous failed CI | Commit `a12bede`, run `37115752887`, failed because the full dependency audit began flagging the newly published unpatched development-only `braces` advisory; the CI policy was corrected without weakening the production dependency gate |
| Local TypeScript after remediation | Passed |
| Local unit tests after remediation | 7/7 passed with Node 24, including unset/short/wrong/exact Cron-secret cases |
| Local ESLint after CI repair | Passed with 0 errors and 0 warnings |
| Local production build after remediation | Passed with Next.js webpack; local Turbopack worker creation remains blocked by the Windows execution environment |
| Local full dependency audit | Passed: zero production findings; five transitive development records resolve only to `GHSA-vfj7-8cjw-p6xm`, whose allowlist expires on 2026-10-31 |
| Live Supabase after provenance repair | `20261003120000` installed; `unverified_not_found_count=0`, `open_reconciliation_queue_count=4`, `safely_requeued_legacy_count=4`, and `closed_session_pii_count=0` |
| New migrations applied live | Yes: `20261003110000`, `20261003111000`, and `20261003120000` |
| Production deployment | The prior remediation commit is deployed; the positive-control and route-robustness hardening in this report still requires a new Vercel deployment and an authenticated Cron run |
| Live payment/account claim after remediation | Not run |

Claims in this report distinguish verified live state from local implementation. Security CI is now verified green; external configuration and live transaction claims remain conditional until separately evidenced.

## Remediation implemented in the repository

### R-01 — Reconciliation before destructive cleanup

`20261003110000_payment_reconciliation_and_cleanup.sql` adds:

- reconciliation state and attempt metadata on checkout sessions;
- a service-only, RLS-protected, non-PII `payment_reconciliation_alerts` table;
- a service-only `record_payment_reconciliation` function;
- `manual_review` state for a verified provider charge that cannot be auto-completed;
- a 48-hour grace period before a provider “not found” result can expire a session;
- a seven-day safety transition from stale `pending` to `manual_review`, with PII scrubbing and an alert rather than silent loss;
- a canonical daily Supabase Cron definition.

The Vercel route `/api/internal/payment-reconciliation` is protected by `CRON_SECRET`. It discovers Tranzila terminal field 20 through the official terminal-settings endpoint, filters the authenticated Reports API by the configured reference field, validates terminal, transaction index, approval code, amount, and currency, and records only non-sensitive aggregate outcomes.

The hardened route now revalidates a recent completed checkout for the same terminal before permitting any negative lookup to become `not_found`. If no completed control exists or the control fails, the session stays in `retry` and the invocation returns a degraded result. Work is bounded to 20 candidates and a 45-second processing budget; remaining backlog, oldest queued time, and persistence failures are surfaced without donor data.

Late valid callbacks no longer retry forever. They are reverified through Tranzila, moved to manual review, and the donor is told not to pay again.

### R-02 — Cleanup logic and Cron identity

The old function changed an expired `pending` row only when at least one PII field was non-empty. The replacement separates financial state handling from PII blanking, so an already-scrubbed row cannot remain pending forever.

The replacement also permits the intended `pg_cron` Postgres session while keeping browser roles revoked. The verifier now reports these independently:

- canonical Cron definition;
- execution username;
- successful execution within 36 hours;
- expired pending totals and expired-pending PII;
- closed-session PII;
- open reconciliation alerts.

`20261003111000_payment_completion_reconciliation_status.sql` makes atomic checkout completion update reconciliation state in the same transaction.

### R-03 — Callback and provider hardening

- Legacy versionless callback proofs were removed. Only proof version 2, bound to terminal/reference/amount/currency/expiry, is accepted.
- Callback verification remains provider-backed and transaction IDs remain unique.
- The incomplete Cardcom initialization path is blocked server-side. Only Tranzila can start checkout until another provider has equivalent completion verification and replay protection.
- Callback traffic has a high non-interactive application limit; limiter failure remains fail-open so a real PSP notification is not discarded.

### R-04 — Rate-limit identity and secrets

- The limiter now uses a dedicated `RATE_LIMIT_HMAC_SECRET`, not the Supabase service-role key.
- Production trusts only Vercel's platform-set `x-vercel-forwarded-for`; generic forwarded headers are accepted only outside production.
- IPv6 addresses are normalized to a `/64` bucket and IPv4-mapped addresses are handled as IPv4.
- Donation registration now fails closed when rate limiting is unavailable. Checkout remains fail-open for availability and logs a bounded event; WAF remains the required outer control.
- No IP address, donor field, credential, or token is logged.

### R-05 — CSP and dependency controls

- A fresh nonce plus `strict-dynamic` is now applied across the application; the old static `script-src 'unsafe-inline'` policy was removed.
- The payment surface retains the tighter frame policy; approved YouTube/Vimeo frames remain limited to the general application policy.
- `report-uri` and `Reporting-Endpoints` send bounded CSP reports to an endpoint that validates type/size, stores no report body, and emits only a generic event.
- Security CI runs a full production-and-development dependency audit. Production findings at Moderate or higher always fail. Development findings also fail unless every chain resolves only to the exact `GHSA-vfj7-8cjw-p6xm` URL.
- The single exception is owned by Impactify maintainers and expires on 2026-10-31. GitHub lists no patched `braces` release as of 2026-10-03, so the development-only availability risk is temporarily tracked rather than forcing a breaking Next.js downgrade.

## Open findings and release gates

### F-01 — Database remediation applied; reconciliation queue remains (Partial)

All three 2026-10-03 migrations are installed. `payment_security_qa.sql` succeeded and rolled back. The latest targeted verification reports no unverified `not_found` rows and no closed-session PII, but correctly exposes four requeued legacy sessions that still require provider reconciliation.

The applied and verified order was:

1. `supabase/migrations/20261003110000_payment_reconciliation_and_cleanup.sql`
2. `supabase/migrations/20261003111000_payment_completion_reconciliation_status.sql`
3. `supabase/migrations/20261003120000_requeue_unverified_reconciliation.sql`
4. `supabase/scripts/payment_security_qa.sql`
5. `supabase/scripts/verify_current_payment_sql_status.sql`

The remaining database signals are the four-row reconciliation queue and `cleanup_cron_recent_success=false`. Neither may be treated as resolved until the hardened route and the replacement cleanup job run successfully.

### F-02 — Deployment secrets need Dashboard verification (Medium, release blocker)

The reconciliation route and `vercel.json` schedule are deployed. Verify these production-only Vercel variables exist as Sensitive values:

- `RATE_LIMIT_HMAC_SECRET`: a new random value of at least 32 characters;
- `CRON_SECRET`: a separate random value of at least 16 characters.

Do not reuse Supabase or Tranzila credentials. `vercel.json` schedules reconciliation daily at 01:30 UTC, before Supabase cleanup at 02:17 UTC. Vercel sends `CRON_SECRET` as a Bearer token.

### F-03 — Tranzila field-20 configuration needs live proof (Medium, release blocker)

The durable reconciliation assumes the checkout `DCdisable` reference is stored in terminal user-defined field 20. The code discovers the terminal's actual `api_parameter_name`, but production must prove that one known transaction returns the same internal reference as `user_defined_20`. If configuration is missing, reconciliation fails safely to `retry`; it does not expire the session.

### F-04 — Original expired-session provenance identified; provider outcomes remain open (Medium, release blocker)

The non-PII diagnostic found all four rows in `expired/not_found` with `reconciliation_attempts=0`, `reconciliation_checked_at is null`, and no provider transaction. This proves that the old cleanup function changed their financial state without a Tranzila lookup; the replacement Cron did not produce that result.

Migration `20261003120000` requeues exactly that proof pattern by changing only `reconciliation_status` to `retry`; it does not restore or expose PII. The post-migration result is `unverified_not_found_count=0`, `open_reconciliation_queue_count=4`, and `closed_session_pii_count=0`. Each row still requires a provider-backed outcome before this finding closes. Future reconciliation behavior follows these rules:

- no approved Tranzila transaction after the 48-hour grace period: `expired`, PII blank, outcome `not_found`;
- approved matching transaction without a completed donation: `manual_review`, PII blank after cleanup, open non-PII alert;
- transient API/configuration failure: `retry`, never silently expired.

Every open alert must be investigated and marked resolved/dismissed by an authorized operator. No operator UI exists yet; this remains a restricted database operation.

### F-05 — Live end-to-end flow is unverified (Medium, release blocker)

Run one low-value real payment after deployment and verify:

1. hosted page opens and succeeds;
2. version-2 proof and Reports lookup pass;
3. exactly one donation is created after duplicate Notify delivery;
4. receipt/thanks page displays;
5. account opt-in is unchecked by default;
6. magic link verifies email, completes the profile, and links the donation;
7. a deliberately late callback enters manual review and tells the donor not to retry.

### F-06 — WAF and monitoring remain external (Medium)

Configure Vercel WAF rules for checkout, registration, CSP reports, and obvious abuse. Begin in Log mode, observe legitimate traffic, then enforce. Do not use an interactive challenge on the Tranzila callback or internal Cron route. Alert on reconciliation failures, open manual reviews, failed Supabase Cron runs, and `rate_limit_backend_unavailable`.

### F-07 — Supabase Auth and email policy remain unverified (Medium)

Confirm the production Site URL and exact redirect allowlist, short OTP expiry, abuse limits, session lifetime, and a production custom SMTP provider. Local configuration is not evidence of Dashboard settings.

### F-08 — Independent assurance and compliance remain open

An authenticated external penetration test, retest, and PCI/privacy scope review are still required before claiming “fully secure,” “penetration-tested,” or “PCI compliant.” Hosted redirection materially reduces card-data exposure but does not by itself prove compliance.

### F-09 — Automated integration depth remains limited (Low)

Unit tests cover proof binding, provider transaction matching, origin validation, nonce CSP, and IP normalization. CI still lacks an ephemeral Supabase integration environment, callback replay integration tests, and automated Tranzila sandbox/production verification. The SQL tenant QA remains a manual Dashboard transaction.

### F-10 — Unpatched development-only `braces` advisory (Low, tracked)

The full dependency audit reports `GHSA-vfj7-8cjw-p6xm` through `eslint-config-next` → `fast-glob` → `micromatch` → `braces`. GitHub currently lists no patched version. The package is not included in the production dependency audit or application runtime. Security CI now fails every other Moderate-or-higher development finding and allows this exact advisory only through 2026-10-31; do not use `npm audit fix --force`, which proposes a breaking Next.js/ESLint downgrade.

### F-11 — Positive-control circuit breaker implemented; live sample missing (Medium, release blocker)

The repository now blocks `not_found` unless a recent completed checkout for the same terminal is found through field 20 and fully revalidated against its stored transaction ID, amount, currency, and terminal. A missing or failing control leaves the candidate in `retry` and makes the Cron invocation fail visibly.

The live database currently reports `completed_sessions=0`, so production cannot yet exercise the positive-control success path. Complete one low-value verified checkout, deploy the hardening, and confirm that both the control and a candidate lookup behave correctly. Operator notification for control failure remains part of F-13.

### F-12 — Manual-review contact retention is unresolved (Medium, privacy and donor-remediation decision)

The cleanup function blanks all contact fields for `manual_review`. Those rows represent possible paid-but-unrecorded donations; immediately losing every contact channel may prevent receipt correction, refund coordination, or donor notification. Define the minimum required contact data, likely email only, retain it only while the alert is open and for a bounded maximum period, restrict access to the incident operator, and scrub it when the alert is resolved or the retention limit expires. Privacy counsel must approve the lawful basis and duration before this behavior changes.

### F-13 — Reconciliation alerts lack delivery and an operator runbook (Medium, release blocker)

Alerts are stored in an RLS-protected table, but there is no operator UI, notification integration, named owner, or documented resolution procedure. A paid-but-unrecorded donation requires human attention within hours. Before live traffic, send every new/open manual-review alert to a named owner through an approved channel, monitor delivery failures, and document lookup, receipt/refund, donor-contact, resolution, and audit steps.

### F-14 — Reconciliation route robustness hardened locally; deployment verification open (Medium)

- `CRON_SECRET` is compared through fixed-length HMAC digests with `timingSafeEqual`; unset, short, wrong, malformed, and exact cases are covered.
- Each run reads at most 21 candidates, processes at most 20 within 45 seconds, and reports remaining backlog plus the oldest queued timestamp.
- A persistence failure, deferred negative decision, provider failure, or remaining backlog returns `503` instead of a false success.
- A rejected field-configuration promise is evicted immediately, so a later invocation can recover without a cold start.

Local lint, typecheck, tests, dependency audit, and webpack production build pass. The remaining requirement is to deploy this version and capture one authenticated production Cron result.

### F-15 — Production nonce, caching, and capacity behavior is unverified (Medium, operational)

App-wide nonce CSP makes requests dynamic. Verify two production responses have different nonces, confirm protected and public pages are not cached with a reused nonce, record CDN/origin cache headers, and compare latency/origin load against the prior baseline. The CSP-report endpoint already validates size/type and applies the database rate limiter; it still needs an outer WAF rule and capacity evidence because it is public and unauthenticated.

### F-16 — Development-dependency audit exception narrowed (Closed, expiry tracked)

`npm run security:audit` now checks production dependencies separately and then evaluates the full development graph. Only chains rooted exclusively at `https://github.com/advisories/GHSA-vfj7-8cjw-p6xm` are allowed. The exception names its owner and reason and expires on 2026-10-31; an expired or additional Moderate-or-higher advisory fails the command.

## Confirmed challenges that are not open defects

- The reconciliation route fails closed when `CRON_SECRET` is absent, short, malformed, or wrong, and the exact-secret comparison is constant-time.
- The callback validates the version-2 HMAC proof and transaction index before calling the Tranzila Reports API.
- Supabase cleanup does not expire a session based on schedule order; a stale pending row moves to `manual_review` with an alert. The unresolved problem is contact scrubbing and operator handling.
- The CSP-report endpoint already has a database-backed rate limit. WAF and production load evidence remain open.

## Next action plan

### Phase 0 — Preserve evidence before changing data

1. **Completed:** the non-PII provenance report proved four legacy cleanup outcomes with no provider lookup; migration `20261003120000` requeued them without restoring PII.
2. Verify `CRON_SECRET` and `RATE_LIMIT_HMAC_SECRET` exist as separate Sensitive Production values, then capture one authenticated Vercel Cron result without logging either secret.
3. Create one verified low-value checkout and prove field 20 round-trips its Impactify reference as the per-terminal positive control.
4. Re-run the consolidated SQL verifier after the hardened reconciliation route and the first Supabase cleanup execution; preserve the result with an empty queue, every boolean true, and every defect count zero.

### Phase 1 — Implement financial-safety controls

1. **Implemented, deployment pending:** per-terminal known-good positive control and circuit breaker before any `not_found` outcome.
2. **Implemented, deployment pending:** constant-time Cron authentication, regression tests, persistence-failure handling, bounded batches, backlog-age telemetry, and rejected-cache recovery.
3. Change manual-review retention only after privacy approval, retaining the minimum contact channel until resolution or a hard deadline.
4. Deliver reconciliation alerts to a named operator and add a tested resolution runbook.
5. **Implemented:** full dependency auditing with the single advisory allowlist expiring on 2026-10-31.

### Phase 2 — Production verification

1. Deploy the hardening changes and run unit, callback-replay, reconciliation, and tenant-isolation tests.
2. Run a low-value real payment, duplicate Notify, receipt, account opt-in/magic-link claim, and deliberately late callback; verify the alert reaches the named operator.
3. Measure production nonce rotation, cache headers, latency, and origin load; configure WAF rules in Log mode and then enforce reviewed thresholds.
4. Complete external penetration testing and applicable PCI/privacy review before removing the conditional-readiness label.

## Acceptance criteria

Production readiness changes from conditional to approved only when every row below is verified:

| Criterion | Status | Evidence / remaining action |
|---|---|---|
| All remediation migration versions installed | Verified | `20261003110000`, `20261003111000`, and `20261003120000` are present |
| Tenant payment QA | Verified | `payment_security_qa.sql` succeeded and rolled back |
| Consolidated SQL verifier | Partial | Targeted verification exposes four intentionally requeued sessions; the full verifier now also counts unverified negative outcomes and the open queue |
| Cleanup job successful within 36 hours | Open | Re-run the verifier after the next scheduled execution |
| Original expired references have recorded non-sensitive outcomes | Partial | Proven to be old-cleanup outcomes and requeued; provider-backed outcomes are still required for all four |
| Vercel reconciliation Cron | Open | Verify `CRON_SECRET` in Production and record a successful invocation with no secret in logs |
| Known-good reconciliation circuit breaker | Partial | Implemented in code; the live database has no completed checkout sample and the deployment path is unverified |
| Manual-review operations | Open | Approve bounded contact retention, deliver alerts to a named owner, and test the resolution runbook |
| Reconciliation route robustness | Partial | All listed code controls and local tests pass; deploy and capture one authenticated Cron result |
| Security CI and production build | Verified | Run `37124684278` passed at `2478f97` |
| Full development-dependency audit | Verified locally | Zero production findings; only `GHSA-vfj7-8cjw-p6xm` is allowlisted, through 2026-10-31; confirm the next Security CI run |
| Real payment and account-claim flow | Open | Test payment, duplicate callback, receipt, opt-in, magic link, and donor-area visibility |
| Production CSP/cache behavior | Open | Prove per-response nonce rotation, safe cache headers, acceptable latency, and bounded CSP-report load |
| WAF controls | Open | Review Log-mode evidence, then activate enforcement without challenging provider callbacks or Cron |
| Independent assurance | Open | Complete external penetration testing and applicable PCI/privacy review |

## Current risk statement

The code-level design is materially stronger and no confirmed Critical/High runtime issue is open. Production remains **conditionally ready, not fully approved**: the four legacy sessions are safely queued but unresolved; the positive-control and route hardening are not yet evidenced in production; Vercel/Supabase scheduled runs, manual-review contact and alert operations, production CSP/cache behavior, the real payment/account claim, WAF, and external assurance remain unverified.

## Authoritative references

- [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Tranzila DirectNG](https://docs.tranzila.com/docs/payments-and-billing/iframe-integration-directng)
- [Tranzila Reports transactions](https://docs.tranzila.com/docs/reports/tranzila-transaction-reports-api/gettransactions)
- [Tranzila terminal fields](https://docs.tranzila.com/docs/reports/tranzila-transaction-reports-api/listterminalfields)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Vercel Cron security](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Vercel WAF custom rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules)
- [GitHub advisory GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [Node.js constant-time comparison (`crypto.timingSafeEqual`)](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
