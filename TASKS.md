# Tasks — RAZ Donation Platform

## Current State

Responsive bilingual application with Supabase-backed normalized entities, authentication, donation writes, and shared presentation datasets. Local fixture modules are migration inputs only; active pages do not use them as runtime fallbacks. Real PSP processing is still not implemented.

**Supabase-only migration complete (2026-08-23):** `20260823150000_site_datasets.sql` and `20260823151000_organization_profiles.sql` were applied through the Dashboard SQL Editor. The auth migration later removed the two obsolete admin snapshots; REST verification confirms the required `shared` and `landing` rows. As of 2026-08-25, one of six organization rows is missing at least one extended profile field, so the profile-completeness verification remains red. The CLI Management API login-role error remains an operational issue for future `db push` commands.

**Four-role auth live (2026-08-23):** code and migrations define donor, NGO owner, community owner, and admin; add atomic onboarding, audited admin promotion/demotion, route guards, tenant-scoped dashboards, protected content editing, campaign publishing, and hardened donation validation. Migrations `20260823160000`–`20260823162000` are applied. REST/SQL verification passed, including anonymous bank/RPC denial and simulated non-admin role-change rejection. Dashboard-applied versions `20260823140000`–`20260823162000` are reconciled in `supabase_migrations.schema_migrations` for future CLI pushes.

**Campaign media live (2026-08-25):** migrations `20260824120000`–`20260824121000` add tenant-scoped campaign image storage, persisted video URLs, the expanded publish RPC, and anonymous policy-helper execution required by public campaign reads. Both Dashboard-applied versions are reconciled in the migration ledger; REST checks confirm anonymous campaigns, media columns, and the bucket are reachable under their intended roles.

**Campaign editing live (2026-08-28):** the NGO campaigns screen opens the existing six-step wizard with the selected campaign prefilled, and migration `20260828120000` adds a tenant-derived atomic update RPC. The migration was applied through the authenticated Supabase SQL editor after the linked CLI could not obtain its temporary database login role. SQL verification confirmed the migration ledger entry, security-definer function with fixed `search_path`, authenticated-only execution, and campaign/product tenant checks.

**Organization goals live (2026-08-25):** migration `20260825130000` adds structured bilingual goals to every organization row, requires 1–10 goals for new NGO signup, and exposes an owner-scoped update RPC used from `/nonprofit/profile`. Existing organizations retain an empty list until their owner supplies real goals; no content was invented during migration.

**Role profiles live (updated 2026-08-29):** donor, community-owner, and admin profiles compose `UnifiedProfileContent` for editable personal details, saved-payment display metadata, and persistent special days. NGO owners use a dedicated organization editor inside the admin shell, matching the supplied reference layout; organization goals remain editable below it. Migration `20260829120000` provides profile special days, while `20260829130000` adds `organizations.activity_area` and the authenticated, tenant-derived `update_ngo_profile` RPC. Both were applied through the Dashboard SQL Editor. Verification confirms the new ledger entry, column, and function; anonymous execution is denied and authenticated execution is granted.

**Donation anonymization fix live (2026-08-25):** migration `20260825140000` replaces the donation UPDATE rewrite rule with a trigger that blocks ordinary ledger edits while allowing foreign-key `SET NULL` anonymization of donor/product references. Catalog checks passed, a donor-reference update succeeded inside a rolled-back transaction, and an amount update was rejected. This resolves the referential-integrity failure encountered when an admin deletes a user while retaining immutable donation history.

**NGO product management live (2026-08-28):** migration `20260825150000` provides tenant-derived creation and migration `20260828130000` adds authenticated-only product editing with field validation and an ownership-scoped update. `/nonprofit/products/dashboard` now follows the supplied wide table design with summary metrics, live search/status filtering, expandable product analytics, and a shared bilingual create/edit modal. The new migration is applied; SQL checks passed for its ledger entry, security-definer function, fixed `search_path`, authenticated-only execution, and product tenant predicate.

### Screens complete
- `/` — Marketing landing page (changed 2026-08-23, previously donor home; see Known Tech Debt)
- `/landing` — same content as `/` (duplicate route, not deduplicated)
- `/search` — Search with live filter, category chips, sort, 2→4 column grid
- `/campaign/[id]` — Two-column desktop: story/products left, donation sidebar right (sticky)
- `/donate/[id]/amount` — Centered card, 4-preset grid, recurring + dedication toggles
- `/donate/[id]/payment` — Two-column: form left, campaign summary card right
- `/donate/[id]/thanks` — Centered success with receipt + share
- `/nonprofit` — Dark header, 4-column metrics, campaign list with progress
- `/nonprofit/create-campaign` — 6-step wizard (basics→story→media→products→communities→publish)
- `/nonprofit/profile` — NGO organization details, logo URL, activity area, and organization goals inside the admin shell
- `/community` — Two-column: stats/leaderboard left, styled export card right (sticky)
- Role-specific profile routes keep every authenticated profile inside a side-panel shell: `/profile` for donors, `/community/profile` for community owners, `/nonprofit/profile` for NGO owners, and `/admin/profile` for platform admins. The shared personal-profile content remains unified where the role does not require the NGO organization editor.
- `/recurring` — הוראות קבע (standing orders): monthly summary, per-order pause/resume/cancel with inline confirmation

### Navigation
- Desktop: `TopNav` (white bar, logo + links + user avatar, hidden on mobile)
- Mobile: `BottomNav` (4-tab, hidden on desktop via `md:hidden`)
- All pages: `DemoBar` (role switcher, dark, always visible)

---

## Immediate (fix before next demo)

- [x] Fix build error: `next` binary not found — resolved
- [x] Donation amount not passed through flow — fixed via `?amount=` searchParams
- [x] Custom teal colors not rendering — explicit CSS utility classes in `globals.css`
- [x] Phone-frame (430px) → removed; replaced with proper desktop `max-w-5xl mx-auto` layout
- [x] All pages desktop-responsive with full-width colored headers + content containers
- [x] Bilingual Hebrew/English — `LanguageContext`, `translations.ts`, English mock data, toggle in DemoBar + TopNav, `dir` switching

---

## Phase 2 — Backend & Data

- [x] Supabase project wired: `@supabase/supabase-js` + `@supabase/ssr` installed
- [x] Full PostgreSQL schema — 8 tables, enums, RLS policies, auto-triggers (`supabase/schema.sql`)
- [x] Seed data — all 6 campaigns, 5 orgs, 5 products, 3 communities (`supabase/seed.sql`)
- [x] TypeScript DB types (`src/lib/supabase/types.ts`)
- [x] Data layer reads Supabase without silent mock fallbacks (`src/lib/supabase/queries.ts`)
- [x] Home and landing pages read all dynamic/presentation data from Supabase
- [x] Query layer split: `query-helpers.ts` + `queries-campaigns.ts` + `queries-orgs.ts` + `queries-community.ts`
- [x] Search — real-time Supabase full-text search with 300ms debounce
- [x] Campaign detail — real campaign + org + products from DB
- [x] Donation amount — campaign loaded from DB
- [x] NP dashboard — real org + campaigns from DB
- [x] Community dashboard — real community stats + leaderboard from DB
- [x] Profile + recurring — read real data from DB when signed in; sign-in prompt when not
- [x] Donation write — `POST /api/donations` (server-side, validates at trust boundary)
- [x] Campaign media — tenant-scoped hero-image uploads plus persisted HTTPS video playback

---

## Phase 3 — Authentication ✅ (email magic link + role authorization)

- [x] `proxy.ts` — session refresh plus coarse protection for setup/admin/owner routes
- [x] `AuthContext.tsx` — restores and refreshes a persistent session, avoids false sign-out on transient network errors, reconciles on reconnect/tab focus, exposes user/profile/refresh/loading/sign-out, and shows global connection/session notices
- [x] `/auth` — email entry → magic link (Supabase free tier; custom SMTP needed for 6-digit code)
- [x] `/auth/callback` — exchanges `?code=`, then redirects by persisted role or incomplete onboarding
- [x] Supabase URL Config: production Site URL plus local and production `/auth/callback` URLs are allowlisted
- [x] `/auth/setup` — one-time donor/NGO-owner/community-owner onboarding through atomic RPCs
- [x] NGO signup requires 1–10 bilingual organization goals; NGO owners can update them from `/nonprofit/profile`
- [x] Four exact roles: `donor`, `ngo_owner`, `community_owner`, `admin`
- [x] `/admin/users` — admin-only promotion, demotion, role/tenant assignment, and guarded user deletion with audit logs
- [x] Server layout guards enforce NGO-owner, community-owner, and admin routes
- [x] Ordinary profile updates cannot modify role or tenant columns
- [x] NGO/community dashboards query the authenticated tenant instead of shared snapshots
- [x] Apply and adversarially verify migrations `20260823160000`–`20260823162000` on live Supabase
- [x] `TopNav` — shows real user email when signed in; Sign In button when not
- [x] `layout.tsx` — wrapped with `AuthProvider`
- [ ] Switch to phone OTP — add Supabase SMS hook → Inforu/Twilio when SMS provider is ready
- [x] Online text editing is available from `TopNav` only to authenticated admins; `AdminModeProvider` also enforces the role and clears stale non-admin edit state

---

## Donor My-Donations Screen ✅

- [x] `/my-donations` route — "התרומות שלי" main donor screen (new separate route, no tabs)
- [x] `Sidebar.tsx` — teal fixed right sidebar: nav icons + labels, "ניהול קמפיינים" sub-item, "הקמת קמפיין"/"איך זה עובד?" bottom buttons; controls view state (my-donations | manage)
- [x] Top bar — greeting + last-login info + "חזרה לאתר" + sign-out button
- [x] "מה נעשה עם התרומות שלי" — horizontal scrolling carousel of campaign update cards with prev/next arrows; mock data: `donorUpdates`
- [x] "תרומות אחרונות" — 2-column grid of `DonationCard` components + "לחץ כדי לתרום עוד" add card
- [x] `DonationCard.tsx` — large teal quantity number, emoji product image, 3 variants:
  - `light` (default): teal "אני רוצה לתרום עוד" button
  - `dark`: dark bg, outlined "אני רוצה לתרום קבוע!" + "מעבר לעמוד המוצר" link
  - `hasStandingOrder`: ✅ יש לי הוראת קבע + edit/stop inline actions
- [x] `ManagePanel.tsx` — searchable all-donations table + quarterly CSS bar-chart view + tax refund trigger
- [x] FAB "+" (mobile only) → `NewDonationPopup` — bottom-sheet layout: dark top with mascot carousel (selected enlarged in white circle, < > arrows), white rounded sheet with "מה מרגש אותך לתרום?" heading + horizontal product cards (image, ₪126, "אני בוחר לתרום" button, ❤️ count)
- [x] `Popups.tsx` — Certificate / Receipts / DonateMore / StandingOrder popups (TaxRefund removed from popups — now a full view)
- [x] `TaxRefundView.tsx` — full "החזרי המס שלי" view: right col (year dropdown + download, email send, mascot chat card), left col (tax info text, "לחישוב סימולטור" button); accessible from sidebar "החזרי מס" item and ManagePanel button
- [x] BottomNav "פעילות" tab links to `/my-donations`
- [x] Mock data: `myProductDonations` (3 entries with variant/hasStandingOrder/emoji), `donorUpdates`, `quarterlyDonationData`, `donationEmotions`, `savedPaymentMethods`
- [x] `ProductDonation` type extended: `variant`, `hasStandingOrder`, `emoji`, `lastDonationTime`
- [x] Translations: `myDon.*` keys (Hebrew + English)

---

## Phase 2 — Backend additions for /my-donations ✅

- [x] **Schema migration** (`supabase/schema.sql` — appended):
  - `donations` table: +`product_id` (FK → products), +`donation_type` text, +`quantity` int
  - New `campaign_updates` table: campaign_id, org_id, description, description_en, has_video, gradient; public-read RLS
- [x] **Seed data** (`supabase/seed.sql` — appended):
  - 4 `campaign_updates` rows matching the `donorUpdates` mock
  - 6 demo `donations` rows with product_id/donation_type/quantity (donor_id=null; replace with real UUID post-user-creation)
- [x] **`src/lib/supabase/queries-my-donations.ts`** (new file):
  - `getMyProductDonations(userId)` — groups donations by product → `ProductDonation[]`, mock fallback
  - `getDonorUpdates(userId|null)` — fetches campaign_updates (prioritises donor's campaigns), mock fallback
  - `getQuarterlyStats(userId)` — aggregates current quarter by month+type, mock fallback
- [x] `/my-donations/page.tsx` — loads all three on mount via `useEffect([user])`, passes as props
- [x] `ManagePanel` + `QuarterlyView` — accept `productDonations?` / `quarterlyData?` props; fall back to mock

---

## Donor Profile + Updates Screens ✅

- [x] `Sidebar.tsx` — wired the previously dead "עדכונים" (Bell) and "הפרופיל שלי" nav items to new `updates` / `profile` views
- [x] `ProfilePanel.tsx` (new) — personal-details edit (name/phone/ID; email read-only, tied to auth) + payment-methods list with add/remove
- [x] `UpdatesPanel.tsx` (new) — two-tab updates screen: "עדכוני תרומות" (reuses existing `donorUpdates`) and "עדכוני מערכת" (new `system_updates`-backed tab, expandable rows); reachable from the sidebar bell and from the previously no-op "View all updates" button on `/my-donations`
- [x] `src/lib/supabase/queries-profile.ts` (new) — `getDonorProfile`/`updateDonorProfile`, `getPaymentMethods`/`addPaymentMethod`/`removePaymentMethod`, `getSystemUpdates`; mock fallback pattern, matching `queries-my-donations.ts`
- [x] **Schema migration** (`supabase/schema.sql` — appended): `profiles.id_number`; new `payment_methods` table (brand + last-4 only, no raw card data); new `system_updates` table — see `INTERFACES.md`
- [x] **Seed data** (`supabase/seed.sql` — appended): 2 `payment_methods` rows, 3 `system_updates` rows (donor_id=null; replace with real UUID post-user-creation)
- [x] **Applied to live Supabase (2026-08-23, via Supabase CLI):** the migration/seed blocks above are now live on the linked project — see `DECISIONS.md`
- [ ] Payment-method "add" only collects brand + last 4 digits client-side (no raw PAN handled) — real card entry/tokenization is blocked on the Phase 4 PSP choice
- [ ] Skipped splitting `full_name` into first/last name and adding a `birth_date` column — the donor-profile mockup's field labels didn't line up with its own sample data for those fields; kept `full_name` as the single existing field instead of guessing
- [ ] Nonprofit-admin "create update" wizard that would write into `system_updates` is not built (separate task)

---

## Public Landing Page (`/landing`) ✅ structure

- [x] `src/app/landing/page.tsx` — new public marketing route, separate from the signed-in donor dashboard at `/` (not touched)
- [x] Sections built from a Figma reference (`src/components/landing/`): `LandingHeader`, `Hero`, `ProductCarousel`, `ImpactStatsGrid`, `WhyJoinSection`, `SignupSection`, `VideoSection`, `ContactCTA`, `MascotDonationForm`, `LandingFooter`
- [x] Static data extracted to `src/lib/landing-data.ts`; copy added under `landing.*` keys in `src/lib/translations.ts` (He + En)
- [ ] **Confirm exact heading wording** for the product carousel — read from a compressed screenshot as "בחירת הגולשים"; contextually may actually be something like "בחירת הסלים" (basket selection). Needs a direct check against the Figma text layer.
- [ ] **Confirm whether repeated content is intentional**: the 7-icon audience row repeats קשיש/ה and חייל/ת twice, and the "why join" 3-column section repeats the same paragraph under all 3 icons in the source Figma mock — built as-is, but this looks like a Figma placeholder duplication rather than final per-column copy.
- [ ] Impact-stats tile captions are best-effort readings of small screenshot text, not verified letter-for-letter — needs a copy pass against the actual Figma text layers.
- [ ] Footer contact info (`Lorem@ipsum.com`, placeholder phone) is literally Lorem Ipsum in the source design — replace with real contact details before shipping.
- [x] Hero image+bubble placeholders (2026-08-23): 3 distinct color-block placeholders + distinct captions, backed by a new `hero_cards` Supabase table (`image_url` nullable — swap in real photos later, no code change needed). See `ARCHITECTURE.md` and `INTERFACES.md`.
- [x] Real hero photography added (2026-08-23): 3 branded photos (lone-soldier birthday, elderly home visit, family donation delivery) uploaded to the new `hero-images` Supabase Storage bucket, `hero_cards.image_url` updated to point at them, captions rewritten to match each photo's actual scene. Source files came from `C:\Users\ofern\OneDrive\Desktop\impactify\` (user-provided, AI-generated branded photos).
- [x] Real landing video added (2026-08-23): the provided `landing_video.mp4` is hosted in the public, MP4-only `landing-media` Supabase Storage bucket and rendered with native playback controls in `VideoSection.tsx`.
- [ ] Mascot is still a placeholder emoji (no illustration asset in the repo)
- [ ] Signup form, contact form, and social/auth-provider buttons are visual only — not wired to any backend or OAuth provider
- [x] Brand name inconsistency resolved (2026-08-23): all "נתינה בקליק" / "יב קליק" / "Netina BeClick" occurrences in `translations.ts` replaced with "Impactify"

### Audience filter + checkout wizard ✅

- [x] Hero audience-icon row is clickable (`AudienceIconRow.tsx`) — selecting an icon opens `AudienceFilterOverlay.tsx`: a dimmed full-screen overlay with that icon highlighted and a heading + grid filtered to that audience's own mock donation items (`audienceProducts` in `src/lib/landing-data.ts`, 3 per audience)
- [x] Clicking a card's buy button marks it "chosen" (outlined, button becomes "מעבר לעמוד המוצר") and opens `checkout/CheckoutModal.tsx` — a 5-step wizard, replacing the earlier single static detail panel (removed `ProductDetailPanel.tsx`, now dead code, deleted):
  1. `StepProduct` — video placeholder, chosen product + quantity stepper, org progress bar (`checkoutProgress` mock: 4,500/5,000), cross-sell grid of the audience's other products each with their own qty stepper, running total
  2. `StepPersonalDetails` — name/email/phone + an opt-out-of-updates checkbox
  3. `StepFrequency` — one-time vs. standing-order donation choice
  4. `StepPaymentMethod` — bit vs. credit card (**one-time path only** — recurring skips straight to the final step, matching the reference screenshots where the standing-order flow has no payment-method screen)
  5. `StepFinal` — heading and placeholder text branch on the frequency choice ("ביצוע תרומה"/"טופס אשראי" for one-time, "הפעלת הוראת קבע"/"טופס הו״ק" for recurring)
- [ ] Step-badge numbering (1–4, or 1–3 when payment is skipped) is inferred from the reference screenshots, not confirmed pixel-for-pixel — one recurring-path screenshot had its badge cropped
- [ ] Nothing past `StepPersonalDetails` is wired to a backend — no real PSP, no bit integration, no persisted donation record; this is UI-only per Phase 4 (still blocked on PSP choice below)
- [ ] Cross-sell in `StepProduct` reuses the same audience's `audienceProducts` list minus the chosen item — not a real "other donors chose" signal
- [ ] Per user instruction, no automated browser (CDP) verification was performed on this iteration — only `tsc --noEmit` (clean) and manual visual confirmation from the user's own screenshots. Please re-verify by clicking through the flow yourself.

---

## Campaign Detail Redesign + Public Nonprofit Profile ✅ UI (mock data only)

Built from two Figma/PDF references provided by the user: "campaign screen created by an org admin via the campaign wizard" and "org details screen, auto-generated for every org in the system."

- [x] `/campaign/[id]` redesigned: video/image hero with play button + org logo badge, inline percent/raised progress, "בחר סכום תרומה" button opening `DonateAmountModal`, up to 3 quick-donate `ProductBuyCard`s, and a `CampaignTabs` block (תורמים / קהילות / כמה מילים על הקמפיין / על העמותה)
- [x] `/nonprofit/[id]` (new route) — public org profile: video placeholder + org info card (verification, founded date, CEO, volunteer count, address, phone) on one side; share icons, name, bio, tabs (מוצרים לתרומה / על העמותה / על הפעילות), per-product quantity steppers with a running total (or custom-amount override), and a donate button that jumps straight to `/donate/[campaignId]/payment` (skips the amount-selection step, per spec)
- [x] `src/lib/mock-data.ts` extended: `organizations` gained `bio(En)`, `founded(En)`, `ceo(En)`, `volunteers`, `address(En)`, `phone`, `videoGradient`, `verified`; added `getCampaignDonors()`, `getCampaignCommunities()` (seeded only for campaigns "1" and "4"), and `getCampaignsByOrg()`
- [x] New components: `src/components/campaign/DonateAmountModal.tsx`, `ProductBuyCard.tsx`, `CampaignTabs.tsx`
- Verified with `tsc --noEmit` (no new errors — repo has pre-existing `_org`/Supabase-generic-type errors unrelated to this change), `eslint` (clean on all new/changed files), and a Playwright screenshot pass against the running dev server (both routes render, RTL layout correct, no console errors beyond the pre-existing Supabase-fallback 400s every page already produces without a live backend)
- [ ] **Mock data only, by explicit user decision** — org bio/founding/CEO/volunteer/address/phone fields and per-campaign donors/communities exist only in `mock-data.ts`, not in `supabase/schema.sql`/`seed.sql`. Revisit if/when this page needs to run against real org data.
- [ ] No real video/photo assets — hero and org-video slots are gradient placeholders with a play icon, matching the rest of the app's asset-free demo state
- [ ] `getCampaignCommunities()` only has seed rows for campaign ids "1" and "4" — other campaigns show the empty state
- [ ] The 3 "org products" on `/nonprofit/[id]` are derived by taking up to 3 unique product ids across that org's campaigns (there's no direct org→product catalog table yet) — revisit once orgs have their own product catalog independent of campaigns

---

## Nonprofit Admin Panel Redesign ✅ UI (mock data only)

Built from 6 reference screenshots the user provided, describing a teal-sidebar admin panel with two expandable nav groups (ניהול קמפיינים / ניהול מוצרים, each with a table "dashboard" sub-view and a card "grid" view) plus צפייה בתרומות, שליחת עדכונים, and הקהילות שלי.

- [x] New route group `src/app/nonprofit/(admin)/` sharing `AdminShell` (sidebar + top bar) via a group `layout.tsx`:
  - `/nonprofit` — campaigns table dashboard (new starting page, replaces the old single-page NP dashboard)
  - `/nonprofit/campaigns` — campaigns grid (donut-chart cards)
  - `/nonprofit/products/dashboard` — products table dashboard
  - `/nonprofit/products` — products grid (donut-chart cards, first card links back to the dashboard)
  - `/nonprofit/donations` — donations table
  - `/nonprofit/updates` — alerts/updates table with טריגר/תזמון tabs and a per-row action dropdown
  - `/nonprofit/communities` — stub "coming soon" (not detailed in the reference screenshots)
- [x] `nonprofit/[id]/page.tsx` (public org profile) and `nonprofit/create-campaign/page.tsx` (wizard) deliberately left **outside** the `(admin)` group so they don't inherit the admin sidebar
- [x] New components: `src/components/nonprofit-admin/AdminShell.tsx`, `DonutChart.tsx` (conic-gradient ring), `StatHeader.tsx`, `SearchFilterBar.tsx`
- [x] New mock data file `src/lib/nonprofit-admin-data.ts` (campaign/product/donation/update table + card rows) — mirrors the existing `landing-data.ts` pattern of a page-bundle-specific mock file
- [x] `BottomNav`'s nonprofit tabs updated to point at the new real routes (`/nonprofit/campaigns`, `/nonprofit/donations`) instead of all four tabs pointing at `/nonprofit`
- Verified with `tsc --noEmit` (zero errors in any new file), `eslint` (clean), and a Playwright screenshot pass of all 6 pages against the running dev server — sidebar active-state highlighting, donut charts, tabs, and the update-row dropdown menu all confirmed working, no console errors
- [ ] **Mock data only** — `getNpDashboardData()` in `queries-orgs.ts` (the old Supabase-backed dashboard query) is now unused dead code; left in place rather than deleted since a future real per-org dashboard may still want it. Revisit once these admin pages need real per-org, per-auth data.
- [ ] No search/filter/sort functionality is wired — `SearchFilterBar` and the table sort arrows are visual only
- [ ] Table pages have no dedicated mobile layout (horizontal scroll only) — the admin sidebar is desktop-only (`hidden md:flex`); mobile users navigate via `BottomNav` instead
- [x] Updates management restored to the reference design: working trigger/schedule tabs, search and category filtering, create/edit flows, and duplicate/pause/remove row actions. Rows now persist in `ngo_updates`; immediate Push updates also create donor-facing `system_updates` records.
- [x] Campaigns-dashboard and products-dashboard header/sub-nav links swapped per user request: "ניהול קמפיינים" now opens the table dashboard (`/nonprofit`) and "דשבורד קמפיינים" the grid (`/nonprofit/campaigns`) — page content at each URL is unchanged, only which sidebar label points where
- [x] Row-expansion detail panels added to both dashboard tables (click the chevron at the end of a row):
  - Campaigns dashboard → `CampaignDetailPanel`: SKU code, per-product donation bars with month/year filter dropdowns + monthly total, a raised/goal donut chart, and linked-communities pills
  - Products dashboard → `ProductDetailPanel`: SKU code, per-month donation bars with year/campaign filter dropdowns + yearly total, and a donated/goal donut chart
  - Both built from reference screenshots; dropdowns are functional (open/select/close) but don't actually refilter the mock bar data
- [x] `/nonprofit/communities` built from a reference screenshot: table (name, activity area, join date, active campaigns, products sold, total raised, contact) + a "שליחת עדכון למנהלי הקהילות" button + stat header — the ⋮ actions button is a non-functional placeholder

**Nonprofit Admin — Create Update Wizard (2026-08-18)** — second half of the 2-screen plan sourced from client PDFs (see "Donor Profile + Updates Screens" above); this is the admin-authoring counterpart to the donor's "עדכוני מערכת" tab:
- [x] `src/components/nonprofit-admin/CreateUpdateWizard.tsx` (new) + `CreateUpdateWizardSteps.tsx` (new, step components extracted to stay near the 200-line target — the two-file split is a single cohesive wizard, same precedent as the existing 6-step campaign wizard exception in `DECISIONS.md`) — full-screen 3-step overlay: (1) recipients — product donors / campaign donors / all donors, with chip multi-select sourced from `adminProductRows`/`adminCampaignRows`; (2) channels (Push/Email/SMS) + timing (now / scheduled / by-trigger, with a 3-option deterministic trigger list); (3) title/body/CTA/image-or-video picker, with a live teal preview panel throughout
- [x] Wired to `/nonprofit/(admin)/updates/page.tsx`; create and edit complete through the shared wizard, while duplicate, pause/resume, and remove are available from each row's action menu. The table is local component state seeded from `adminUpdateRows`.
- [x] Translations: `adm.uw.*` keys (Hebrew + English)
- [x] NGO update authoring is backed by tenant-safe RPCs (`save_ngo_update`, `manage_ngo_update`) and survives refresh. Immediate Push delivery is represented in the donor's system updates feed.
- [ ] Image/video picker only captures the filename client-side — no Supabase Storage upload wired (same open item noted for the donor-side plan)
- [ ] "Scheduled" and "by-trigger" timing are captured in the draft but not enforced by anything — there's no scheduler/trigger-evaluation backend

**Community admin section (2026-08-11)** — `/community` rebuilt from a single leaderboard/stats page into a full admin tree mirroring `nonprofit/(admin)/`, built from a reference screenshot plus a client-provided PDF ("COMMUNITY PAGES.pdf"):
- [x] `AdminShell` now takes a `variant: "nonprofit" | "community"` prop; community variant hides the Products nav group and points routes at `/community/*`. Default variant is `"nonprofit"` so existing nonprofit admin pages are unaffected.
- [x] `community/layout.tsx` wraps all `/community/*` pages in `<AdminShell variant="community">`
- [x] Pages: `/community` (campaigns table dashboard, created/linked tabs, edit/view popups, paused-row treatment, expandable detail row reusing `CampaignDetailPanel`), `/community/campaigns` (donut-chart card grid + dark "go to dashboard" card), `/community/donations`, `/community/nonprofits` (community's affiliated nonprofits — reverse of `/nonprofit/communities`)
- [x] New mock data file `src/lib/community-admin-data.ts`, mirrors `nonprofit-admin-data.ts`'s shape; campaign rows carry `source: "created" | "linked"` for the tab filter
- [x] New components: `src/components/community/CampaignSourceTabs.tsx`, `CommunityCampaignsTable.tsx`
- Verified: all `/community/*` and `/nonprofit/*` routes return 200 against the running dev server; `tsc --noEmit` shows no new errors (only pre-existing, unrelated Supabase-typed-as-`never` errors elsewhere)
- [ ] **Old leaderboard page fully replaced** — the previous `/community` page (progress bar, leaderboard, export card, `getCommunityDashboardData()`) is gone. `getCommunityDashboardData()` in `queries-community.ts` and `communityStats` in `mock-data.ts` are now unused dead code; left in place rather than deleted. If the leaderboard/export-card UX is still wanted, it needs a new home (it wasn't in the reference PDF).
- [x] `/community/updates` has a real trigger/schedule table and shared admin-shell treatment.
- [ ] No search/filter/sort functionality wired on any `/community/*` table (same gap as the nonprofit admin tables)
- [x] Campaign table/card actions now navigate to the public campaign and pause/resume the community's own participation through `set_community_campaign`; communities cannot edit the nonprofit-owned campaign record.

**Community "Search Campaigns" + Updates schedule tab (2026-08-11)** — built from a client-provided PDF ("CAMPAIN.pdf"), scoped to the community admin, not nonprofit. (First implemented against the wrong section — the reference screenshot's sidebar labels `adm.navCommunities`/`adm.navUpdates` are shared text reused by both `AdminShell` variants, so they didn't actually disambiguate; the user corrected the scoping. Semantically community fits much better anyway: a community *requests to join* a campaign it doesn't own, whereas a nonprofit creates its own.)
- [x] New page `/community/campaigns/search`: search bar + non-functional sort/filter dropdowns (`adm.sortBy`/`adm.filterBy`, option lists hardcoded from the reference screenshot, don't actually re-sort/filter the mock cards — same pattern as other dropdowns in this admin section), campaign cards with an activity-area badge and a "בקשת הצטרפות" (request to join) toggle button that's local component state only (no persistence, no backend)
- [x] `CommunityCampaignCard` type in `community-admin-data.ts` gained optional `activityArea`/`activityAreaEn` fields
- [x] Sidebar bottom CTA (`AdminShell`, community variant only) now links to `/community/campaigns/search` with label "הקמה/הצטרפות לקמפיין" (new `cm.newOrJoinCampaign` key, distinct from the nonprofit variant's unchanged `adm.newCampaign`/"הקמת קמפיין" which still links straight to `/nonprofit/create-campaign`)
- [x] `/community/updates` — was a "coming soon" stub, now a real page with Trigger vs Schedule tabs rendering genuinely different columns/data (Schedule adds תזמון/יום, drops טריגר) — new `communityUpdateRows`/`communityUpdateScheduleRows` mock arrays in `community-admin-data.ts`. `/nonprofit/updates` now follows the same trigger/schedule interaction model using its own local mock rows and shared nonprofit update wizard.
- Verified: `/community/campaigns/search` and `/community/updates` return 200 with no console/compile errors against the running dev server; `tsc --noEmit` shows no new errors; `/nonprofit/*` routes re-verified unaffected by the revert
- [x] "Request to join" persists a `pending` row in `community_campaigns`; cancellation and active/paused participation state are tenant-scoped. NGO approval/notification UI remains a follow-up.
- [ ] The "יצירת קמפיין חדש" button on `/community/campaigns/search` links to `/community` (the campaigns dashboard) since there's no community-side campaign-creation wizard yet — **open question** whether communities should get their own creation flow or always go through a nonprofit

---

## Phase 4 — Payments

- [x] Initial provider onboarding for Cardcom and Grow: NGO owners can register their own terminal identifier through tenant-derived RPCs; no provider credentials or card data are stored in the browser database. Migration `20260830143000` must be applied through the Supabase SQL Editor.
- [ ] Add secure server-only provider credential onboarding and terminal verification for Cardcom and Grow; registered terminals remain `setup_required` until this exists.
- [ ] Integrate PSP SDK for credit card tokenization
- [ ] Implement actual charge flow (PCI-compliant, card data never touches our server)
- [ ] Implement Impactify-scheduled recurring token charges, provider webhook verification/retries, and donor cancellation. Do not reserve an annual amount in advance; each monthly charge is submitted separately, subject to issuer approval.
- [ ] PDF receipt generation (Section 46 tax compliance — **open question**)
- [ ] Do not activate recurring-donation, payment-method, receipt, certificate, or tax-email actions until the PSP and document-delivery contracts are implemented; the current data model has no valid issuer/token flow.

---

## Phase 5 — Non-Profit Features

- [ ] Non-profit registration and document verification flow
- [ ] Complete product catalog CRUD (edit/delete charitable products; create is live)
- [ ] Campaign analytics dashboard (per-campaign breakdown)
- [ ] Bulk receipt generation (year-end)
- [ ] Org → Community invitation (step 5 of wizard) — notification system

---

## Phase 6 — Community Manager

- [ ] Community affiliation request flow (community → org)
- [ ] Referral link generation + UTM/platform-native attribution tracking
- [ ] Actual styled screenshot export (server-side image generation with `satori` or `html2canvas`)
- [ ] Community public page (עמוד קהילה)
- [ ] Leaderboard real data

---

## Phase 7 — Donor Advanced Features

- [ ] Personal campaign creation (birthday fundraisers)
- [ ] Campaign reminder dates system (push notifications)
- [ ] Dedication donation certificate (PDF)
- [ ] Donation history with filters (date, product, campaign)

---

## Known Tech Debt

- **Cookie-consent integration boundary (2026-08-30):** the browser consent UI persists analytics/marketing choices; no optional tracking SDK is loaded, and YouTube campaign embeds wait for marketing approval. Before adding Google Analytics, Meta Pixel, session replay, A/B testing, or another non-essential third party, gate its load behind `CookieConsentProvider` and complete legal/vendor review for data processing and any transfer outside Israel.

- **Security hardening pending deployment (2026-08-30):** application code now removes raw card/CVV fields, disables unverified production payment completion, adds same-origin/bounded JSON checks and response security headers, restricts campaign video hosts, and routes recurring/payment-display mutations through narrow RPCs. Apply `20260830170000_security_hardening.sql` in the Supabase SQL Editor before deploying the matching frontend. The remaining payment-critical task is a hosted Cardcom/Grow checkout plus signature verification, idempotent webhook processing, and replay protection. `npm audit` could not run because the local npm TLS chain reports `unable to verify the first certificate`; resolve the machine/enterprise CA trust rather than disabling SSL.

- **Admin content-editing mode (updated 2026-08-29, operable):** `AdminModeProvider` is nested under `AuthProvider`, accepts the persisted edit preference only for an authenticated `admin`, and clears stale edit state for every other role. The production `TopNav` exposes the online edit toggle only to admins; the development `DemoBar` uses the same role check. `EditableText` is converted across ~55 files / ~270 rendered `t()` call sites; edits save to the live `site_content` table, whose RLS independently restricts insert/update to authenticated admins. Remaining work:
  - Attribute-position text (`placeholder`, `aria-label`, `title`, table-header string arrays, `StatHeader` label props) was intentionally left as plain `t()` calls — `EditableText` only wraps rendered JSX text nodes, not string props. Not in scope for this pass.
  - `site_content` writes are now restricted to authenticated admins; attribute-position strings remain outside the inline editor.
- **SQL Editor is the required migration path (updated 2026-08-28):** the linked CLI consistently fails while initializing its temporary database login role. Do not retry `db push`; apply timestamped migration files directly through the authenticated Dashboard SQL Editor, reconcile the migration ledger, and run a separate read-only verification query.
- **Root route swap (2026-08-23):** `/` now serves the marketing landing page (same content as `/landing`, duplicated). The old donor-home screen was archived to `app/_archive/old-home/page.tsx` (Next.js private folder, excluded from routing) rather than deleted or re-routed. Two follow-ups from this, not yet decided:
  - Where should donor-home live now? (e.g. new route like `/home` or `/dashboard`) — currently unreachable via any link.
  - These pages still `Link`/`redirect` to `/` expecting donor-home and will now land on the marketing page instead: `my-donations`, `auth`, `nonprofit/[id]`, `campaign/[id]`, `TopNav.tsx`, `recurring`, `donate/[id]/thanks`.
- Donation amount is threaded through the flow; payment submission now redirects only after the Supabase insert succeeds and the thanks page verifies the donation/receipt pair.
- `CategoryFilter` state is local — doesn't filter the home page grid (only UI state, no effect on campaign list)
- `BottomNav` active state uses `pathname === href` which breaks for nested routes like `/donate/[id]/amount`
- No error boundaries or loading states on any page
- No `not-found.tsx` pages for invalid campaign IDs
- **TypeScript build escape hatch removed (2026-08-23):** embedded-join/table relationships were corrected in `src/lib/supabase/types.ts`; `tsc --noEmit` is clean and `next.config.ts` no longer ignores build errors. Regenerating types from the live schema remains preferable after the pending migrations are applied.

---

## Open Questions

1. Which Israeli PSP? (Tranzilla / Cardcom / PayMe)
2. Platform commission percentage on donations?
3. Non-profit verification: documents required, moderation queue?
4. Section 46 tax receipt auto-compliance requirements?
5. Community-initiated affiliation — can a community request to join an org?
6. Styled export card dimensions (Instagram story / WhatsApp image)?
