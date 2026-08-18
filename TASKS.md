# Tasks — RAZ Donation Platform

## Current State

Full desktop demo with 11 screens, responsive layout, bilingual (Hebrew/English), desktop TopNav, mobile BottomNav. Mock data throughout. No backend, no auth, no real payments.

### Screens complete
- `/` — Donor home: teal header, featured campaign, responsive 2→4 column grid
- `/search` — Search with live filter, category chips, sort, 2→4 column grid
- `/campaign/[id]` — Two-column desktop: story/products left, donation sidebar right (sticky)
- `/donate/[id]/amount` — Centered card, 4-preset grid, recurring + dedication toggles
- `/donate/[id]/payment` — Two-column: form left, campaign summary card right
- `/donate/[id]/thanks` — Centered success with receipt + share
- `/nonprofit` — Dark header, 4-column metrics, campaign list with progress
- `/nonprofit/create-campaign` — 6-step wizard (basics→story→media→products→communities→publish)
- `/community` — Two-column: stats/leaderboard left, styled export card right (sticky)
- `/profile` — Two-column: history/settings left, impact summary right; links to הוראות קבע
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
- [x] Data layer with mock fallback (`src/lib/supabase/queries.ts`)
- [x] Home page reads from Supabase (loading skeleton + fallback to mock)
- [x] Query layer split: `query-helpers.ts` + `queries-campaigns.ts` + `queries-orgs.ts` + `queries-community.ts`
- [x] Search — real-time Supabase full-text search with 300ms debounce
- [x] Campaign detail — real campaign + org + products from DB
- [x] Donation amount — campaign loaded from DB
- [x] NP dashboard — real org + campaigns from DB
- [x] Community dashboard — real community stats + leaderboard from DB
- [x] Profile + recurring — read real data from DB when signed in; sign-in prompt when not
- [x] Donation write — `POST /api/donations` (server-side, validates at trust boundary)
- [ ] Image storage — campaign hero images (Supabase Storage)

---

## Phase 3 — Authentication ✅ (email OTP complete)

- [x] `middleware.ts` — session refresh on every request
- [x] `AuthContext.tsx` — `useAuth()` hook: `{ user, loading, signOut }`
- [x] `/auth` — email entry → magic link (Supabase free tier; custom SMTP needed for 6-digit code)
- [x] `/auth/callback` — exchanges `?code=` param for session, redirects to `/auth/setup`
- [x] Supabase URL Config: `http://localhost:3000/auth/callback` must be in Redirect URLs
- [x] `/auth/setup` — name + role selection after first login
- [x] `TopNav` — shows real user email when signed in; Sign In button when not
- [x] `layout.tsx` — wrapped with `AuthProvider`
- [ ] Switch to phone OTP — add Supabase SMS hook → Inforu/Twilio when SMS provider is ready
- [ ] Remove `DemoBar` or gate behind `NODE_ENV=development` before production

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

## Public Landing Page (`/landing`) ✅ structure

- [x] `src/app/landing/page.tsx` — new public marketing route, separate from the signed-in donor dashboard at `/` (not touched)
- [x] Sections built from a Figma reference (`src/components/landing/`): `LandingHeader`, `Hero`, `ProductCarousel`, `ImpactStatsGrid`, `WhyJoinSection`, `SignupSection`, `VideoSection`, `ContactCTA`, `MascotDonationForm`, `LandingFooter`
- [x] Static data extracted to `src/lib/landing-data.ts`; copy added under `landing.*` keys in `src/lib/translations.ts` (He + En)
- [ ] **Confirm exact heading wording** for the product carousel — read from a compressed screenshot as "בחירת הגולשים"; contextually may actually be something like "בחירת הסלים" (basket selection). Needs a direct check against the Figma text layer.
- [ ] **Confirm whether repeated content is intentional**: the 7-icon audience row repeats קשיש/ה and חייל/ת twice, and the "why join" 3-column section repeats the same paragraph under all 3 icons in the source Figma mock — built as-is, but this looks like a Figma placeholder duplication rather than final per-column copy.
- [ ] Impact-stats tile captions are best-effort readings of small screenshot text, not verified letter-for-letter — needs a copy pass against the actual Figma text layers.
- [ ] Footer contact info (`Lorem@ipsum.com`, placeholder phone) is literally Lorem Ipsum in the source design — replace with real contact details before shipping.
- [ ] No real hero/product photography, no real video asset, mascot is a placeholder emoji (no illustration asset in the repo)
- [ ] Signup form, contact form, and social/auth-provider buttons are visual only — not wired to any backend or OAuth provider
- [ ] Brand name shown in this design, "נתינה בקליק", differs from the app's brand string ("Impactify" in `translations.ts`, renamed 2026-08-11; also "יב קליק" in one footer link) — reconcile before this page is treated as canonical

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
- [ ] Updates page dropdown ("פעולה 1/2/3") and "יצירת עדכון חדש" button are non-functional placeholders
- [x] Campaigns-dashboard and products-dashboard header/sub-nav links swapped per user request: "ניהול קמפיינים" now opens the table dashboard (`/nonprofit`) and "דשבורד קמפיינים" the grid (`/nonprofit/campaigns`) — page content at each URL is unchanged, only which sidebar label points where
- [x] Row-expansion detail panels added to both dashboard tables (click the chevron at the end of a row):
  - Campaigns dashboard → `CampaignDetailPanel`: SKU code, per-product donation bars with month/year filter dropdowns + monthly total, a raised/goal donut chart, and linked-communities pills
  - Products dashboard → `ProductDetailPanel`: SKU code, per-month donation bars with year/campaign filter dropdowns + yearly total, and a donated/goal donut chart
  - Both built from reference screenshots; dropdowns are functional (open/select/close) but don't actually refilter the mock bar data
- [x] `/nonprofit/communities` built from a reference screenshot: table (name, activity area, join date, active campaigns, products sold, total raised, contact) + a "שליחת עדכון למנהלי הקהילות" button + stat header — the ⋮ actions button is a non-functional placeholder

**Community admin section (2026-08-11)** — `/community` rebuilt from a single leaderboard/stats page into a full admin tree mirroring `nonprofit/(admin)/`, built from a reference screenshot plus a client-provided PDF ("COMMUNITY PAGES.pdf"):
- [x] `AdminShell` now takes a `variant: "nonprofit" | "community"` prop; community variant hides the Products nav group and points routes at `/community/*`. Default variant is `"nonprofit"` so existing nonprofit admin pages are unaffected.
- [x] `community/layout.tsx` wraps all `/community/*` pages in `<AdminShell variant="community">`
- [x] Pages: `/community` (campaigns table dashboard, created/linked tabs, edit/view popups, paused-row treatment, expandable detail row reusing `CampaignDetailPanel`), `/community/campaigns` (donut-chart card grid + dark "go to dashboard" card), `/community/donations`, `/community/nonprofits` (community's affiliated nonprofits — reverse of `/nonprofit/communities`)
- [x] New mock data file `src/lib/community-admin-data.ts`, mirrors `nonprofit-admin-data.ts`'s shape; campaign rows carry `source: "created" | "linked"` for the tab filter
- [x] New components: `src/components/community/CampaignSourceTabs.tsx`, `CommunityCampaignsTable.tsx`
- Verified: all `/community/*` and `/nonprofit/*` routes return 200 against the running dev server; `tsc --noEmit` shows no new errors (only pre-existing, unrelated Supabase-typed-as-`never` errors elsewhere)
- [ ] **Old leaderboard page fully replaced** — the previous `/community` page (progress bar, leaderboard, export card, `getCommunityDashboardData()`) is gone. `getCommunityDashboardData()` in `queries-community.ts` and `communityStats` in `mock-data.ts` are now unused dead code; left in place rather than deleted. If the leaderboard/export-card UX is still wanted, it needs a new home (it wasn't in the reference PDF).
- [ ] `/community/updates` is a "coming soon" stub — not in the reference PDF, kept only so the sidebar link isn't dead. Needs a real design.
- [ ] No search/filter/sort functionality wired on any `/community/*` table (same gap as the nonprofit admin tables)
- [ ] View/edit popup menu items on the campaigns table are mostly non-functional placeholders, except "Copy link" which does call `navigator.clipboard.writeText`

**Community "Search Campaigns" + Updates schedule tab (2026-08-11)** — built from a client-provided PDF ("CAMPAIN.pdf"), scoped to the community admin, not nonprofit. (First implemented against the wrong section — the reference screenshot's sidebar labels `adm.navCommunities`/`adm.navUpdates` are shared text reused by both `AdminShell` variants, so they didn't actually disambiguate; the user corrected the scoping. Semantically community fits much better anyway: a community *requests to join* a campaign it doesn't own, whereas a nonprofit creates its own.)
- [x] New page `/community/campaigns/search`: search bar + non-functional sort/filter dropdowns (`adm.sortBy`/`adm.filterBy`, option lists hardcoded from the reference screenshot, don't actually re-sort/filter the mock cards — same pattern as other dropdowns in this admin section), campaign cards with an activity-area badge and a "בקשת הצטרפות" (request to join) toggle button that's local component state only (no persistence, no backend)
- [x] `CommunityCampaignCard` type in `community-admin-data.ts` gained optional `activityArea`/`activityAreaEn` fields
- [x] Sidebar bottom CTA (`AdminShell`, community variant only) now links to `/community/campaigns/search` with label "הקמה/הצטרפות לקמפיין" (new `cm.newOrJoinCampaign` key, distinct from the nonprofit variant's unchanged `adm.newCampaign`/"הקמת קמפיין" which still links straight to `/nonprofit/create-campaign`)
- [x] `/community/updates` — was a "coming soon" stub, now a real page with Trigger vs Schedule tabs rendering genuinely different columns/data (Schedule adds תזמון/יום, drops טריגר) — new `communityUpdateRows`/`communityUpdateScheduleRows` mock arrays in `community-admin-data.ts`, mirroring `/nonprofit/updates`'s existing single-tab table (nonprofit's Updates page was left as-is; it does not have the schedule/trigger column split)
- Verified: `/community/campaigns/search` and `/community/updates` return 200 with no console/compile errors against the running dev server; `tsc --noEmit` shows no new errors; `/nonprofit/*` routes re-verified unaffected by the revert
- [ ] "Request to join" has no real backend meaning defined yet — **open question** whether it should notify the org, create a pending-approval record, or something else once real data replaces the mocks
- [ ] The "יצירת קמפיין חדש" button on `/community/campaigns/search` links to `/community` (the campaigns dashboard) since there's no community-side campaign-creation wizard yet — **open question** whether communities should get their own creation flow or always go through a nonprofit

---

## Phase 4 — Payments

- [ ] Decide Israeli PSP (Tranzilla, Cardcom, or PayMe) — **open question**
- [ ] Integrate PSP SDK for credit card tokenization
- [ ] Implement actual charge flow (PCI-compliant, card data never touches our server)
- [ ] Recurring donation setup + cancellation
- [ ] PDF receipt generation (Section 46 tax compliance — **open question**)

---

## Phase 5 — Non-Profit Features

- [ ] Non-profit registration and document verification flow
- [ ] Product catalog CRUD (create/edit/delete charitable products)
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

- Amount state not threaded through donation flow (hardcoded ₪100)
- `CategoryFilter` state is local — doesn't filter the home page grid (only UI state, no effect on campaign list)
- `BottomNav` active state uses `pathname === href` which breaks for nested routes like `/donate/[id]/amount`
- No error boundaries or loading states on any page
- No `not-found.tsx` pages for invalid campaign IDs

---

## Open Questions

1. Which Israeli PSP? (Tranzilla / Cardcom / PayMe)
2. Platform commission percentage on donations?
3. Non-profit verification: documents required, moderation queue?
4. Section 46 tax receipt auto-compliance requirements?
5. Community-initiated affiliation — can a community request to join an org?
6. Styled export card dimensions (Instagram story / WhatsApp image)?
