# Payment Security Review — updated 2026-10-03

## Executive summary

The Tranzila path has strong server-side transaction binding, authenticated provider verification, atomic donation completion, replay protection, tenant-isolated terminal administration, and a hosted payment page that keeps card data outside Impactify. No confirmed critical or high-severity defect was found in the reviewed code.

The 2026-10-03 remediation is deployed and both database migrations are applied. It adds safe reconciliation before expiry, fixes the PII cleanup defect, removes legacy callback proofs, blocks incomplete Cardcom/Grow checkout paths, hardens rate-limit identity, extends nonce CSP to the full application, and adds CSP reporting. Security CI blocks Moderate-or-higher vulnerabilities in production dependencies; a newly disclosed, unpatched `braces` advisory remains limited to ESLint's development-only dependency chain and is tracked separately below.

Production readiness remains **conditional**. Live database QA passed and all aggregate defect counts are zero, but the four original session outcomes lack provenance and the newly scheduled Supabase cleanup job has not yet recorded its first successful run. The field-20 lookup has no known-good circuit breaker, manual-review contact/alert operations are incomplete, and `CRON_SECRET`, the real payment/account-claim flow, production CSP/cache behavior, WAF enforcement, and external assurance remain unverified.

This is an engineering review, not a penetration-test certificate, PCI attestation, or legal opinion.

## Current evidence

| Evidence | Result |
|---|---|
| Latest GitHub Security CI | Passed at commit `c1bd19e`, run `37116404477`, in 56 seconds; lint, typecheck, tests, production dependency audit, history scan, production build, and client-bundle scan all completed |
| Previous failed CI | Commit `a12bede`, run `37115752887`, failed because the full dependency audit began flagging the newly published unpatched development-only `braces` advisory; the CI policy was corrected without weakening the production dependency gate |
| Local TypeScript after remediation | Passed |
| Local unit tests after remediation | 6/6 passed with Node 24 |
| Local ESLint after CI repair | Passed with 0 errors and 0 warnings |
| Local production build after remediation | Passed with Next.js webpack; local Turbopack worker creation remains blocked by the Windows execution environment |
| Live Supabase after remediation | Tenant QA passed; all security booleans true except first-run Cron recency; every defect count is 0 |
| New migrations applied live | Yes: `20261003110000` and `20261003111000` |
| Production deployment | Commit `c1bd19e` is pushed; the reconciliation route is present and rejects an unauthenticated request; Vercel Dashboard secret state and a successful scheduled invocation are not yet evidenced |
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
- Security CI blocks Moderate-or-higher findings in production dependencies with `npm audit --omit=dev --audit-level=moderate`.
- The full audit still reports `GHSA-vfj7-8cjw-p6xm` through ESLint tooling. GitHub lists no patched `braces` release as of 2026-10-03, so the development-only availability risk is tracked rather than forcing a breaking Next.js downgrade.

## Open findings and release gates

### F-01 — Database remediation applied (Closed)

Both 2026-10-03 migrations are installed. `payment_security_qa.sql` succeeded and rolled back, and the consolidated verifier reports zero expired pending sessions, zero PII-retention defects, zero duplicate active terminals, zero open reconciliation alerts, and zero stale rate-limit buckets.

The applied and verified order was:

1. `supabase/migrations/20261003110000_payment_reconciliation_and_cleanup.sql`
2. `supabase/migrations/20261003111000_payment_completion_reconciliation_status.sql`
3. `supabase/scripts/payment_security_qa.sql`
4. `supabase/scripts/verify_current_payment_sql_status.sql`

The only remaining database signal is `cleanup_cron_recent_success=false`, which is expected until the replacement job completes its first scheduled execution.

### F-02 — Deployment secrets need Dashboard verification (Medium, release blocker)

The reconciliation route and `vercel.json` schedule are deployed. Verify these production-only Vercel variables exist as Sensitive values:

- `RATE_LIMIT_HMAC_SECRET`: a new random value of at least 32 characters;
- `CRON_SECRET`: a separate random value of at least 16 characters.

Do not reuse Supabase or Tranzila credentials. `vercel.json` schedules reconciliation daily at 01:30 UTC, before Supabase cleanup at 02:17 UTC. Vercel sends `CRON_SECRET` as a Bearer token.

### F-03 — Tranzila field-20 configuration needs live proof (Medium, release blocker)

The durable reconciliation assumes the checkout `DCdisable` reference is stored in terminal user-defined field 20. The code discovers the terminal's actual `api_parameter_name`, but production must prove that one known transaction returns the same internal reference as `user_defined_20`. If configuration is missing, reconciliation fails safely to `retry`; it does not expire the session.

### F-04 — Original expired-session outcomes lack provenance (Medium, release blocker)

The post-migration verifier reports `expired_pending_session_count=0` and `open_reconciliation_alert_count=0`, but that aggregate result does not prove how the four previously observed rows left `pending`. The migration neither invokes reconciliation nor directly changes a pending row's status, while the replacement Cron has no recorded successful run and field-20 behavior is unverified. This finding is therefore reopened until provenance is recorded.

Run a non-PII diagnostic grouped by final `status`, `reconciliation_status`, attempt count, and whether `reconciliation_checked_at` is null. For each original reference, record the non-sensitive outcome and timestamp in a restricted operator record. Any row marked `expired/not_found` with no recorded provider lookup must be checked manually against Tranzila before it is treated as resolved. Future reconciliation behavior must follow these rules:

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

The full dependency audit reports `GHSA-vfj7-8cjw-p6xm` through `eslint-config-next` → `fast-glob` → `micromatch` → `braces`. GitHub currently lists no patched version. The package is not included in the production dependency audit or application runtime. Security CI therefore blocks production dependencies at Moderate severity while this development-tool availability issue remains tracked for an upstream release; do not use `npm audit fix --force`, which proposes a breaking Next.js/ESLint downgrade.

### F-11 — Reconciliation has no known-good positive control (Medium, release blocker)

The job treats a missing Reports match after 48 hours as `not_found`. A missing field-20 definition throws and becomes `retry`, but a terminal can be partially misconfigured: field 20 exists while checkout does not actually persist the reference. That condition looks like a legitimate “not found” and could expire a paid session.

Before any run is allowed to record `not_found`, probe at least one recent known-completed checkout per terminal. If its reference cannot be found and validated, open an operational alert, stop all expiry decisions for that terminal, and leave candidate sessions in `retry`. This must be a recurring circuit breaker, not only a one-time setup test.

### F-12 — Manual-review contact retention is unresolved (Medium, privacy and donor-remediation decision)

The cleanup function blanks all contact fields for `manual_review`. Those rows represent possible paid-but-unrecorded donations; immediately losing every contact channel may prevent receipt correction, refund coordination, or donor notification. Define the minimum required contact data, likely email only, retain it only while the alert is open and for a bounded maximum period, restrict access to the incident operator, and scrub it when the alert is resolved or the retention limit expires. Privacy counsel must approve the lawful basis and duration before this behavior changes.

### F-13 — Reconciliation alerts lack delivery and an operator runbook (Medium, release blocker)

Alerts are stored in an RLS-protected table, but there is no operator UI, notification integration, named owner, or documented resolution procedure. A paid-but-unrecorded donation requires human attention within hours. Before live traffic, send every new/open manual-review alert to a named owner through an approved channel, monitor delivery failures, and document lookup, receipt/refund, donor-contact, resolution, and audit steps.

### F-14 — Reconciliation route robustness needs hardening (Medium)

- Missing or shorter-than-16-character `CRON_SECRET` already fails closed, so `Bearer undefined` is not accepted. The valid-secret comparison is ordinary string equality rather than constant-time and has no route-level regression test.
- The job processes at most five sessions per daily invocation, with no backlog-age alert; a burst can outgrow cleanup capacity.
- The exception path increments the retry count and returns an overall successful response without checking whether the retry RPC itself succeeded.
- A rejected field-configuration promise remains cached for the lifetime of a warm instance, so a transient discovery failure can prevent recovery until a cold start.

Use constant-time secret comparison, add unset/short/wrong/correct-secret tests, fail the invocation when reconciliation state cannot be persisted, emit backlog/oldest-age metrics, process a bounded paginated batch, and evict rejected field-configuration promises.

### F-15 — Production nonce, caching, and capacity behavior is unverified (Medium, operational)

App-wide nonce CSP makes requests dynamic. Verify two production responses have different nonces, confirm protected and public pages are not cached with a reused nonce, record CDN/origin cache headers, and compare latency/origin load against the prior baseline. The CSP-report endpoint already validates size/type and applies the database rate limiter; it still needs an outer WAF rule and capacity evidence because it is public and unauthenticated.

### F-16 — Development-dependency audit exception is too broad (Low, supply-chain tracking)

`npm audit --omit=dev` keeps the production gate green but stops new development-only advisories from failing CI. Replace the broad omission with a full audit plus a narrow allowlist for `GHSA-vfj7-8cjw-p6xm`, including an owner, tracking link, and expiry/review date. Any other Moderate-or-higher development advisory must continue to fail the build.

## Confirmed challenges that are not open defects

- The reconciliation route fails closed when `CRON_SECRET` is absent or too short; only constant-time comparison and regression coverage remain open.
- The callback validates the version-2 HMAC proof and transaction index before calling the Tranzila Reports API.
- Supabase cleanup does not expire a session based on schedule order; a stale pending row moves to `manual_review` with an alert. The unresolved problem is contact scrubbing and operator handling.
- The CSP-report endpoint already has a database-backed rate limit. WAF and production load evidence remain open.

## Next action plan

### Phase 0 — Preserve evidence before changing data

1. Run a read-only, non-PII provenance report for the original four sessions: grouped final status/outcome, attempt counts, and checked-at presence; manually verify any outcome that lacks a provider lookup.
2. Verify `CRON_SECRET` and `RATE_LIMIT_HMAC_SECRET` exist as separate Sensitive Production values, then capture one authenticated Vercel Cron result without logging either secret.
3. Prove field 20 round-trips the Impactify reference for a known completed transaction on every active terminal.
4. Re-run the consolidated SQL verifier after the first Supabase cleanup execution and preserve the result showing every boolean true and every count zero.

### Phase 1 — Implement financial-safety controls

1. Add the per-terminal known-good positive control and circuit breaker before any `not_found` outcome.
2. Harden Cron authentication and tests; make persistence failures fail the job; add bounded pagination, backlog-age telemetry, and rejected-cache recovery.
3. Change manual-review retention only after privacy approval, retaining the minimum contact channel until resolution or a hard deadline.
4. Deliver reconciliation alerts to a named operator and add a tested resolution runbook.
5. Restore full dependency auditing with the single expiring advisory allowlist.

### Phase 2 — Production verification

1. Deploy the hardening changes and run unit, callback-replay, reconciliation, and tenant-isolation tests.
2. Run a low-value real payment, duplicate Notify, receipt, account opt-in/magic-link claim, and deliberately late callback; verify the alert reaches the named operator.
3. Measure production nonce rotation, cache headers, latency, and origin load; configure WAF rules in Log mode and then enforce reviewed thresholds.
4. Complete external penetration testing and applicable PCI/privacy review before removing the conditional-readiness label.

## Acceptance criteria

Production readiness changes from conditional to approved only when every row below is verified:

| Criterion | Status | Evidence / remaining action |
|---|---|---|
| Both migration versions installed | Verified | `20261003110000` and `20261003111000` are present |
| Tenant payment QA | Verified | `payment_security_qa.sql` succeeded and rolled back |
| Consolidated SQL verifier | Partial | Every count is 0 and every structural boolean is true; `cleanup_cron_recent_success` remains false until the replacement job completes its first run |
| Cleanup job successful within 36 hours | Open | Re-run the verifier after the next scheduled execution |
| Original expired references have recorded non-sensitive outcomes | Open | Aggregate pending and alert counts are 0, but the transition path and per-reference provider outcomes are unproven |
| Vercel reconciliation Cron | Open | Verify `CRON_SECRET` in Production and record a successful invocation with no secret in logs |
| Known-good reconciliation circuit breaker | Open | A completed-reference positive control must block `not_found` decisions when terminal lookup is unhealthy |
| Manual-review operations | Open | Approve bounded contact retention, deliver alerts to a named owner, and test the resolution runbook |
| Reconciliation route robustness | Open | Add constant-time auth tests, persistence-failure handling, bounded pagination, backlog telemetry, and rejected-cache eviction |
| Security CI and production build | Verified | Run `37116404477` passed at `c1bd19e` |
| Full development-dependency audit | Partial | Production dependencies are gated; replace `--omit=dev` with an expiring single-advisory allowlist |
| Real payment and account-claim flow | Open | Test payment, duplicate callback, receipt, opt-in, magic link, and donor-area visibility |
| Production CSP/cache behavior | Open | Prove per-response nonce rotation, safe cache headers, acceptable latency, and bounded CSP-report load |
| WAF controls | Open | Review Log-mode evidence, then activate enforcement without challenging provider callbacks or Cron |
| Independent assurance | Open | Complete external penetration testing and applicable PCI/privacy review |

## Current risk statement

The code-level design is materially stronger, Security CI is green, and no confirmed Critical/High runtime issue is open. Production remains **conditionally ready, not fully approved**, because historic reconciliation provenance, the field-20 positive control, Vercel/Supabase scheduled-run evidence, manual-review contact and alert operations, route robustness, production CSP/cache behavior, the real payment/account claim, WAF, and external assurance are still unverified.

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
