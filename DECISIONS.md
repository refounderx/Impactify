# Technical Decisions — Impactify

---

## 2026-08-11 — Site rebrand: "ישראל תורמת" → "Impactify"

**Decision:** Renamed the product from "ישראל תורמת" (Israel Donates) to "Impactify" everywhere the brand name is rendered or referenced: `translations.ts` `brand` key (both `he` and `en`), the root `<title>` in `layout.tsx`, the hardcoded logo text on `/auth` and `/auth/setup`, SQL file header comments, and the doc titles/README.
**Context:** User-requested rename, no scope/architecture change.
**Rationale:** N/A — direct instruction.
**Consequences:** "Impactify" is now used as-is in both languages (not translated per-language, unlike the old "ישראל תורמת" / "Israel Donates" pair). The `/landing` marketing page still shows a different placeholder brand string ("נתינה בקליק" / "יב קליק" in one footer link) — pre-existing inconsistency, tracked in `TASKS.md`, not resolved by this rename.

---

## 2026-07-17 — Nonprofit admin panel: Next.js route group instead of a shared layout on `/nonprofit`

**Decision:** Put the new multi-page nonprofit admin panel (campaigns/products dashboards + grids, donations, updates) in a route group `src/app/nonprofit/(admin)/`, rather than adding `src/app/nonprofit/layout.tsx` directly.
**Context:** `/nonprofit/[id]` (public org profile, built earlier the same session) and `/nonprofit/create-campaign` (wizard) already live under `/nonprofit/*` and must NOT get the new admin sidebar chrome. A plain `nonprofit/layout.tsx` would wrap every route under `/nonprofit`, including those two.
**Rationale:** Route groups (`(name)`) don't affect the URL but do scope a `layout.tsx` to only the files inside them, so `[id]` and `create-campaign` stay outside and unaffected. Confirmed Next.js resolves static segments (`/nonprofit/campaigns`, `/nonprofit/products`, …) before the `[id]` dynamic segment, so there's no ambiguity between e.g. `/nonprofit/campaigns` and a hypothetical org with id `"campaigns"`.
**Consequences:** Anyone adding a new nonprofit-admin page must create it under `nonprofit/(admin)/`, not directly under `nonprofit/`, or it won't get the sidebar shell. The old single-page `/nonprofit` dashboard (`getNpDashboardData()` in `queries-orgs.ts`) was replaced by mock-data-driven pages and is now dead code (see `TASKS.md`).

---

## 2026-07-17 — Campaign redesign + public nonprofit profile: mock data only, no schema change

**Decision:** Build the new `/campaign/[id]` layout and the new `/nonprofit/[id]` public profile page against `src/lib/mock-data.ts` only (org bio/founded/CEO/volunteers/address/phone, per-campaign donors, per-campaign communities); do not extend `supabase/schema.sql`/`seed.sql`.
**Context:** User was asked whether to go mock-only or also extend the live schema, given the app is still demo-only with a Supabase-fallback pattern everywhere. User chose mock-only.
**Rationale:** Avoids growing the pending-manual-SQL backlog (`supabase/schema.sql` migrations must be applied by hand in the Supabase dashboard, see `PROJECT_CONTEXT.md`) for fields that only back a UI demo right now.
**Consequences:** These pages render real-looking content via the mock-data fallback path but will show empty/placeholder states once wired to a live org row without these columns. `getCampaignCommunities()` only has seed rows for two campaign ids. Revisit when this page needs to run against real org data (see `TASKS.md`).

---

## 2026-06-27 — Next.js 16 + App Router

**Decision:** Use Next.js 16 with App Router (not Pages Router).
**Context:** New project, no legacy code.
**Rationale:** App Router gives RSC (server components) for SEO-important campaign pages, nested layouts, and async params. Campaign detail pages benefit from server-side rendering for share previews.
**Consequences:** `params` are now `Promise<{id:string}>` — must be awaited in server components. Client components require `"use client"` directive.

---

## 2026-06-27 — Tailwind CSS v4 (CSS-based config)

**Decision:** Use Tailwind v4 with `@theme` in `globals.css` instead of `tailwind.config.ts`.
**Context:** `create-next-app` scaffolded v4 by default.
**Rationale:** v4 is the current default; CSS-based config reduces config file count. Custom colors defined as `--color-raz-*` variables avoid conflicts with Tailwind's built-in palette.
**Consequences:** No `tailwind.config.ts`. All theme customization lives in `src/app/globals.css`. Custom color utilities: `bg-raz-teal`, `text-raz-teal`, `bg-raz-dark`, `bg-raz-surface`, `text-raz-success`, `text-raz-danger`.

---

## 2026-06-27 — Heebo as primary Hebrew font

**Decision:** Use Google Fonts `Heebo` as the primary Hebrew typeface instead of `Ploni DL 1.1 AAA`.
**Context:** PRD specifies Ploni DL 1.1 AAA but font files are not available (proprietary).
**Rationale:** Heebo is the closest freely available Hebrew font in weight and character. Available via `next/font/google` with zero FOIT/FOUT.
**Consequences:** Visual difference from Figma spec. Can be swapped to Ploni DL when files are available by updating `layout.tsx` font import and the `--font-heebo` CSS variable.

---

## 2026-06-27 — Mock data only (no backend in Phase 1)

**Decision:** All data served from `src/lib/mock-data.ts` with no API calls.
**Context:** Goal is demo-ready screens first; auth/payment/backend deferred.
**Rationale:** Enables full UI review and investor demo without backend infrastructure. All screens are functional and navigable.
**Consequences:** No persistence. Donation amounts hardcoded to ₪100 in payment/thanks screens (amount state not passed via URL yet). Must be refactored when backend is added.

---

## 2026-06-27 — Demo bar for role switching (no auth)

**Decision:** Add a persistent `DemoBar` component at top of every screen that lets users switch between Donor/Non-Profit/Community roles without authentication.
**Context:** Auth is deferred; need a way to demo all three role perspectives.
**Rationale:** Simple, visible, requires no state management beyond Next.js routing.
**Consequences:** Must be removed or gated behind an env flag before production.

---

## 2026-06-27 — Phone-frame container + sticky nav for demo

**Decision:** Wrap all content in a `max-w-[430px]` `.phone-frame` div in `layout.tsx`. Switch `BottomNav` and all sticky CTAs from `position: fixed` to `position: sticky`.
**Rationale:** Fixed positioning spans the full browser viewport on desktop, making the app look like a wide desktop site rather than a mobile app. The phone frame constrains layout to 430px centered on a dark background, matching the mobile-first Figma designs.
**Consequences:** Bottom nav sticks to the scroll container instead of the viewport — correct for demo. In production on a native app this would be handled by the OS shell; if a real web build is needed, `fixed` + `max-width` on the nav element itself may be preferable.

---

## 2026-06-27 — Explicit CSS color utilities (Tailwind v4 @theme fallback)

**Decision:** Added explicit `.bg-raz-teal`, `.text-raz-teal` etc. CSS classes in `globals.css` alongside the `@theme` variables.
**Rationale:** Tailwind v4 `@theme { --color-raz-* }` variable-to-utility generation was not reliably applying custom colors at runtime. Explicit classes guarantee the colors work regardless of v4 compilation behavior.
**Consequences:** Color definitions exist in two places (`@theme` for CSS variable access, explicit classes for utility use). If migrating to a stable v4 release later, the explicit classes can be removed once `@theme` generation is confirmed working.

---

## 2026-06-27 — 6-step wizard as single component (exception to 200-line target)

**Decision:** Keep `nonprofit/create-campaign/page.tsx` as one file (220 lines) despite exceeding the ~200-line target.
**Rationale:** All 6 wizard steps share a single `form` + `step` state. Splitting would require prop-drilling or context, harming readability without genuine benefit.
**Consequences:** Approved exception. Revisit if steps grow significantly — at that point extract a `useWizardForm` hook and step components.

---

## 2026-06-27 — Supabase as database + auth provider

**Decision:** Use Supabase (hosted PostgreSQL + Auth) rather than a raw database or a separate auth service.
**Context:** Platform handles financial PII, multi-tenant donation data, and requires phone OTP auth (Israeli standard).
**Rationale:** Supabase's Row Level Security integrates directly with `auth.uid()`, so data isolation is enforced at the DB level — not only in application code. A bug in the API cannot leak cross-tenant data. The managed phone OTP (via SMS hook) maps to the PRD's phone-first auth. One integration covers DB + auth + storage + realtime. Frankfurt region (eu-central-1) satisfies Israeli ILPPDL data residency requirements.
**Consequences:** All tables have RLS enabled. `donations` table is append-only (DB rules block UPDATE/DELETE). Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Service role key is server-only and must never reach the browser.

---

## 2026-06-27 — Magic link auth (OTP deferred, custom SMTP required for code)

**Decision:** Use Supabase magic link flow (`signInWithOtp` + `/auth/callback` route) instead of 6-digit OTP code entry.
**Context:** Supabase free tier requires custom SMTP to edit email templates. Without custom SMTP, the default email sends a magic link URL, not a 6-digit code.
**Rationale:** Magic link works immediately with zero SMTP config. The `/auth/callback/route.ts` exchanges the `?code=` param for a session and redirects to `/auth/setup`. UX is one click in email rather than entering 6 digits — acceptable for demo.
**Consequences:** `/auth/callback` must be listed in Supabase → Authentication → URL Configuration → Redirect URLs (`http://localhost:3000/auth/callback`). To switch to 6-digit OTP codes later: set up custom SMTP (e.g. Resend free tier), then update the "Magic Link" email template to show `{{ .Token }}`, and restore the OTP input screen from git history.

---

## 2026-06-27 — Donation write via API route (not direct client insert)

**Decision:** Donations are written through `POST /api/donations` (server-side) rather than a direct client-side Supabase insert.
**Context:** Donations are financial records that must be trustworthy.
**Rationale:** Server-side validation ensures `donor_id` is always read from the authenticated session (never trusted from the client), `amount` is validated in range, and both `campaign_id` and `org_id` are present. A client-side insert could be manipulated to set an arbitrary `donor_id` or `amount`. The API route is a trust boundary.
**Consequences:** One extra HTTP hop on payment confirm. Failure is caught silently (demo still navigates to thank-you) — **remove the silent catch before production**.

---

## 2026-06-27 — Data layer with mock fallback pattern

**Decision:** `src/lib/supabase/queries.ts` wraps all Supabase calls in try/catch and falls back to `mock-data.ts` on error or empty result.
**Rationale:** Allows the demo to run without Supabase credentials configured, and protects against transient connectivity issues during development.
**Consequences:** Pages always render. When Supabase is connected and seeded, real data takes over automatically with no code change. Fallback should be removed before production to surface real errors.
