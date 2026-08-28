# Architecture — Impactify

## System Overview

```
Browser
  └── Next.js 16 (App Router)  [local / Vercel]
        ├── proxy.ts               → refreshes session + coarse protected-route redirects
        ├── Client components      → Supabase JS client (anon key, RLS-filtered)
        ├── AuthContext            → tracks authenticated user + persisted profile
        ├── /api/donations         → server route: validates + writes donations to DB
        └── Server components      → Supabase SSR client (cookie-based session)
              └── Admin client     → service role for validated server donation writes, never in browser
                    ├── PostgreSQL (Supabase) [Frankfurt eu-central-1]
                          ├── Row Level Security on every table
                          └── Triggers: auto-create profile, update campaign stats
                    └── Supabase Storage
                          ├── hero-images: public landing hero photography
                          └── landing-media: public landing-page MP4 video
```

## Auth Flow

```
/auth page
  Step 1: email entry → supabase.auth.signInWithOtp({ email }) → magic-link email
  Step 2: callback    → exchanges code for a cookie-backed session
  Step 3: incomplete  → /auth/setup calls one atomic donor/NGO/community onboarding RPC; NGO signup validates and stores 1–10 goals
  Step 4: returning   → callback redirects directly to the persisted role's home
```

**Session lifecycle:**
- `proxy.ts` refreshes sessions and redirects unauthenticated protected requests
- Server layouts enforce exact `ngo_owner`, `community_owner`, and `admin` roles
- Ordinary users cannot write `app_role`, `org_id`, or `community_id`; admins use an audited RPC
- JWT stored in cookies (HttpOnly via Supabase SSR) — XSS safe
- `AuthContext` subscribes to `onAuthStateChange` for real-time session sync in client components
- Sign-out: `supabase.auth.signOut()` clears cookies

## Data Flow

**Public pages and shared presentation data:**
```
page/component → query module or SiteDataProvider → Supabase anon client
  → PostgreSQL (RLS: public read policy) → data or explicit error/empty state
```

Normalized campaigns, organizations, products, communities, donations, and profile fields use dedicated tables. Only shared and landing presentation records remain in `site_datasets`; authenticated admin dashboards query their normalized tenant data. Source fixture modules remain migration inputs/type sources and are not runtime fallbacks.

Binary media is kept out of the application bundle and served from narrowly scoped public Supabase Storage buckets. `VideoSection.tsx` builds the landing-video URL from `NEXT_PUBLIC_SUPABASE_URL`; the `landing-media` bucket restricts uploads to MP4 files no larger than 25 MB. Campaign header images use the separate `campaign-media` bucket, where authenticated NGO owners can write only beneath their own `org_id` folder. Campaign video URLs stay in the `campaigns` row and are rendered only as validated HTTPS YouTube/Vimeo embeds or direct video sources.

**Authenticated reads (profile, recurring):**
```
page.tsx → useAuth() → user.id
  → queries-donations.ts → Supabase anon client
  → PostgreSQL (RLS: donor_id = auth.uid()) → only user's own data
```

**Donation write (trust boundary):**
```
payment/page.tsx → POST /api/donations (client fetch)
  → api/donations/route.ts → session lookup + active campaign/org validation
  → supabase.auth.getUser() → validates session server-side
  → server-only admin client inserts with donor_id derived from the session
  → trigger auto-increments campaigns.raised + donors_count
  → if is_recurring + user signed in: recurring_donations.insert()
```

## Module Structure

```
src/
├── app/                    Next.js pages (all client components currently)
├── components/
│   ├── layout/             DemoBar, TopNav, BottomNav, Header
│   ├── campaign/           Campaign cards/tabs, centered donation modal, story editor/renderer, media step
│   ├── nonprofit-admin/    AdminShell (sidebar+topbar; `variant: "nonprofit" | "community"` picks nav
│   │                       routes/labels and whether the Products group renders), DonutChart, StatHeader,
│   │                       SearchFilterBar, CampaignDetailPanel, ProductDetailPanel (row-expansion detail views)
│   ├── community/          CampaignSourceTabs (created/linked toggle), CommunityCampaignsTable —
│   │                       used only by the /community/* admin route tree
│   └── ui/                 ProgressBar
├── contexts/
│   ├── LanguageContext.tsx  HE/EN toggle, t() function, dir switching
│   ├── AuthContext.tsx      Session/profile state + refreshProfile
│   ├── NgoAdminDataContext.tsx       Authenticated NGO tenant data
│   ├── CommunityAdminDataContext.tsx Authenticated community tenant data
│   └── SiteDataContext.tsx  Loads shared presentation datasets from Supabase
├── lib/
│   ├── mock-data.ts              Fixture source + UI types; migration input, not runtime fallback
│   ├── nonprofit-admin-data.ts   Historical migration/type input; not a runtime data source
│   ├── community-admin-data.ts   Historical migration/type input; not a runtime data source
│   ├── site-dataset-types.ts     Typed contract for shared/landing dataset rows
│   ├── campaign-media.ts          Campaign image upload + safe video URL/source helpers
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
│       ├── queries-site-data.ts  Reads required shared/landing `site_datasets` rows
│       ├── queries-ngo-admin.ts  Reads the authenticated NGO tenant
│       ├── queries-community-admin.ts Reads the authenticated community tenant
│       ├── queries-account-admin.ts Admin user/tenant directory
│       └── queries-donations.ts  getMyDonations, getMyRecurring, updateRecurringStatus, cancelRecurring
├── app/
│   ├── api/donations/route.ts    POST — server-side donation write (validates, inserts, creates recurring)
│   ├── auth/page.tsx             Email + OTP 2-step auth screen
│   ├── auth/setup/page.tsx       Name + role selection after first login
│   ├── nonprofit/(admin)/        Route group (see note below)
│   └── community/                Admin route tree (see note below) — layout.tsx wraps children in
│                                  <AdminShell variant="community">, no route group needed (no
│                                  sibling non-admin /community pages exist)
├── proxy.ts                      Session refresh and coarse route protection
└── supabase/
    ├── schema.sql           Full DB schema + RLS policies + triggers
    └── seed.sql             Demo data INSERT statements
```

**`nonprofit/(admin)/` route group:** all pages inside share `AdminShell` (teal sidebar + top bar) via `nonprofit/(admin)/layout.tsx` — campaigns dashboard at `/nonprofit` (table) + grid at `/nonprofit/campaigns`, products dashboard with a centered creation modal at `/nonprofit/products/dashboard` (table) + grid at `/nonprofit/products`, plus `/nonprofit/donations`, `/nonprofit/updates`, `/nonprofit/communities` (stub). Product creation calls a security-definer RPC that derives `org_id` from the authenticated NGO-owner profile. The sibling `nonprofit/[id]/page.tsx` (public org profile) and `nonprofit/create-campaign/page.tsx` (creation/editing wizard) live outside the group so they render without the admin sidebar. Next.js resolves static segments (`campaigns`, `products`, …) before the `[id]` dynamic segment, so there's no routing collision.

**Root route `/` (changed 2026-08-23):** `app/page.tsx` now renders the marketing landing page (same content as `app/landing/page.tsx` — duplicated for now, not deduplicated). The previous donor-home screen (teal header, featured campaign, active-campaigns grid) was moved to `app/_archive/old-home/page.tsx`, a Next.js private folder (`_` prefix excludes it from routing) — code preserved, not deleted, pending a decision on where donor-home should live going forward. Several other pages still link/redirect to `/` expecting the old donor-home behavior (`my-donations`, `auth`, `nonprofit/[id]`, `campaign/[id]`, `TopNav.tsx`, `recurring`, `donate/[id]/thanks`) — not yet updated; see `TASKS.md`.

**`community/` admin tree (added 2026-08-11):** mirrors the `nonprofit/(admin)/` pattern one level down. Its layout requires `community_owner`, and its data provider derives `community_id` from the signed-in profile before making RLS-filtered normalized queries. Request-to-join and updates remain UI-only where no normalized persistence contract exists.

## Database Schema

| Table | Purpose | RLS |
|---|---|---|
| `profiles` | Extends `auth.users` — role, tenant, onboarding | Own row; admins read directory; personal-column updates only |
| `admin_role_audit` | Immutable role/tenant-change record | Admin read; only privileged RPC inserts |
| `admin_user_deletion_audit` | Non-PII record of privileged account deletions | Admin read; only privileged RPC inserts |
| `organizations` | Non-profit orgs, including structured bilingual `goals` | Public read; goal writes only through an owner-scoped RPC |
| `campaigns` | Fundraising campaigns | Public read (active); org members read all |
| `products` | Charitable items (ארוחה חמה etc.) | Public read |
| `campaign_products` | Campaign ↔ Product junction | Public read |
| `donations` | Immutable financial ledger; FK deletion anonymizes donor/product references | Own donations; org reads received |
| `recurring_donations` | Standing orders (הוראות קבע) | Own only |
| `communities` | Community groups | Public read |
| `payment_methods` | Saved brand + last-4 (no raw card data) | Own only |
| `system_updates` | Broadcast/per-donor update feed | Own or broadcast (`donor_id is null`) |
| `hero_cards` | Landing hero image+caption pairs | Public read |
| `site_content` | Admin text-override table (key → he/en) | Public read; authenticated admin writes |
| `site_datasets` | Shared/landing JSON presentation records | Public read; no public writes |

**Key constraints:**
- `donations` is **append-only** — a trigger rejects ordinary UPDATEs while allowing only FK-managed `donor_id`/`product_id` UUID-to-null anonymization; a DB rule prevents DELETE
- Insert trigger auto-increments `campaigns.raised` and `campaigns.donors_count`
- Insert trigger auto-creates `profiles` row when user signs up

## RLS Security Model

```
Public (anon)   → active campaigns/products, communities, public org fields, shared datasets
Donor           → own profile/donations/recurring; cannot change role or tenant
NGO owner       → own NGO campaigns/products/received donations; tenant-derived product creation; atomic campaign publish/update; own-folder image uploads
Community owner → own community and community-attributed donations
Admin           → profile directory, audited role/tenant changes, guarded account deletion, site-content writes
```

## Language Architecture

- `LanguageContext.tsx` stores `lang: "he" | "en"` in React context + localStorage
- On switch: `document.documentElement.dir` flips (`rtl` ↔ `ltr`), `lang` attribute updates
- `t(key)` function resolves from `translations.ts`
- Supabase entities and site datasets have parallel `*En` fields; queries return both
- Card numbers, bank details, emails: always `dir="ltr"` regardless of page direction

## Current State

| Page | Data source |
|---|---|
| `/` Home | Supabase (`campaigns` + `organizations`) |
| `/search` | Supabase — real-time search with 300ms debounce |
| `/campaign/[id]` | Supabase normalized tables plus shared donor/community presentation records from `site_datasets` |
| `/donate/[id]/amount` | Supabase campaign lookup |
| `/nonprofit` and `/nonprofit/*` admin pages | Authenticated NGO tenant queries over normalized Supabase tables |
| `/nonprofit/[id]` | Supabase organizations and campaigns; extended profile fields and goals are normalized organization columns |
| `/community` and `/community/*` admin pages | Authenticated community tenant queries over normalized Supabase tables |
| `/admin/users` | Admin-only Supabase profile/tenant directory plus role-change and account-deletion RPCs |
| `/profile` | Auth-scoped Supabase reads; NGO owners can update only their assigned organization's goals through a guarded RPC; logged-out demo presentation data comes from `site_datasets` |
| `/recurring` | Auth-scoped Supabase reads; no local fallback |

No active page silently falls back to local fixture arrays. The fixture files are migration inputs and shared type sources only.
