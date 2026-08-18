# Interfaces & Contracts — Impactify

## Environment Variables

| Variable | Scope | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Yes | Supabase project URL (`https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Yes | Anon key — safe for browser, RLS-filtered |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Seeding/admin | Bypasses RLS — **never expose to client** |

All three go in `.env.local` (gitignored). Prefix `NEXT_PUBLIC_` vars are bundled into client JS.

## Supabase Client Modules

| File | Client type | Use in |
|---|---|---|
| `src/lib/supabase/client.ts` | `createBrowserClient` | Client components (`"use client"`) |
| `src/lib/supabase/server.ts` | `createServerClient` | Server components, API routes |
| `src/lib/supabase/admin.ts` | Service role | Server-only seeding / admin ops |

## API Routes

### `POST /api/donations`
Server-side donation write. Validates inputs at trust boundary.

**Request body:**
```json
{ "campaign_id": "uuid", "org_id": "uuid", "amount": 100, "is_recurring": false, "dedication_name": null }
```

**Response:**
```json
{ "donation": { "id": "uuid", "receipt_id": "R-2026-XXXXXX", ... } }
```

**Security:**
- Reads session from cookies via Supabase SSR — never trusts client-sent `donor_id`
- Validates: `amount > 0`, `amount < 1,000,000`, `campaign_id` and `org_id` present
- `donor_id` is `null` for anonymous donations (allowed by schema)
- Creates `recurring_donations` row only when `is_recurring=true` AND user is authenticated

## Auth Routes

| Route | Purpose |
|---|---|
| `/auth` | Email entry (step 1) + OTP verification (step 2) — single page |
| `/auth/setup` | Name + role selection after first successful login |

**Auth mechanism:** Supabase email OTP (`signInWithOtp` + `verifyOtp`). JWT stored in HttpOnly cookies. SMS not required — Supabase sends code via its built-in email service.

## Data Fetching API (`src/lib/supabase/queries.ts`)

All functions fall back to `mock-data.ts` on error or empty result.

| Function | Auth required | Returns | Tables |
|---|---|---|---|
| `getCampaigns(category?)` | No | `Campaign[]` | `campaigns`, `organizations`, `campaign_products` |
| `getCampaignById(id)` | No | `Campaign \| null` | same |
| `searchCampaigns(q, category?)` | No | `Campaign[]` | same |
| `getOrganizations()` | No | `Organization[]` | `organizations` |
| `getProductsByIds(ids[])` | No | `Product[]` | `products` |
| `getNpDashboardData()` | No (demo: first org) | `{ org, campaigns }` | `organizations`, `campaigns` |
| `getCommunityDashboardData()` | No (demo: top community) | community stats + leaderboard | `communities` |
| `getMyDonations(userId)` | Yes | donation rows | `donations`, `campaigns`, `organizations` |
| `getMyRecurring(userId)` | Yes | recurring rows | `recurring_donations`, `campaigns`, `organizations` |
| `updateRecurringStatus(id, status)` | Yes (RLS) | `boolean` | `recurring_donations` |
| `cancelRecurring(id)` | Yes (RLS) | `boolean` | `recurring_donations` |

## Database Table Contracts

Key columns only — see `supabase/schema.sql` for full definitions.

### `campaigns`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → organizations |
| `status` | enum | `draft\|active\|paused\|completed\|archived\|blocked` |
| `raised` | numeric | Auto-incremented by trigger on donation insert |
| `donors_count` | integer | Auto-incremented by trigger |

### `donations` (append-only)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `donor_id` | uuid | FK → auth.users (nullable for anonymous) |
| `amount` | numeric | Positive, ILS |
| `psp_token` | text | PSP reference — never store card numbers |
| `last_four` | text | Display only |

**Immutability:** DB rules block UPDATE and DELETE on this table.

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK = auth.users.id |
| `app_role` | enum | `donor\|org_admin\|org_member\|community_manager` |
| `org_id` | uuid | Nullable — set for org members |
| `community_id` | uuid | Nullable — set for community managers |

Auto-created by trigger on `auth.users` insert.

## SQL Files

| File | Purpose | When to run |
|---|---|---|
| `supabase/schema.sql` | Creates all tables, enums, RLS policies, triggers, indexes | Once on new project |
| `supabase/seed.sql` | Inserts demo data (orgs, campaigns, products, communities) | After schema, on fresh DB |
