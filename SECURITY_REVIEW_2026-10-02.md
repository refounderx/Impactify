# Security Review — 2026-10-02

## Executive summary

This review covered the production payment and registration paths, authentication and tenant boundaries, Supabase privileges, secret handling, HTTP response policy, and JavaScript dependencies. All confirmed critical/high application findings identified in this pass were remediated in the working tree. The production build succeeds and the final dependency audit reports zero known vulnerabilities.

This is an engineering security review, not a penetration-test certificate, PCI attestation, or legal compliance opinion. The code changes still require deployment and a real low-value payment/account-claim test before general production traffic is enabled.

## Scope and trust boundaries

- Tranzila checkout creation, V2 Handshake, callback proof, reports-API verification, and atomic donation completion
- Post-payment opt-in and Supabase magic-link account claim
- NGO-to-payment-terminal isolation and terminal activation state
- Temporary donor contact data and payment replay records
- Same-origin mutation checks, input bounds, redirects, CSP, and response headers
- Supabase RLS/grants and privileged RPC exposure
- Tracked-secret scan and npm dependency advisories

## Remediated findings

| ID | Severity | Finding | Remediation |
|---|---|---|---|
| SR-01 | Critical upstream / project exposure unconfirmed | Next.js `16.2.6` was below current security releases, including an upstream critical advisory. The repository does not currently use the advisory's `next/og` attack pattern, but remaining on the affected framework version was unsafe. | Upgraded `next` and `eslint-config-next` to `16.3.8`, the current patched Active LTS release. |
| SR-02 | High | Checkout accepted `setup_required` and `pending_verification` payment connections. An NGO-controlled setup row must not be enough to consume server-held credentials for a known terminal. | Checkout now selects only an `active` regular terminal. The verified QA regular terminal was explicitly activated through the trusted server-side path. |
| SR-03 | High | Deleting old completed checkout sessions removed the globally unique provider transaction key. That weakened permanent replay protection after the deletion window. | Completed rows are retained as minimal audit/replay records. Temporary contact fields are erased after account claim or seven days; expired pending sessions are anonymized and marked expired. |
| SR-04 | High/Moderate dependency chain | The full audit found vulnerable transitive build dependencies in PostCSS, Browserslist, brace-expansion, and js-yaml. | Applied non-breaking patched dependency updates. Final full `npm audit` result: 0 vulnerabilities. |
| SR-05 | Medium | Repeated or concurrent post-payment registration requests could trigger multiple magic-link sends, and the opt-in update error was ignored. | Added a 60-second cooldown, non-empty payment-email requirement, checked update errors, and optimistic locking so concurrent requests cannot both send. |
| SR-06 | Medium | Return/cancel validation used string-prefix comparison, which is not a valid origin check and could accept an attacker-controlled lookalike origin. | URLs are parsed and accepted only when their exact origin equals the request origin. |
| SR-07 | Low | The callback accepted integers outside JavaScript's safe integer range. | Transaction indexes must now be positive safe integers before reports-API verification. |
| SR-08 | Low | Response hardening omitted a cross-origin resource policy, cross-domain-policy denial, browsing-topics denial, and subdomain HSTS. | Added `Cross-Origin-Resource-Policy`, `X-Permitted-Cross-Domain-Policies`, browsing-topics denial, and two-year HSTS with subdomains. |

## Existing controls confirmed

- Impactify never receives PAN or CVV; Tranzila DirectNG owns the card-entry surface.
- Provider credentials are server-only and no real credential/private-key pattern was found in tracked files.
- The callback requires a proof bound to terminal and checkout reference, re-reads the transaction through Tranzila's authenticated reports API, and validates approval, terminal, ILS currency, exact finite amount, and transaction identity.
- `complete_verified_checkout` is service-role only, locks the session, rejects expired/non-pending sessions, and creates the donation atomically.
- Browser roles have no direct grants on checkout sessions; donation completion is not accepted from browser input.
- Anonymous live checks returned HTTP 401 for organization bank fields and the admin role-change RPC; intended public campaign reads remained available.
- Same-origin request enforcement returned HTTP 403 for a cross-site checkout request and HTTP 400 for a same-origin malformed checkout request.
- Production responses expose CSP, anti-framing, MIME-sniffing, referrer, permissions, opener/resource isolation, cross-domain-policy, and HSTS headers.

## Verification evidence

| Check | Result |
|---|---|
| Next.js production build | Passed on `16.3.8`; 48 static/dynamic routes generated |
| TypeScript `tsc --noEmit` | Passed |
| Full ESLint | Passed with 0 errors; 3 unrelated existing warnings |
| Full npm audit | Passed: 0 critical, high, moderate, low, or informational vulnerabilities |
| Diff whitespace validation | Passed |
| Local cross-site mutation probe | Blocked with HTTP 403 |
| Local security-header probe | All configured headers present |
| Live Supabase privilege probes | Bank-field and admin-RPC anonymous access blocked with HTTP 401 |
| Tracked-secret pattern scan | No committed provider credentials or private keys found; documented values are placeholders |

The general Supabase verification script also reported incomplete descriptive profile fields for some organizations. That is a data-quality issue, not an authorization failure, and was not modified by this security review.

## Residual risks and release gates

1. **CSP hardening:** Production still permits inline scripts and styles. Removing `script-src 'unsafe-inline'` safely in Next.js requires a nonce-based dynamic CSP rollout and performance/regression testing across the whole app. No raw HTML sink was found in the React UI, but this remains defense-in-depth work.
2. **Abuse protection:** Checkout has a durable per-organization limit of 30 sessions per minute and registration has a 60-second cooldown. A production WAF/global per-IP limiter is still recommended for distributed abuse and the small race window around the checkout count.
3. **PII cleanup scheduling:** Cleanup runs when a new Tranzila checkout begins. Add a scheduled server job so expired contact data is anonymized even during periods with no checkout traffic.
4. **Live release test:** After deployment, complete one low-value payment and verify success redirect, authenticated reports lookup, exactly one donation on duplicate Notify, receipt rendering, opt-in, magic-link verification, and donation claim. This requires a real provider transaction and user mailbox action.
5. **Independent assurance:** Run an external penetration test and confirm current PCI/Tranzila contractual responsibilities before representing the entire platform as certified or fully compliant.

## Authoritative dependency references

- Next.js September 2026 security release: https://nextjs.org/blog
- Next.js maintained security advisories: https://github.com/vercel/next.js/security/advisories
- Critical `next/og` advisory affecting Next.js versions before `16.3.6`: https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j
