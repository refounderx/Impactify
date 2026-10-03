# Payment Security Review — updated 2026-10-03

## Executive summary

The Tranzila path has strong server-side transaction binding, authenticated provider verification, atomic donation completion, replay protection, tenant-isolated terminal administration, and a hosted payment page that keeps card data outside Impactify. No confirmed critical or high-severity defect was found in the reviewed code.

The 2026-10-03 remediation is implemented locally but is **not yet deployed or applied to Supabase**. It adds safe reconciliation before expiry, fixes the PII cleanup defect, removes legacy callback proofs, blocks incomplete Cardcom/Grow checkout paths, hardens rate-limit identity, extends nonce CSP to the full application, adds CSP reporting, and raises the CI dependency gate to Moderate.

Production readiness remains **conditional**. The latest live database evidence still shows `cleanup_cron_active=false` and four expired `pending` sessions. Those values cannot change until the two new migrations are applied, the Vercel secrets and reconciliation Cron are deployed, and the post-deployment checks pass.

This is an engineering review, not a penetration-test certificate, PCI attestation, or legal opinion.

## Current evidence

| Evidence | Result |
|---|---|
| Previous GitHub Security CI | Passed at commit `f628813`, run `37046684184` |
| Local TypeScript after remediation | Passed |
| Local unit tests after remediation | 6/6 passed with Node 24 |
| Local ESLint after remediation | 0 errors; 3 pre-existing unrelated warnings |
| Local production build after remediation | Not completed: the sandbox denied Turbopack worker creation; this is not evidence of a code build failure |
| Live Supabase before remediation | All prior RLS/grant/function checks passed; Cron signature false; 4 expired pending sessions |
| New migrations applied live | No |
| Live payment/account claim after remediation | Not run |

Claims in this report distinguish verified live state from local implementation. A previous green CI run does not verify the uncommitted 2026-10-03 changes.

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
- Security CI now runs `npm audit --audit-level=moderate` instead of blocking only High/Critical findings.

## Open findings and release gates

### F-01 — Database remediation is not applied (Medium, release blocker)

The two 2026-10-03 migrations exist only in the repository. Until they are applied, the live cleanup defect and the four expired sessions remain unchanged.

Required order in the Supabase SQL Editor:

1. `supabase/migrations/20261003110000_payment_reconciliation_and_cleanup.sql`
2. `supabase/migrations/20261003111000_payment_completion_reconciliation_status.sql`
3. `supabase/scripts/payment_security_qa.sql`
4. `supabase/scripts/verify_current_payment_sql_status.sql`

Do not manually expire or delete the four rows before reconciliation.

### F-02 — Deployment secrets and Cron are not active (Medium, release blocker)

Add these production-only Vercel variables as Sensitive values and redeploy:

- `RATE_LIMIT_HMAC_SECRET`: a new random value of at least 32 characters;
- `CRON_SECRET`: a separate random value of at least 16 characters.

Do not reuse Supabase or Tranzila credentials. `vercel.json` schedules reconciliation daily at 01:30 UTC, before Supabase cleanup at 02:17 UTC. Vercel sends `CRON_SECRET` as a Bearer token.

### F-03 — Tranzila field-20 configuration needs live proof (Medium, release blocker)

The durable reconciliation assumes the checkout `DCdisable` reference is stored in terminal user-defined field 20. The code discovers the terminal's actual `api_parameter_name`, but production must prove that one known transaction returns the same internal reference as `user_defined_20`. If configuration is missing, reconciliation fails safely to `retry`; it does not expire the session.

### F-04 — Four existing sessions need recorded outcomes (Medium, open)

After deployment, invoke the secured reconciliation route or wait for its first run. Expected outcomes:

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

## Acceptance criteria

Production readiness changes from conditional to approved only when all of the following are recorded:

- both new migration versions appear in `supabase_migrations.schema_migrations`;
- `payment_security_qa.sql` succeeds and rolls back;
- the consolidated verifier has every boolean `true` and every count `0`;
- the cleanup job has a successful run within 36 hours;
- all four original references have non-sensitive reconciliation outcomes and no open alert;
- Vercel shows successful reconciliation Cron invocations with no secret in logs;
- the final Security CI for the deployed commit is green, including the Moderate dependency gate and production build;
- the real payment, duplicate callback, receipt, opt-in, magic-link claim, and donor-area visibility pass;
- WAF Log-mode evidence is reviewed and enforcement rules are activated;
- external penetration testing and applicable PCI/privacy review are completed.

## Current risk statement

The code-level design is materially stronger and no confirmed Critical/High issue is open. However, production is **not yet approved** because the database migrations, secrets, Cron execution, four-row reconciliation, final CI/build, live payment/account claim, WAF, and external assurance are still unverified.

## Authoritative references

- [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Tranzila DirectNG](https://docs.tranzila.com/docs/payments-and-billing/iframe-integration-directng)
- [Tranzila Reports transactions](https://docs.tranzila.com/docs/reports/tranzila-transaction-reports-api/gettransactions)
- [Tranzila terminal fields](https://docs.tranzila.com/docs/reports/tranzila-transaction-reports-api/listterminalfields)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Vercel Cron security](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Vercel WAF custom rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
