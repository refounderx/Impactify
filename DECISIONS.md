# Technical Decisions — Impactify

## 2026-08-30 — Do not expose historical seed campaigns on public routes

**Decision:** Exclude the six stable UUIDs created by `supabase/seed.sql` from public campaign listing, search, and direct campaign-detail reads. Keep the rows intact for local/demo setup and historical database compatibility.

**Context:** The live project contains the original fixture campaigns alongside user-created campaigns. Presenting them as live fundraising opportunities contradicts the product rule that public pages must show only real platform data.

**Rationale:** Filtering the known seed identifiers at the public query boundary removes them consistently without deleting production records or changing the schema. It remains safe for existing local demo setups.

**Consequences:** New public queries never render those fixture campaigns, and direct navigation to one returns the normal missing-campaign state. If the initial seed is redesigned, this allowlist must be revised or a dedicated database-level `is_demo` flag should replace it.

## 2026-08-29 — Keep NGO-owner special days private to the owning profile

**Decision:** Persist special days in a dedicated `profile_special_days` table keyed to `profiles.id`, with authenticated-only grants and per-operation RLS requiring `profile_id = auth.uid()`. Keep organization goals in the existing organization-owned contract rather than mixing the two concepts.

**Context:** The supplied NGO-owner profile design includes a personal “special days” area alongside personal details and payment methods, while organization goals already have a separate tenant-scoped persistence model.

**Rationale:** A profile-owned table gives each user an independently secured list without adding repeated date columns to `profiles` or weakening the organization-goals boundary.

**Consequences:** Personal-profile surfaces can create/list/delete the current user's special days. The later NGO-specific reference design moved `/nonprofit/profile` to organization details and goals, so NGO owners no longer manage special days on that route. Account deletion cascades saved special-day rows. Anonymous users have no table privileges, and the migration must be deployed through the required SQL Editor workflow.

---

## 2026-08-29 — Preserve browser sessions across transient auth failures

**Decision:** Reuse one browser Supabase client, restore its persisted session before making a network validation request, and retain that session when validation fails transiently. Reconcile the session after network recovery and when the tab becomes visible, while displaying distinct notices for offline state, temporary verification failure, and confirmed sign-out.

**Context:** Initial UI state depended on the network-backed `getUser()` call. A short network or auth-service failure therefore appeared as a logout even when the browser still held a refreshable session, and the UI gave no explanation when a real `SIGNED_OUT` event occurred.

**Rationale:** Supabase already persists and auto-refreshes browser sessions. Restoring that state first avoids false disconnects; server middleware, server layouts, and RLS remain the authoritative security checks. Separating transient failure from confirmed sign-out gives the user an accurate recovery path.

**Consequences:** Client UI may temporarily retain the last locally persisted user during a network outage, but protected server routes and database writes still require a valid server-verified token. Profile refresh runs outside the auth event callback, reconnect and tab-focus events trigger reconciliation, and confirmed sign-out clears user/profile state and offers a sign-in action.

---

## 2026-08-29 — Require the admin role for online text editing

**Decision:** Expose the production inline-text edit toggle only to authenticated `admin` profiles, and make `AdminModeProvider` validate that role before restoring or toggling browser-persisted edit mode. Keep the existing `site_content` admin-only RLS as the authoritative write boundary.

**Context:** The edit toggle previously lived only in the development `DemoBar`, while `AdminModeProvider` trusted a localStorage flag without checking the current profile. RLS rejected unauthorized saves, but stale browser state could still expose editing controls to a non-admin.

**Rationale:** Role-checking both the UI state and database write path gives administrators a usable online editor while preventing other profiles from seeing or activating it. The database remains authoritative even if client code is bypassed.

**Consequences:** `AuthProvider` now wraps `AdminModeProvider`; non-admin and signed-out sessions force edit mode off and remove the stale preference. No schema migration is required because the live RLS policies already use `public.is_admin()` for `site_content` insert/update.

---

## 2026-08-28 — Deploy migrations directly through the Supabase SQL Editor

**Decision:** Keep timestamped files under `supabase/migrations/` as the source of truth, but do not attempt deployment through the linked Supabase CLI. Apply authorized migrations directly through the authenticated Dashboard SQL Editor, reconcile `supabase_migrations.schema_migrations`, and verify the result with a separate read-only query.

**Context:** Repeated CLI attempts fail at the same temporary database `login role` initialization step and have not yielded a usable deployment path.

**Rationale:** Going directly to the working SQL Editor avoids a known, repeatable failure while retaining reproducible migration files and ledger consistency.

**Consequences:** Future agents must not retry `supabase db push` for this project unless the user explicitly reverses this decision. A migration is live only after the editor transaction succeeds and the verification query confirms the ledger entry, changed objects, and relevant security properties.

---

## 2026-08-25 — Store NGO goals as validated bilingual JSON

**Decision:** Store each organization's goals in a `jsonb` array of `{ he, en }` objects. New NGO onboarding requires 1–10 entries with Hebrew text; owners update the list through a security-definer RPC that derives the target organization from `auth.uid()`.

**Context:** Goals belong to the organization rather than the user profile, must be captured during NGO registration, and need to remain editable and publicly displayable in both supported languages.

**Rationale:** Keeping each translation pair in one object avoids alignment bugs between parallel arrays. A guarded RPC prevents callers from selecting another tenant's organization ID and centralizes length/count normalization.

**Consequences:** Legacy organizations receive an empty list instead of invented content and can add real goals from `/profile`. Public organization reads include goals but still exclude bank fields. English is optional and falls back to Hebrew in the public profile.

---

## 2026-08-25 — Delete user accounts through a guarded database RPC

**Decision:** The admin user directory deletes the target `auth.users` account through an authenticated-only security-definer RPC. The RPC re-checks admin authorization, blocks self-deletion and deletion of the last admin, serializes against role changes, and records only actor/target UUIDs plus the deleted role in a dedicated audit table.

**Context:** Deleting only `profiles` would leave a working authentication account, while exposing service-role credentials to the browser would cross the security boundary. Account deletion also activates existing foreign-key behavior across donor-linked data.

**Consequences:** Account-linked profile, recurring-payment, saved-payment-method, and targeted-update rows cascade according to existing foreign keys; communities retain their records with a null manager, and immutable donation history remains with a null donor reference. Donation immutability is enforced by a trigger that rejects ordinary ledger edits but permits only UUID-to-null changes to `donor_id`/`product_id`; this replaces the UPDATE rewrite rule that prevented PostgreSQL's FK `SET NULL` action from completing. The UI requires explicit confirmation, and the current admin cannot target their own row.

---

## 2026-08-23 — Four persisted roles with audited, tenant-safe administration

**Decision:** Use exactly `donor`, `ngo_owner`, `community_owner`, and `admin`. New users complete a one-time security-definer onboarding RPC; users cannot self-select admin or directly update role/tenant columns. Admins change other users through an atomic audited RPC that validates tenant assignment, blocks self-demotion, serializes changes, and preserves at least one admin.

**Context:** The prior profile update policy allowed any signed-in user to change `app_role`, `org_id`, and `community_id`. Admin dashboards also read shared JSON snapshots instead of data belonging to the authenticated tenant.

**Consequences:** Server layouts and database RLS both enforce roles. NGO/community dashboards derive tenant IDs from `auth.uid()`, campaign publication validates product ownership atomically, public organization reads exclude bank columns, and site-copy writes require admin. The migrations are live; the sole existing profile was bootstrapped only after verifying the database contained exactly one profile and no admin. REST/catalog/adversarial probes passed, and all Dashboard-applied migration versions were added to Supabase's migration ledger.

---

## 2026-08-23 — Supabase-only runtime reads; fixture snapshots stored in `site_datasets`

**Decision:** Remove every active mock fallback. Normalized organizations, campaigns, products, communities, donations, and organization-profile fields are queried from dedicated Supabase tables. Remaining landing/admin/demo presentation records are stored as four typed JSON rows in the public-read-only `site_datasets` table and loaded once through `SiteDataProvider`.

**Context:** The user requested that all existing mock data be uploaded to Supabase and that every website data path query Supabase. Several newer admin and landing screens still imported fixture arrays directly, while older query modules silently replaced errors or empty results with mock data.

**Rationale:** Silent fallbacks conceal schema, RLS, networking, and seeding failures. A transitional JSON dataset table moves all runtime data ownership to Supabase without prematurely inventing normalized schemas for UI-only records; dedicated domain entities remain normalized.

**Consequences:** Missing data now produces an explicit loading/error/empty state. The fixture modules remain only as generator inputs and type sources. `site_datasets` allows public reads and no public writes. Both migrations were applied through the Dashboard SQL Editor after the CLI Management API login-role request failed; REST verification confirms the four dataset rows and all five extended organization profiles are live.

---

## 2026-08-23 — Fixed hero badge positioning: anchored to each photo, not floated over the whole grid

**Decision:** Reworked `Hero.tsx`'s `HeroImageCard`/`Badge` so each caption bubble is now an absolutely-positioned child of its *own* photo's wrapper (`bottom-2 start-2 end-2` within a `relative overflow-hidden` container sized to that photo), instead of 3 badges absolutely positioned against the whole 2-column image grid with hand-picked offsets (`-top-4 start-16`, `top-1/2 end-0`, `bottom-4 start-0`). Also switched the badge from a fixed-height `rounded-full` pill with `truncate` to a `rounded-xl` pill that wraps text across lines (`leading-snug`, no truncate/no-wrap).
**Context:** The original 3 offsets were tuned for abstract color-block placeholders in a specific grid arrangement; once real photos replaced the blocks, the badges no longer lined up with the photo they described — user reported "bubbles are mismatched and on top of other things," then separately "soldier text is truncated" once the position fix was in but text still got cut off by `truncate` on the (correctly positioned but longer) soldier caption.
**Rationale:** Attaching each badge to its own image's relative container is robust to the grid's actual visual arrangement (including RTL mirroring) and to caption length — it can't drift onto a neighboring photo. Allowing wrap instead of truncating means longer captions (e.g. the soldier one) stay fully readable instead of silently losing information.
**Consequences:** Verified visually via a one-off Playwright + Chromium screenshot script (no project screenshot/run skill existed yet for this repo — installed `playwright` ad hoc in the scratchpad, not added as a project dependency). Confirmed all 3 captions now render fully and match their photo, with zero console errors.

---

## 2026-08-23 — Real hero photos stored in Supabase Storage, not the Next.js public folder

**Decision:** Created a public `hero-images` Storage bucket (via SQL insert into `storage.buckets` + a `storage.objects` public-read RLS policy, saved as `supabase/migrations/20260823140000_hero_images_storage.sql`), uploaded the user's 3 provided photos via `supabase storage cp --experimental --linked`, and updated `hero_cards.image_url` to the resulting public Storage URLs. Also rewrote each card's `bubble_text`/`bubble_text_en` to describe what's actually in its photo (lone-soldier birthday party, elderly home visit with a hot meal, family donation-box delivery) rather than the generic placeholder captions.
**Context:** User provided 3 AI-generated branded photos in a local desktop folder and asked to upload them, insert them into the hero cards, and update the bubbles to match.
**Rationale:** The original 2026-08-23 hero-cards decision explicitly called for images+bubbles to live in Supabase (not hardcoded), so real images belonged in Storage, not the Next.js `public/` folder — a `public/` copy would only serve from this one deployment and wouldn't match the "admin can swap the photo without a code change" intent already baked into the `image_url` column design. Local copies in `public/hero/` were made first as an intermediate step, then removed once the Storage upload succeeded, to avoid two sources of truth for the same images.
**Consequences:** `supabase storage cp` required the `--experimental` flag and only worked with a relative source path (an absolute Windows `C:/...` path was rejected as an unsupported operation — a CLI quirk, not a project-specific issue). The Storage bucket/policy creation was done ad hoc via `supabase db query` rather than `db push`, then captured retroactively as a migration file for reproducibility.

---

## 2026-08-23 — Wired up admin content-editing mode; applied the last pending migration (2026-06-29) and fixed a data bug found along the way

**Decision:** Mounted `AdminModeProvider` in `layout.tsx`, added a toggle to `DemoBar`, and converted `Hero.tsx` + `WhyJoinSection.tsx` to use `EditableText` — admin mode is now actually reachable and functional (previously built but unmounted, per the earlier entry below). Also pushed the last remaining pending migration (2026-06-29: `donations.product_id`/`donation_type`/`quantity`, `campaign_updates` table) via the now-connected Supabase CLI.
**Context:** User asked "how to operate admin role" — surfaced that the earlier admin-mode work was infrastructure-only and not actually usable. Separately asked to push the 2026-06-29 backlog.
**Rationale:** Direct instructions; converting 2 landing components (not the full 356-call-site sweep) gives a working, testable feature now while keeping the change small — full rollout is tracked as a separate follow-up.
**Consequences:** The 2026-06-29 push failed on first attempt — `campaign_updates` seed data had invalid UUID literals (`'u1111111-...'`, `u` is not a valid hex digit), a pre-existing bug that explains why this migration was never successfully applied in earlier sessions despite being written months ago. Fixed by changing the prefix to `'a'` in both `seed.sql` (source) and the migration file, then re-pushed successfully. All previously-pending SQL across this project (2026-06-29, 2026-08-18, 2026-08-23) is now live. Admin mode is functional but still only covers 2 of ~65 files with static text, and `site_content` still has no real write-auth (open items, see `TASKS.md`).

---

## 2026-08-23 — Connected Supabase CLI; applied all pending migrations directly

**Decision:** Ran `supabase init` + `supabase link --project-ref yyfntsplkrmzkjzzikjq` + `supabase db push` against the live project, after the user completed `supabase login` in their own terminal (kept the access token out of this session entirely). Applied two migration files under the new `supabase/migrations/`: the previously-pending 2026-08-18 block (`profiles.id_number`, `payment_methods`, `system_updates`) and the 2026-08-23 block (`hero_cards`, `site_content`), plus their seed rows.
**Context:** User asked what it would take to let the agent connect to Supabase and push changes directly instead of the manual copy-paste-into-SQL-Editor workflow that had accumulated a growing "pending SQL" backlog across three sessions (2026-06-29, 2026-08-18, 2026-08-23).
**Rationale:** `supabase db push` only needs a linked CLI session, not Docker (Docker is only required for `db diff`/local dev, which failed here and was skipped) — so this was achievable without new local infrastructure beyond the CLI itself (fetched via `npx`, nothing installed globally).
**Consequences:** All 4 previously-pending tables now exist live: `payment_methods` (2 rows), `system_updates` (3 rows), `hero_cards` (3 rows), `site_content` (0 rows). The "Pending SQL to run" backlog is now clear — see updated `TASKS.md`. Going forward, new schema changes should be added as new files under `supabase/migrations/` and pushed via the CLI rather than appended to `schema.sql`/`seed.sql`; **`schema.sql`/`seed.sql` were left as-is** (not deleted or restructured into migrations) since they still serve as the single-file human-readable reference and the manual-paste fallback documented in `README.md` — open question whether to retire them, not decided this session.

---

## 2026-08-23 — Admin content-editing mode: inline edit, Supabase-backed overrides, no real auth yet (in progress)

**Decision:** Started building site-wide inline editing of static He/En text. Architecture, confirmed with the user via 3 questions before building: (1) inline click-to-edit UI on the live page, not a separate admin dashboard page; (2) a new `site_content` Supabase table storing per-key overrides merged at runtime over the existing `translations.ts`, not a full migration off `translations.ts`; (3) gated by a `AdminModeContext` toggle in the style of the existing `DemoBar` role switcher, since this app has no real production auth deployed yet — not gated by `profiles.app_role`.
**Context:** User asked to make "all static text fields in the website, Heb and Eng" admin-editable directly from the site. `translations.ts` has ~600 keys referenced from ~356 call sites across ~65 files.
**Rationale:** A per-key override table lets every existing `t(key)` call site opt in individually (via a new `<EditableText tKey>` wrapper) without a disruptive one-shot migration of the whole translation file. Reusing the DemoBar-style toggle (not `app_role`) matches this repo's existing precedent of visual/role-based demo gating rather than real authorization, since no admin role or login flow protects the other admin sections either.
**Consequences:** Given the scope (356 call sites), this session only built the foundation — `site_content` table, `queries-content.ts`, `AdminModeContext`, and the `EditableText` component — and did **not** wire it into `layout.tsx`/`DemoBar` or convert any call sites yet. `site_content` RLS currently allows public write (no auth exists to gate it on) — must be locked down before production. Rolling `<EditableText>` out across all 356 call sites is a large mechanical follow-up, tracked in `TASKS.md`, not attempted in one pass.

---

## 2026-08-23 — Replaced remaining "נתינה בקליק" / "יב קליק" brand references with "Impactify"

**Decision:** Replaced every remaining occurrence of the old brand strings ("נתינה בקליק", "יב קליק", and the English "Netina BeClick") in `src/lib/translations.ts` with "Impactify" (6 Hebrew keys, 7 English keys — impact section, why-join section, signup heading, footer "about" link).
**Context:** User-requested follow-up to the 2026-08-11 rebrand, which had renamed the brand key itself but left these landing-page copy strings on the old name (flagged as a known inconsistency in that rename's decision entry).
**Rationale:** Direct instruction — closes the gap noted in the 2026-08-11 entry below.
**Consequences:** None — literal string replacement, no key renames, no structural change.

---

## 2026-08-23 — Hero image+bubble placeholders backed by a new `hero_cards` table

**Decision:** Added a `hero_cards` Supabase table (`image_url`, `bubble_text`, `bubble_text_en`, `display_order`) storing each landing-hero image and its caption bubble as one row/unit, plus `getHeroCards()` in a new `queries-landing.ts` (mock-fallback pattern) and a matching `heroCards` mock array. `Hero.tsx` now renders 3 distinct image+caption pairs instead of one repeated badge string across 3 identical gray blocks.
**Context:** User flagged that the landing hero showed 3 generic gray placeholders with the exact same caption text repeated, and asked for real per-image captions (e.g. a soldier photo paired with "20 people donated for lone soldiers"), with images+captions stored in Supabase, and placeholders created now since real images aren't available yet.
**Rationale:** Storing image+text as one row (not two parallel lists) keeps a pair atomic for a future admin edit screen. `image_url` nullable means dropping in real photos later needs a data update only, no code change — matches the user's "I will provide images later" framing.
**Consequences:** New pending SQL migration (`hero_cards` table + RLS + index) not yet applied to live Supabase — same "apply manually in SQL editor" requirement as prior migrations. All 3 rows currently have `image_url = null`, rendering as color blocks. No admin UI exists yet to edit these rows — currently editable only via direct SQL/Supabase dashboard or the mock-data fallback in code.

---

## 2026-08-23 — Root route `/` now serves the marketing landing page, not donor-home

**Decision:** Swapped `app/page.tsx` content: it now renders the same content as `app/landing/page.tsx` (marketing landing page). The previous donor-home screen was moved as-is to `app/_archive/old-home/page.tsx`, a Next.js private folder excluded from routing, rather than deleted.
**Context:** User's explicit instruction: "landing should be the opening of the server... page at localhost:3000 is stale." No redesign requested — a routing swap only.
**Rationale:** Direct instruction; archiving instead of deleting preserves the donor-home implementation for a later decision on whether/where to re-expose it (e.g. `/home` or `/dashboard`).
**Consequences:** `/landing` is now a duplicate route of `/` (not deduplicated). Several pages still link/redirect to `/` expecting the old donor-home behavior and were **not** updated — they now land on the marketing page instead. Both left as open follow-ups; see `TASKS.md`.

---

## 2026-08-18 — Unblock Vercel production build: fix Supabase `Relationships` typing, ignore remaining pre-existing TS errors

**Decision:** Added the missing `Relationships: []` field to every table in `src/lib/supabase/types.ts` (required by `@supabase/postgrest-js`'s `GenericTable`, its absence was silently collapsing all `.insert()`/`.update()` typing to `never[]`), and set `typescript.ignoreBuildErrors: true` in `next.config.ts`.
**Context:** First Vercel deploy attempt failed `next build` on a type error in `src/app/api/donations/route.ts` (`donor_id` not assignable to `never[]`). Fixing the root cause (missing `Relationships`) reduced total `tsc --noEmit` errors from 74 to 51 (confirmed via `git stash` A/B comparison against the pre-fix commit), but exposed 51 pre-existing embedded-join typing errors across the query layer (`queries-campaigns.ts`, `queries-donations.ts`, `queries-community.ts`, `queries-profile.ts`) that already existed before this session and are unrelated to the `Relationships` fix — they stem from `types.ts` being a hand-maintained approximation of the schema rather than CLI-generated.
**Rationale:** Every affected query already wraps its Supabase call in `try/catch` with a mock-data fallback, so these are type-only gaps with no runtime behavior impact. Spending a full session hand-fixing embedded-join typing for 7+ tables was disproportionate to the immediate goal (get a working deploy live); user explicitly chose "unblock now, fix later" over a full typing pass.
**Consequences:** `next build` on Vercel will no longer fail on TypeScript errors, including *any* future one, not just the known 51 — this is a broad escape hatch, not a scoped suppression. The real fix is to regenerate `types.ts` via `npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts` (already noted in `PROJECT_CONTEXT.md`) once the pending schema migration is applied, then remove `ignoreBuildErrors`. Tracked in `TASKS.md`.

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

---

## 2026-08-29 — Tenant-derived persistence for admin updates and community campaign participation

**Decision:** Store NGO update configurations in `ngo_updates` and community-to-campaign relationships in `community_campaigns`; expose mutations only through security-definer RPCs that derive the tenant from `auth.uid()`.
**Context:** The admin update wizard and community join controls were previously local UI state, so refresh discarded changes and no donor-facing update was created.
**Rationale:** Database-enforced tenant derivation prevents a client from writing another organization's updates or another community's campaign relationship. Immediate Push updates are materialized as donor `system_updates` rows; external Email/SMS and scheduled/trigger execution require a provider/worker.
**Consequences:** Admin screens now survive refresh and community requests have durable `pending` status. NGO approval/notification UI and external delivery infrastructure remain explicit follow-ups.
