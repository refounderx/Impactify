# Payment Security Review and Remediation Plan — 2026-10-02

## Executive summary

The reviewed Tranzila payment path has strong server-side transaction binding, provider-side transaction verification, atomic completion, tenant-isolated terminal administration, a nonce-based payment CSP, and controlled post-payment account claiming. No confirmed critical or high-severity defect was found in the reviewed payment path.

The application security pipeline is green at commit `f628813`: GitHub Security CI run `37046684184` passed lint, typecheck, five unit tests, dependency audit, Git-history secret scanning, a production build, and built-client secret scanning. ESLint reported zero errors and three pre-existing warnings. This supersedes the earlier report statement that post-push CI was pending.

The live Supabase status is not fully healthy. The latest read-only snapshot returned `all_checks_pass=false` for exactly two reasons:

- `cleanup_cron_active=false`: the verifier did not find a Cron row matching the required name, schedule, exact command, and active state. This is a configuration-signature mismatch until the job row and run history are inspected; it does not by itself prove that no cleanup job runs.
- `expired_pending_session_count=4`: four payment checkout sessions are still `pending` after expiry. The aggregate supplied so far does not show whether those rows still contain personal data.

All other reported database checks passed: required migrations and tables exist; privileged functions have fixed `search_path`; grants and RLS are correct; browser roles are blocked from payment tables; terminal uniqueness and the audit trigger are active; no duplicate active terminal exists; no PII was found in rows already marked `expired`/`failed` or in old completed rows; and no stale rate-limit bucket was found.

This is an engineering review, not a penetration-test certificate, PCI attestation, or legal opinion. Production approval still requires the Supabase remediation below, a real low-value payment and account claim, controlled WAF rollout, and independent external testing.

## Scope and evidence

Reviewed trust boundaries:

- Tranzila V2 Handshake, DirectNG redirect, callback proof, Reports lookup, and donation completion
- NGO terminal registration, activation, and tenant isolation
- Temporary donor contact data, replay evidence, and post-payment account claim
- Same-origin mutation checks, return URLs, input limits, CSP, HSTS, rate limiting, and security logging
- Supabase RLS, grants, security-definer functions, audit records, and scheduled cleanup
- CI dependency, repository-history, and built-client secret checks

Evidence used:

- Source and migrations at commit `f628813`
- Successful Security CI run `37046684184`
- The user-supplied live Supabase status row dated 2026-10-02
- Earlier successful authenticated tenant-isolation QA
- Local build, CSP, and browser-console probes recorded during implementation

Not performed as part of this review: destructive production testing, a real payment after the final deployment, mailbox verification of the magic-link claim, WAF enforcement, infrastructure penetration testing, or PCI assessment.

## Implemented controls

| ID | Control | Current status |
|---|---|---|
| SR-01 | Next.js and `eslint-config-next` are pinned to `16.3.8`; Node `24.x` is used in CI. | Implemented; CI verified |
| SR-02 | Checkout accepts only an active regular terminal. A unique active provider/terminal index, service-only status mutation, bounded reason, and non-PII audit record protect activation. | Implemented; tenant QA passed |
| SR-03 | Completed checkout sessions retain provider transaction identity for replay prevention while old donor contact fields are anonymized. | Implemented |
| SR-04 | The current checkout proof binds terminal, internal reference, exact amount, currency, and expiry. Legacy proof is limited to already-issued, expiring sessions. | Implemented; unit-tested |
| SR-05 | Return and cancel URLs require an exact parsed-origin match; prefix lookalikes and protocol-relative URLs are rejected. | Implemented; unit-tested |
| SR-06 | Payment pages use a fresh per-request nonce, `strict-dynamic`, and no `script-src 'unsafe-inline'`; the route is dynamically rendered. | Implemented; built and runtime-probed |
| SR-07 | A service-only atomic database limiter stores only an HMAC-derived client key. Checkout is limited to 10/minute and registration to 5/hour per derived address. | Implemented; fail-open caveat below |
| SR-08 | A service-only function scrubs expired/failed checkout PII, old completed-session PII, and stale rate-limit buckets. | Implemented; scheduling health unresolved |
| SR-09 | Security events use allowlisted event and reason codes. Callback payloads, credentials, tokens, IP addresses, and donor contact fields are not intentionally logged. | Implemented |
| SR-10 | CI runs lint, typecheck, tests, dependency audit, Git-history scan, production build, and client-bundle scan; Dependabot is configured. | Implemented; GitHub run passed |
| SR-11 | HSTS remains enabled for two years on the application host without asserting unverified subdomain coverage. | Implemented |

## Findings and residual risks

### F-01 — Supabase cleanup schedule is not presently attested (Medium, open)

The live verifier returned `cleanup_cron_active=false`. Its current predicate requires all of the following at once: the `pg_cron` extension, job name `impactify-payment-pii-cleanup`, schedule `17 2 * * *`, command exactly `select public.cleanup_payment_checkout_pii();` after outer trimming, and `active=true`.

An earlier Dashboard screenshot showed a job with the intended name, schedule, command, and active state. The new result therefore indicates drift, an exact-text discrepancy, or a different current state. It is not safe to claim that scheduled cleanup works until the job row and `cron.job_run_details` show a recent successful run. Supabase documents `cron.job` as the job registry and `cron.job_run_details` as the execution history.

### F-02 — Four expired sessions remain pending (Medium if PII remains; Low otherwise, open)

The snapshot found four rows where `status='pending'` and `expires_at < now()`. The current cleanup function has a confirmed logic defect: the status transition to `expired` is inside an update that only runs when at least one contact field is non-empty. Consequently, an expired pending row whose PII is already blank remains `pending` indefinitely.

The supplied snapshot does not distinguish expired pending rows with PII from those already scrubbed. That aggregate must be measured before assigning final severity or applying a repair.

### F-03 — Global rate limiting fails open on backend failure (Medium, accepted transitional risk)

Checkout and registration retain their older organization/resend controls, but callers deliberately continue when the new database rate-limit function is unavailable and emit `rate_limit_backend_unavailable`. This preserves payment availability during migration failure but weakens abuse resistance. Alerting and an outer Vercel WAF rule are required before treating this as a mature control.

### F-04 — Final live payment and registration flow remains unverified (Medium release gate)

A previous Tranzila hosted form opened and accepted a payment, but the final hardened deployment still needs an end-to-end test covering the callback, Reports lookup, idempotent donation creation, receipt page, unchecked registration choice, magic link, profile completion, and donation visibility. Unit tests cannot prove provider, deployment, email, and database behavior together.

### F-05 — General-site CSP still permits inline scripts (Low defense-in-depth gap)

The sensitive payment surface has a nonce CSP. The general site CSP in `next.config.ts` still uses `script-src 'unsafe-inline'`. Extending nonce-based CSP to the whole application would reduce XSS impact but requires dynamic-rendering/performance analysis; Next.js documents that per-request nonces require dynamic rendering and normally disable static optimization/CDN caching for those pages.

### F-06 — WAF and external assurance are not complete (Medium operational gap)

Application-level controls exist, but Vercel WAF rate limits have not been observed and enforced, and no independent authenticated penetration test has been performed. Vercel recommends starting a custom rule in Log mode and observing traffic before changing its action. The Tranzila callback must not receive an interactive challenge that the provider cannot solve.

### F-07 — Automated test depth is limited (Low)

The current five tests cover origin validation, current/legacy checkout proofs, provider transaction matching, and payment CSP. CI does not currently run route-level integration tests, callback replay tests against a database, authenticated SQL tenant QA, or a real provider sandbox/production test.

### F-08 — Non-Tranzila and advanced payment operations are incomplete (Informational)

Cardcom initialization exists without completion verification; Grow is not implemented; PSP token charging, recurring collection, and the actual provider refund operation are not implemented. These paths must remain disabled or clearly non-operational until they receive equivalent verification and replay controls.

### F-09 — Production Supabase Auth policy is unknown (Open question)

The current donor claim uses a one-time email link, but production Dashboard settings such as password policy, session lifetime, and abuse protection were not inspected. Local `supabase/config.toml` defaults are not evidence of production configuration.

## Verification results

| Check | Result |
|---|---|
| GitHub Security CI | Passed in run `37046684184` at `f628813` |
| ESLint | 0 errors; 3 pre-existing warnings |
| TypeScript | Passed |
| Unit tests | 5/5 passed |
| Dependency audit | 0 known high-or-greater findings; CI audit passed |
| Production build | Passed on GitHub with Node 24 |
| Git-history and client-bundle secret scans | Passed; scanners do not print candidate values |
| Payment CSP | Nonce and `strict-dynamic` present; no payment `script-src 'unsafe-inline'`; nonce rotated locally |
| Tenant isolation QA | Previously passed in a transaction that rolled back |
| Live Supabase status | 13 controls healthy; Cron signature false; four expired pending sessions |
| Live Tranzila plus account claim after final deployment | Not yet run |

The repository scanners are guardrails, not a substitute for a dedicated secret-scanning product or repository-host scanning. A passing dependency audit also does not prove the absence of unknown vulnerabilities.

## Supabase diagnosis and repair plan

Run every query in the authenticated Supabase Dashboard SQL Editor. Do not print, export, or paste row-level donor fields. Capture only aggregate counts and non-sensitive Cron metadata.

### 1. Diagnose the Cron mismatch without changing data

```sql
select
  jobid, jobname, schedule, active, database, username,
  length(command) as command_length,
  octet_length(command) as command_bytes,
  encode(convert_to(command, 'UTF8'), 'escape') as command_exact
from cron.job
where jobname = 'impactify-payment-pii-cleanup';

select
  jobid, status, return_message, start_time, end_time
from cron.job_run_details
where jobid in (
  select jobid from cron.job
  where jobname = 'impactify-payment-pii-cleanup'
)
order by start_time desc
limit 20;
```

Acceptance evidence: exactly one active job with the intended schedule and a recent successful execution. Treat `return_message` as potentially sensitive operational output and do not publish it unreviewed.

### 2. Classify the four expired pending sessions using aggregates only

```sql
select
  count(*) as expired_pending_total,
  count(*) filter (where
    customer_email <> '' or customer_name <> '' or customer_address <> ''
    or customer_city <> '' or customer_zip <> '' or customer_country <> ''
  ) as expired_pending_with_pii,
  min(expires_at) as oldest_expiry,
  max(expires_at) as newest_expiry
from public.payment_checkout_sessions
where status = 'pending'
  and expires_at < now();
```

Do not select the contact columns themselves. If `expired_pending_with_pii > 0`, the privacy-retention gap is confirmed and should be remediated immediately. If it is zero, the remaining issue is stale state caused by F-02 rather than retained PII.

### 3. Apply the matching repair

| Diagnostic result | Repair |
|---|---|
| Job missing, inactive, duplicated, or wrong schedule/command | Re-run the canonical scheduling migration, which unschedules same-name rows and creates one active `17 2 * * *` job calling only `public.cleanup_payment_checkout_pii()` |
| Job exists but recent runs fail | Review only the failure metadata, confirm function existence/ownership and `pg_cron`, correct the cause, then run the cleanup function once manually |
| Job runs successfully but only SQL whitespace differs | Prefer canonical rescheduling; optionally make the verifier normalize harmless whitespace while keeping an anchored, single-function-call check |
| Expired pending rows contain PII | Run `select public.cleanup_payment_checkout_pii();` once after recording aggregate counts, then re-run the aggregate and consolidated verifier |
| Expired pending rows contain no PII | Add a timestamped migration that marks every expired `pending` row as `expired` independently of PII scrubbing |

The durable cleanup migration should perform two separate updates: first transition all expired `pending` sessions to `expired`; then blank contact fields for failed/expired sessions and completed sessions older than seven days. It should continue deleting stale rate-limit buckets and preserve completed-session transaction identity for replay protection.

### 4. Improve the verifier in the same future migration change

- Report `cron_definition_present`, `cron_recent_success`, `expired_pending_total`, and `expired_pending_with_pii` separately.
- Accept only an anchored single call to the intended cleanup function if command whitespace is normalized.
- Define a recent-success window that covers the daily schedule plus operational delay.
- Keep `all_checks_pass` strict: definition present, recent run successful, zero expired pending rows, and zero retained PII.

### 5. Validate after repair

1. Run `supabase/scripts/verify_current_payment_sql_status.sql`; require `all_checks_pass=true`, every boolean true, and every count zero.
2. Run `supabase/scripts/payment_security_qa.sql`; require success and confirm its transaction rolls back.
3. Inspect the next scheduled entry in `cron.job_run_details`; require `status='succeeded'`.
4. Re-run the aggregate query after the next scheduled execution to prove the job changes state, not merely that a row exists.
5. Add monitoring for failed Cron runs, expired pending sessions, retained expired-session PII, and `rate_limit_backend_unavailable` events.

## Remaining release gates

1. Complete the Supabase diagnosis and repair until the consolidated result is fully green.
2. Configure Vercel WAF rules for checkout and registration in Log mode, observe legitimate traffic, then enforce an appropriate rate limit. Exclude the Tranzila callback from interactive challenge unless provider compatibility is proven.
3. Complete one low-value payment and verify callback proof, Reports lookup, exactly one donation after a duplicate notification, receipt display, unchecked-by-default account opt-in, magic-link verification, profile completion, and personal-area visibility.
4. Confirm no production organization uses a QA/demo terminal and only the intended regular terminal is active. Token terminals remain unused until recurring charging is implemented.
5. Commission an authenticated external test using OWASP WSTG/ASVS-derived coverage and retest fixes.
6. Confirm PCI scope with the acquirer or a qualified assessor. Hosted redirection reduces card-data exposure but does not establish compliance by itself.
7. Obtain legal/privacy validation of temporary contact retention, account-link consent, notices, processor agreements, and applicable Israeli requirements.

## Current risk statement

No confirmed critical or high-severity defect remains in the reviewed Tranzila code path. The application security CI is green, tenant controls passed, and the live database has strong RLS/grant/function controls. Production readiness is nevertheless **conditional**: scheduled cleanup is not currently attested, four expired pending sessions require classification and repair, the final live payment/account-claim flow is unverified, and WAF/external assurance remain open.

Do not describe the platform as fully secure, penetration-tested, PCI compliant, or production-approved solely on the basis of this report.

## Authoritative references

- [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy)
- [Tranzila DirectNG integration](https://docs.tranzila.com/docs/payments-and-billing/iframe-integration-directng)
- [Tranzila transaction reports](https://docs.tranzila.com/docs/reports/tranzila-transaction-reports-api/gettransactions)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Vercel WAF custom rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules)
- [PCI SSC SAQ A eligibility clarification](https://blog.pcisecuritystandards.org/faq-clarifies-new-saq-a-eligibility-criteria-for-e-commerce-merchants)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
