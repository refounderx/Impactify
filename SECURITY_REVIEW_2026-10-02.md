# Payment Security Review — updated 2026-10-03

## Executive summary

The Tranzila path has strong server-side transaction binding, authenticated provider verification, atomic donation completion, replay protection, tenant-isolated terminal administration, and a hosted payment page that keeps card data outside Impactify. No confirmed critical or high-severity defect was found in the reviewed code.

The 2026-10-03 remediation is deployed and both database migrations are applied. It adds safe reconciliation before expiry, fixes the PII cleanup defect, removes legacy callback proofs, blocks incomplete Cardcom/Grow checkout paths, hardens rate-limit identity, extends nonce CSP to the full application, and adds CSP reporting. Security CI blocks Moderate-or-higher vulnerabilities in production dependencies; a newly disclosed, unpatched `braces` advisory remains limited to ESLint's development-only dependency chain and is tracked separately below.

Production readiness remains **conditional**. Live database QA passed and all aggregate defect counts are zero, but the newly scheduled Supabase cleanup job has not yet recorded its first successful run. `CRON_SECRET`, Tranzila field-20 behavior, the real payment/account-claim flow, WAF enforcement, and external assurance also remain unverified.

This is an engineering review, not a penetration-test certificate, PCI attestation, or legal opinion.

## Current evidence

| Evidence | Result |
|---|---|
| Previous GitHub Security CI | Passed at commit `f628813`, run `37046684184`; commit `a12bede` failed only because the full dependency audit began flagging the newly published unpatched development-only `braces` advisory |
| Local TypeScript after remediation | Passed |
| Local unit tests after remediation | 6/6 passed with Node 24 |
| Local ESLint after CI repair | Passed with 0 errors and 0 warnings |
| Local production build after remediation | Passed with Next.js webpack; local Turbopack worker creation remains blocked by the Windows execution environment |
| Live Supabase after remediation | Tenant QA passed; all security booleans true except first-run Cron recency; every defect count is 0 |
| New migrations applied live | Yes: `20261003110000` and `20261003111000` |
| Live payment/account claim after remediation | Not run |

Claims in this report distinguish verified live state from local implementation. The final CI rerun for the dependency-audit repair is still pending.

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

### F-04 — Existing expired sessions cleared from the pending queue (Closed at aggregate level)

The post-migration verifier reports `expired_pending_session_count=0` and `open_reconciliation_alert_count=0`. No donor or transaction identifiers were exposed during verification. Per-reference provider outcomes were not independently exported, so future reconciliation behavior must still follow these rules:

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

## Acceptance criteria

Production readiness changes from conditional to approved only when all of the following are recorded:

- both new migration versions appear in `supabase_migrations.schema_migrations`;
- `payment_security_qa.sql` succeeds and rolls back;
- the consolidated verifier has every boolean `true` and every count `0`;
- the cleanup job has a successful run within 36 hours;
- all four original references have non-sensitive reconciliation outcomes and no open alert;
- Vercel shows successful reconciliation Cron invocations with no secret in logs;
- the final Security CI for the deployed commit is green, including the Moderate production-dependency gate and production build;
- the real payment, duplicate callback, receipt, opt-in, magic-link claim, and donor-area visibility pass;
- WAF Log-mode evidence is reviewed and enforcement rules are activated;
- external penetration testing and applicable PCI/privacy review are completed.

## Current risk statement

The code-level design is materially stronger and no confirmed Critical/High runtime issue is open. However, production is **not yet approved** because the Vercel secret, first successful Cron execution, Tranzila field-20 proof, final CI rerun, live payment/account claim, WAF, and external assurance are still unverified.

## Authoritative references

- [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Tranzila DirectNG](https://docs.tranzila.com/docs/payments-and-billing/iframe-integration-directng)
- [Tranzila Reports transactions](https://docs.tranzila.com/docs/reports/tranzila-transaction-reports-api/gettransactions)
- [Tranzila terminal fields](https://docs.tranzila.com/docs/reports/tranzila-transaction-reports-api/listterminalfields)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Vercel Cron security](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Vercel WAF custom rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
