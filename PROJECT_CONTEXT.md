# Project Context — Impactify

## What It Is

**Impactify** is a bilingual (Hebrew/English) Israeli-market charitable donation platform. It operates primarily in Hebrew RTL but switches fully to English LTR via a language toggle. It acts as a marketplace connecting three sides: donors who give, non-profit organizations that run campaigns, and community managers who mobilize their followers to donate (social-influencer model).

## User Types

| Role | Hebrew | Core capability |
|---|---|---|
| **Donor** (תורם) | Individual | Browses campaigns, donates, creates personal fundraisers |
| **NGO Owner** (בעל עמותה) | Organization owner | Defines the NGO's bilingual goals during signup, updates them from the profile, and manages campaigns and tenant data |
| **Community Owner** (בעל קהילה) | Community owner | Runs community campaigns and sees attributed activity |
| **Admin** (מנהל מערכת) | Platform operator | Promotes/demotes users, assigns their NGO/community tenant, and permanently deletes other user accounts |

## Current Build Status

**Supabase-backed demo application** — public, donor, NGO-owner, community-owner, admin, and landing-page data flow through Supabase. The two admin dashboards derive their tenant from the authenticated profile and query normalized tables; only shared/landing presentation fixtures remain in public-read-only `site_datasets` rows. Query errors and empty results are surfaced instead of silently falling back to bundled mock values. Authentication and development-only donation simulation exist; production payment submission is disabled until a PSP-hosted checkout and signed callback are implemented.

The `site_datasets` and organization-profile migrations were applied to the live project through the Dashboard SQL Editor on 2026-08-23. The later auth migration removed obsolete admin snapshots; REST verification confirms the two required shared/landing dataset rows and all five extended organization profiles.

Campaigns support three fundraising target cadences: a fixed deadline, a calendar-month target, or a calendar-year target. The donor-facing campaign, product-detail, and donation-modal progress views always show the active target window. At a month/year boundary the displayed total restarts automatically from the immutable donation ledger; historical donation data and lifetime campaign totals are never deleted.

Product details link directly to a public nonprofit profile at `/organization/[id]`, which provides the organization overview and its active campaign cards. Product media appears first in the reading direction (right in Hebrew RTL and left in English LTR); remaining products from the same campaign are shown below the product and campaign details.

Four-role auth, one-time onboarding RPCs, admin role management, tenant RLS, and atomic campaign publishing from migrations `20260823160000`–`20260823162000` are live. The sole existing profile was bootstrapped as the initial admin after an exact one-profile/zero-admin precondition check. REST and SQL probes verified tenant consistency, blocked bank fields, blocked anonymous RPC execution, and rejected a simulated non-admin role change.

Structured NGO goals are live from migration `20260825130000`. New NGO owners must provide 1–10 goals during onboarding; existing NGO owners can add or revise them from `/nonprofit/profile`, and public NGO profiles display the persisted list.

### Screens Built
- Donor home feed (featured campaign hero + category chips + grid)
- Campaign search with live text filter + category filter
- Campaign detail (video/image hero, progress, donate-amount popup, 3 quick-donate products, donors/communities/story/org tabs)
- Product detail (`/product/[id]?campaign_id=…`) — opened from a product-card body; shows product, nonprofit and campaign context/progress, then opens the donation popup only from its CTA
- Public organization profile (`/organization/[id]`) — opened from a product's nonprofit name; presents a featured active campaign, donation products, and tabs for privacy-safe recent donation totals, active partner communities, campaign story, and organization details
- Public non-profit profile (`/nonprofit/[id]`) — org video, verification/founding/CEO/volunteer/address info, product quantity picker with running total, one-click donate that skips straight to payment
- Donation flow: amount selection → hosted-payment readiness screen; completed-payment simulation and thank-you confirmation are development-only until the PSP is connected
- Non-Profit admin panel (`/nonprofit/*`, teal sidebar shell) — campaigns dashboard (table) + campaigns grid (donut-chart cards), searchable/filterable products-management table with tenant-scoped creation/editing + products grid (donut-chart cards), donations table, updates/alerts table with trigger/schedule tabs; replaces the old single-page NP dashboard
- NGO onboarding (`/nonprofit/onboarding`) — a five-step guided setup after NGO signup: organization readiness, payment-terminal setup, first product creation with a live preview, first-campaign handoff for community invitations, and dashboard completion
- Community onboarding (`/community/onboarding`) — a matching five-step guided setup after community signup: tenant readiness, active-campaign discovery, a persisted join request, an explicit NGO-approval wait state, and dashboard handoff
- Bidirectional partnership queues (`20260902100000_bidirectional_partnership_queue.sql`) — code and migration define many-to-many NGO/community campaign partnerships, three-slot review queues in both directions, FIFO backlog, mutual-interest auto-approval, 30-day re-request cooldowns, and in-app daily digests. **Deployment status: pending Dashboard SQL Editor application and live verification.**
- 6-step campaign creation/editing wizard (basics → story → media → products → communities → publish/save)
- Community manager dashboard (stats, leaderboard, styled social card export preview)
- Donor profile (donation history, receipts menu)

### Not Yet Built
- Phone OTP authentication
- Real payment processing (Israeli PSP — Tranzilla/Cardcom, TBD)
- Real payment-service-provider integration
- Non-profit verification flow
- Personal campaigns (donor-created fundraisers)
- SMS / push notifications
- Mascot character (9 states — no assets yet)
- WhatsApp deep-link sharing
- PDF receipt generation

## Key Product Differentiators (from PRD)

1. **Community-as-Influencer** — community managers act as social affiliates, not just donors
2. **Styled screenshot export** — community dashboard generates shareable social cards
3. **Product-based giving** — orgs define priced "products" (e.g. "Hot Meal = ₪50") that donors can buy
4. **Org → Community invitation** — orgs invite communities in the campaign creation wizard (step 5)
5. **Hebrew-first, bilingual** — full RTL with `dir` switching, Assistant font, Israeli phone format, Section 46 tax receipts. Language toggle in DemoBar + TopNav; state persisted in `localStorage`. Public legal pages and application copy are translated.

## Open Questions (from PRD)

- Which Israeli PSP? (Tranzilla, Cardcom, PayMe)
- Platform commission on donations?
- Non-profit verification: what documents, who moderates?
- Section 46 tax receipt auto-compliance?
