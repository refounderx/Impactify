# Architecture — Impactify

## System Overview

```
Browser
  └── Next.js 16 (App Router)  [local / Vercel]
        ├── middleware.ts          → refreshes Supabase session on every request
        ├── Client components      → Supabase JS client (anon key, RLS-filtered)
        ├── AuthContext            → tracks User object, exposes useAuth() hook
        ├── /api/donations         → server route: validates + writes donations to DB
        └── Server components      → Supabase SSR client (cookie-based session)
              └── Admin client     → service role (seeding only, never in browser)
                    └── PostgreSQL (Supabase) [Frankfurt eu-central-1]
                          ├── Row Level Security on every table
                          └── Triggers: auto-create profile, update campaign stats
```

## Auth Flow

```
/auth page
  Step 1: email entry → supabase.auth.signInWithOtp({ email })
                       → Supabase sends 6-digit code to email (built-in, no SMS provider needed)
  Step 2: OTP entry   → supabase.auth.verifyOtp({ email, token, type: "email" })
                       → JWT + refresh token stored in HttpOnly cookies by Supabase SSR
  Step 3: /auth/setup → upsert profiles row (name, app_role)
  Step 4: redirect    → role-appropriate dashboard
```

**Session lifecycle:**
- `middleware.ts` runs on every request, calls `supabase.auth.getUser()` to refresh expired tokens
- JWT stored in cookies (HttpOnly via Supabase SSR) — XSS safe
- `AuthContext` subscribes to `onAuthStateChange` for real-time session sync in client components
- Sign-out: `supabase.auth.signOut()` clears cookies

## Data Flow

**Public pages (campaigns, orgs):**
```
page.tsx → queries.ts → Supabase anon client
  → PostgreSQL (RLS: public read policy) → data
  → if error/empty: fallback to mock-data.ts
```

**Authenticated reads (profile, recurring):**
```
page.tsx → useAuth() → user.id
  → queries-donations.ts → Supabase anon client
  → PostgreSQL (RLS: donor_id = auth.uid()) → only user's own data
```

**Donation write (trust boundary):**
```
payment/page.tsx → POST /api/donations (client fetch)
  → api/donations/route.ts → Supabase SSR client
  → supabase.auth.getUser() → validates session server-side
  → donations.insert({ donor_id: user?.id, amount, campaign_id, org_id })
  → trigger auto-increments campaigns.raised + donors_count
  → if is_recurring + user signed in: recurring_donations.insert()
```

## Module Structure

```
src/
├── app/                    Next.js pages (all client components currently)
├── components/
│   ├── layout/             DemoBar, TopNav, BottomNav, Header
│   ├── campaign/           CampaignCard, CategoryFilter, DonateAmountModal, ProductBuyCard, CampaignTabs
│   ├── nonprofit-admin/    AdminShell (sidebar+topbar; `variant: "nonprofit" | "community"` picks nav
│   │                       routes/labels and whether the Products group renders), DonutChart, StatHeader,
│   │                       SearchFilterBar, CampaignDetailPanel, ProductDetailPanel (row-expansion detail views)
│   ├── community/          CampaignSourceTabs (created/linked toggle), CommunityCampaignsTable —
│   │                       used only by the /community/* admin route tree
│   └── ui/                 ProgressBar
├── contexts/
│   ├── LanguageContext.tsx  HE/EN toggle, t() function, dir switching
│   └── AuthContext.tsx      Session state — useAuth() → { user, loading, signOut }
├── lib/
│   ├── mock-data.ts              Demo data + type shapes (fallback when Supabase empty)
│   ├── nonprofit-admin-data.ts   Mock-only data for /nonprofit/(admin)/* pages (no Supabase)
│   ├── community-admin-data.ts   Mock-only data for /community/* admin pages (no Supabase);
│   │                             campaign rows carry `source: "created" | "linked"` for the tab filter
│   ├── translations.ts           All UI strings in he + en
│   └── supabase/
│       ├── client.ts             Browser client (createBrowserClient)
│       ├── server.ts             Server/RSC client (createServerClient + cookies)
│       ├── admin.ts              Service role client (bypasses RLS — seeding only)
│       ├── types.ts              TypeScript types for all DB tables
│       ├── query-helpers.ts      Shared row→UI converters + attachProductIds util
│       ├── queries.ts            Re-export hub (imports from the three files below)
│       ├── queries-campaigns.ts  getCampaigns, getCampaignById, searchCampaigns, getProductsByIds
│       ├── queries-orgs.ts       getOrganizations, getOrgById, getNpDashboardData
│       ├── queries-community.ts  getCommunityDashboardData (+ real leaderboard)
│       └── queries-donations.ts  getMyDonations, getMyRecurring, updateRecurringStatus, cancelRecurring
├── app/
│   ├── api/donations/route.ts    POST — server-side donation write (validates, inserts, creates recurring)
│   ├── auth/page.tsx             Email + OTP 2-step auth screen
│   ├── auth/setup/page.tsx       Name + role selection after first login
│   ├── nonprofit/(admin)/        Route group (see note below)
│   └── community/                Admin route tree (see note below) — layout.tsx wraps children in
│                                  <AdminShell variant="community">, no route group needed (no
│                                  sibling non-admin /community pages exist)
├── middleware.ts                 Session refresh on every request
└── supabase/
    ├── schema.sql           Full DB schema + RLS policies + triggers
    └── seed.sql             Demo data INSERT statements
```

**`nonprofit/(admin)/` route group:** all pages inside share `AdminShell` (teal sidebar + top bar) via `nonprofit/(admin)/layout.tsx` — campaigns dashboard at `/nonprofit` (table) + grid at `/nonprofit/campaigns`, products dashboard at `/nonprofit/products/dashboard` (table) + grid at `/nonprofit/products`, plus `/nonprofit/donations`, `/nonprofit/updates`, `/nonprofit/communities` (stub). The sibling `nonprofit/[id]/page.tsx` (public org profile) and `nonprofit/create-campaign/page.tsx` (wizard) live outside the group so they render without the admin sidebar. Next.js resolves static segments (`campaigns`, `products`, …) before the `[id]` dynamic segment, so there's no routing collision.

**`community/` admin tree (added 2026-08-11):** mirrors the `nonprofit/(admin)/` pattern one level down — `AdminShell variant="community"` (no Products nav group) via `community/layout.tsx`. Campaigns dashboard at `/community` (table) + grid at `/community/campaigns`, `/community/campaigns/search` (browse other orgs' campaigns + "request to join"; opened via the sidebar's bottom CTA), plus `/community/donations`, `/community/nonprofits` (community's affiliated nonprofits — the reverse listing of `/nonprofit/communities`), `/community/updates` (trigger/schedule tabs, each with its own column set — same pattern as `/nonprofit/updates` but community-scoped data). All data is mock-only via `community-admin-data.ts`; there is no Supabase-backed community query path anymore. This replaced the previous single-page `/community` leaderboard/progress dashboard entirely. The sidebar's bottom CTA (`cm.newOrJoinCampaign`, "הקמה/הצטרפות לקמפיין" — distinct from the nonprofit variant's `adm.newCampaign` CTA, which still links straight to the create-campaign wizard) links to `/community/campaigns/search`.

## Database Schema

| Table | Purpose | RLS |
|---|---|---|
| `profiles` | Extends `auth.users` — role, org, community | Own row only |
| `organizations` | Non-profit orgs | Public read |
| `campaigns` | Fundraising campaigns | Public read (active); org members read all |
| `products` | Charitable items (ארוחה חמה etc.) | Public read |
| `campaign_products` | Campaign ↔ Product junction | Public read |
| `donations` | Immutable financial ledger | Own donations; org reads received |
| `recurring_donations` | Standing orders (הוראות קבע) | Own only |
| `communities` | Community groups | Public read |

**Key constraints:**
- `donations` is **append-only** — DB rules prevent UPDATE and DELETE
- Insert trigger auto-increments `campaigns.raised` and `campaigns.donors_count`
- Insert trigger auto-creates `profiles` row when user signs up

## RLS Security Model

```
Public (anon)  → can read: active campaigns, orgs, products
Donor          → can read/write: own donations, own profile, own recurring
Org member     → can read: all own org's campaigns + received donations
Org admin      → can insert/update: own org's campaigns
Community mgr  → can read: own community stats
```

## Language Architecture

- `LanguageContext.tsx` stores `lang: "he" | "en"` in React context + localStorage
- On switch: `document.documentElement.dir` flips (`rtl` ↔ `ltr`), `lang` attribute updates
- `t(key)` function resolves from `translations.ts`
- Mock data has parallel `*En` fields; queries layer returns both
- Card numbers, bank details, emails: always `dir="ltr"` regardless of page direction

## Current State

| Page | Data source |
|---|---|
| `/` Home | Supabase (`campaigns` + `organizations`) |
| `/search` | Supabase — real-time search with 300ms debounce |
| `/campaign/[id]` | Supabase (`campaigns` + `organizations` + `products`); donors/communities tabs are `mock-data.ts` only (no DB table yet) |
| `/donate/[id]/amount` | Supabase campaign lookup |
| `/nonprofit` and `/nonprofit/*` admin pages | `mock-data.ts` / `nonprofit-admin-data.ts` only — no auth-scoped org query yet (was Supabase-backed before the admin-panel redesign; `getNpDashboardData` in `queries-orgs.ts` is now unused) |
| `/nonprofit/[id]` | Supabase org lookup (`getOrgById`) + `mock-data.ts` for bio/founded/CEO/volunteers/address/phone (not in DB schema) |
| `/community` and `/community/*` admin pages | `community-admin-data.ts` only — mock, no Supabase (redesigned 2026-08-11 from a Supabase-backed leaderboard page; `getCommunityDashboardData` in `queries-community.ts` is now unused) |
| `/profile` | Mock (needs auth for `donor_id` filter) |
| `/recurring` | Mock (needs auth) |

All pages fall back to `mock-data.ts` if Supabase returns empty or errors.
