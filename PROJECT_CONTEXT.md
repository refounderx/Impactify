# Project Context — Impactify

## What It Is

**Impactify** is a bilingual (Hebrew/English) Israeli-market charitable donation platform. It operates primarily in Hebrew RTL but switches fully to English LTR via a language toggle. It acts as a marketplace connecting three sides: donors who give, non-profit organizations that run campaigns, and community managers who mobilize their followers to donate (social-influencer model).

## User Types

| Role | Hebrew | Core capability |
|---|---|---|
| **Donor** (תורם) | Individual | Browses campaigns, donates, creates personal fundraisers |
| **Non-Profit** (עמותה) | Organization | Creates campaigns, manages products, issues tax receipts |
| **Community Manager** (מנהל קהילה) | Influencer | Runs sub-campaigns, shares referral links, exports social cards |

## Current Build Status

**Demo-only UI** — all 10 screens are wired with mock data (`src/lib/mock-data.ts`). Navigation flows work end-to-end (home → campaign → donate → thanks). Role switching via the DemoBar. No backend, no auth, no real payments.

### Screens Built
- Donor home feed (featured campaign hero + category chips + grid)
- Campaign search with live text filter + category filter
- Campaign detail (video/image hero, progress, donate-amount popup, 3 quick-donate products, donors/communities/story/org tabs)
- Public non-profit profile (`/nonprofit/[id]`) — org video, verification/founding/CEO/volunteer/address info, product quantity picker with running total, one-click donate that skips straight to payment
- Donation flow: amount selection → payment form → thank you
- Non-Profit admin panel (`/nonprofit/*`, teal sidebar shell) — campaigns dashboard (table) + campaigns grid (donut-chart cards), products dashboard (table) + products grid (donut-chart cards), donations table, updates/alerts table with trigger/schedule tabs; replaces the old single-page NP dashboard
- 6-step campaign creation wizard (basics → story → media → products → communities → publish)
- Community manager dashboard (stats, leaderboard, styled social card export preview)
- Donor profile (donation history, receipts menu)

### Not Yet Built
- Phone OTP authentication
- Real payment processing (Israeli PSP — Tranzilla/Cardcom, TBD)
- Database / backend API
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
5. **Hebrew-first, bilingual** — full RTL with `dir` switching, Heebo font, Israeli phone format, Section 46 tax receipts. Language toggle in DemoBar + TopNav; state persisted in `localStorage`. All 11 screens + mock data fully translated.

## Open Questions (from PRD)

- Which Israeli PSP? (Tranzilla, Cardcom, PayMe)
- Platform commission on donations?
- Non-profit verification: what documents, who moderates?
- Section 46 tax receipt auto-compliance?
- Community-initiated affiliation (can community request to join org, or only org invites?)
