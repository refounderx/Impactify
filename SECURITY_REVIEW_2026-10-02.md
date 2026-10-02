# Payment Security Hardening Report — 2026-10-02

## Executive summary

The payment and post-payment registration code now has stronger transaction binding, a nonce-based Content Security Policy on the payment surface, privacy-safe security events, automated security regression checks, and prepared database controls for terminal isolation, global rate limiting, audit history, and scheduled PII cleanup.

The application changes passed local tests, TypeScript, ESLint with no errors, a production build, Git-history secret scanning, client-bundle secret scanning, and live local CSP probes. The two new Supabase migrations have **not** been applied to the live project because the available browser session stopped at Supabase sign-in. They must not be described as live until the SQL Editor deployment and the supplied verification scripts pass.

This is an engineering review, not a penetration-test certificate, PCI attestation, or legal opinion. A real low-value Tranzila payment, email claim, authenticated tenant-isolation QA, WAF rollout, and independent external testing remain release gates.

## Scope and trust boundaries

- Tranzila V2 Handshake, DirectNG redirect, callback proof, reports lookup, and atomic donation completion
- NGO terminal registration and the trusted transition to an active terminal
- Temporary donor contact data, transaction replay records, and post-payment account claim
- Same-origin mutation checks, return URLs, CSP, HSTS, request limits, and security logging
- Supabase table grants, RLS assumptions, privileged functions, audit records, and scheduled cleanup
- Dependency, repository-history, and built-client secret exposure

## Implemented controls

| ID | Risk | Implementation | Status |
|---|---|---|---|
| SR-01 | Patched Next.js versions were required by upstream security advisories. Exploitability in this application was not established. | Next.js and `eslint-config-next` are pinned to `16.3.8`; Node `24.x` is required and CI repeats build/audit checks. | Implemented and locally verified |
| SR-02 | An NGO must not be able to activate another tenant's terminal or repoint an active connection. Until authenticated tenant probes pass, this remains a potentially critical boundary. | Checkout accepts only an `active` regular terminal. A prepared migration adds a unique active provider/terminal index, service-role-only status mutation with a reason, and non-PII audit records. Authenticated cross-tenant probes are supplied. | Code complete; live SQL and authenticated QA pending |
| SR-03 | Deleting completed sessions could remove the permanent provider transaction replay key. | Completed sessions retain transaction identity while donor contact fields are anonymized; atomic completion remains protected by the unique provider transaction. | Implemented; existing completion migration was previously live |
| SR-04 | Callback proof covered too little checkout state. | New Handshakes label and require v2 HMAC binding over terminal, internal reference, exact two-decimal amount, currency, and expiry. A missing-version legacy proof is accepted only for already-issued sessions, which expire under the existing 30-minute database limit. The callback also requires the provider-returned reference and independently verifies the transaction through Tranzila Reports. | Implemented and unit-tested |
| SR-05 | Open redirects could be accepted through prefix comparison. | Return and cancel URLs require an exact parsed origin match; lookalike and protocol-relative URLs are rejected. | Implemented and unit-tested |
| SR-06 | Payment pages allowed inline script execution under the general CSP. | Payment pages and checkout responses receive a per-request nonce CSP with `strict-dynamic`; `script-src` does not contain `unsafe-inline`. The payment route is dynamically rendered so Next.js can apply the nonce. | Implemented, built, and runtime-probed locally |
| SR-07 | Checkout and registration needed a durable global abuse limit. | A service-only atomic database bucket stores only an HMAC of the client address. Checkout is limited to 10/minute per address and registration to 5/hour. Existing per-organization and resend limits remain. | Code complete; activates after live migration |
| SR-08 | Contact data cleanup depended on a later checkout request. | A service-only cleanup function anonymizes expired/failed sessions and completed sessions older than seven days; a second migration schedules it daily with Supabase Cron. | Prepared; live Cron enablement/migrations pending |
| SR-09 | Authentication and callback errors could leak internal provider details or PII into logs/UI. | Security events contain only an allowlisted event name, reason code, and timestamp. Auth errors are generic; callback payloads, IPs, email addresses, tokens, and credentials are not logged. | Implemented |
| SR-10 | Secret and regression checks were manual. | CI now runs lint, typecheck, unit tests, dependency audit, full Git-history scan, production build, and built-client secret scan; Dependabot is enabled for npm and Actions. | Implemented; CI result after push is still required |
| SR-11 | `includeSubDomains` HSTS was enabled without a verified subdomain inventory. | HSTS remains two years on the application host but no longer asserts `includeSubDomains`. | Implemented |

The rate-limit caller deliberately fails open **only when the new database function is unavailable**, so an automatic Vercel deployment cannot break the existing checkout before the migration is applied. The older 30-per-minute organization limit and 60-second registration resend lock remain active. A privacy-safe `rate_limit_backend_unavailable` event makes this transitional condition observable. After the migration is live, the global limiter is used without another deployment.

## Verification evidence

| Check | Result |
|---|---|
| Security unit tests | Origin validation, current and legacy HMAC behavior, report matching, and payment CSP |
| TypeScript | Passed (`tsc --noEmit`) |
| Full ESLint | 0 errors; 3 pre-existing unrelated warnings |
| Production build | Passed with Next.js `16.3.8` using the Webpack builder; 48 routes generated |
| Turbopack build | Could not complete on this Windows host because the OS denied a PostCSS child-process spawn; the Webpack production build passed |
| Git-history secret scan | Passed across all refs; findings never print candidate secret values |
| Built-client secret scan | Passed after the production build |
| Local payment-page CSP probe | HTTP 200; nonce present, `strict-dynamic` present, no `script-src 'unsafe-inline'`, nonce changed between requests |
| Local browser console | No error or warning entries on the payment page |
| Diff whitespace check | Passed |
| Dependency audit | Last full npm audit before this code-only delta reported 0 vulnerabilities; the dependency graph did not change. CI must repeat it after push because npm is unavailable in this execution shell. |
| Live Supabase migration/QA | **Not run**: authentication is required in the Dashboard SQL Editor |
| Live Tranzila + account claim | **Not run**: requires a real low-value charge and access to the recipient mailbox |

## Supabase release procedure

Use the authenticated Supabase Dashboard SQL Editor; do not use `supabase db push` for this project.

1. Run `supabase/migrations/20261002150000_payment_security_operations.sql` in a transaction.
2. Run `supabase/scripts/verify_payment_security_operations.sql`. The first migration, functions, grants, duplicate-terminal check, and PII checks must pass.
3. Apply `supabase/migrations/20261002160000_fix_payment_connection_profile_ambiguity.sql`, which qualifies the tenant profile lookup used by `get_ngo_payment_connections()`.
4. Run `supabase/scripts/payment_security_qa.sql`. It intentionally rolls back, but it requires terminal connections for at least two organizations and must prove an authenticated NGO owner cannot read another NGO's terminal, directly alter status, or retarget an active connection.
5. Enable Supabase Cron (`pg_cron`) in Dashboard → Integrations.
6. Run `supabase/migrations/20261002151000_schedule_payment_pii_cleanup.sql` in a transaction.
7. Run `supabase/scripts/verify_payment_security_operations.sql` again and confirm the daily job exists.
8. Watch for `rate_limit_backend_unavailable`. It should stop after the first migration is live.

If the unique active-terminal index fails, do not remove the constraint. Investigate the duplicate active provider/terminal rows and resolve ownership before retrying.

## Remaining release gates

1. **CI after push:** require all security workflow jobs to pass before treating the commit as releasable.
2. **WAF rollout:** in Vercel, create rate-limit rules for `/api/payments/checkout` and `/api/donations/register`; start in Log mode for at least 10 minutes, inspect legitimate traffic, then enforce. Do not challenge or rate-limit the Tranzila callback without a provider-compatible rule. Application-level limiting remains mandatory even with WAF.
3. **Real payment and claim:** complete one low-value payment and verify success redirect, Reports lookup, exactly one donation after duplicate Notify, receipt display, unchecked-by-default registration opt-in, magic-link verification, profile completion, and donation visibility in the personal area.
4. **QA terminal audit:** confirm no production organization uses a QA/demo terminal and that only the intended regular terminal is active. Token terminals remain unused until recurring charging is implemented.
5. **Monitoring:** alert on callback proof failures, report-verification failures, rate-limit backend unavailability, and abnormal checkout/registration 429 rates without adding PII to log messages.
6. **External assurance:** commission an authenticated external penetration test using OWASP WSTG coverage, then retest fixes. Confirm SAQ/PCI scope with the acquirer or a qualified PCI assessor; hosted redirection reduces exposure but does not itself prove compliance.
7. **Privacy/legal:** have counsel validate the seven-day temporary contact retention, account-link consent text, processing notices, processor agreements, and applicable Israeli privacy obligations.

## Current risk statement

No confirmed critical or high code defect remains in the reviewed local payment path. However, SR-02 is not closed operationally until the database migration and authenticated tenant probes pass. Global rate limiting and scheduled PII cleanup are also not live until their migrations are applied. The platform must not be represented as fully secure, penetration-tested, PCI compliant, or production-approved solely on the basis of this report.

## Authoritative references

- Next.js CSP guide: https://nextjs.org/docs/app/guides/content-security-policy
- Tranzila DirectNG integration: https://docs.tranzila.com/docs/payments-and-billing/iframe-integration-directng
- Tranzila transaction reports: https://docs.tranzila.com/docs/reports/tranzila-transaction-reports-api/gettransactions
- Supabase Cron: https://supabase.com/docs/guides/cron
- Vercel WAF custom rules: https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules
- Vercel forwarded-IP header: https://vercel.com/docs/headers/request-headers
- PCI SSC SAQ A eligibility clarification: https://blog.pcisecuritystandards.org/faq-clarifies-new-saq-a-eligibility-criteria-for-e-commerce-merchants
- OWASP Web Security Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
