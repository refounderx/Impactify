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

Query errors and empty results are returned to callers; active runtime paths do not fall back to local fixture arrays.

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
| `getSiteDatasets()` | No | typed landing/admin/demo dataset bundle | `site_datasets` |

### `site_datasets`

Four public-read-only rows keyed by `shared`, `landing`, `nonprofit_admin`, and `community_admin`. Each row stores a JSON `value` and `updated_at`. The client loads all four as a single typed bundle through `SiteDataProvider`; a missing row is an error, not a local fallback.

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
| `id_number` | text | Nullable — donor ID number, editable via `/my-donations` profile view |

Auto-created by trigger on `auth.users` insert. `full_name`, `phone`, `id_number` are donor-editable (`profiles_own_update` RLS policy); `email` is not (tied to auth).

### `payment_methods`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `donor_id` | uuid | FK → auth.users |
| `brand` | text | e.g. `Visa`, `Mastercard` |
| `last_four` | text | Display only — **no raw card number is ever stored** |
| `psp_token` | text | Nullable — reserved for real PSP tokenization once a provider is chosen (see Phase 4 — Payments in `TASKS.md`); currently unused |

RLS: donor can only read/insert/delete their own rows.

### `system_updates`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `donor_id` | uuid | Nullable — `null` = broadcast to all donors |
| `org_id` | uuid | FK → organizations |
| `title` / `title_en` | text | |
| `detail` / `detail_en` | text | Nullable — expandable detail text |
| `status` | text | `info \| pending \| action_required` |
| `action_label` / `action_label_en` | text | Nullable |

RLS: readable when `donor_id = auth.uid()` or `donor_id is null`. Surfaced in the "עדכוני מערכת" tab of `/my-donations` (updates view). The nonprofit-admin authoring flow that writes into this table is not yet built.

### `hero_cards`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `image_url` | text | Nullable — null shows the app's color-block placeholder instead. As of 2026-08-23 all 3 rows have real photos hosted in the `hero-images` Supabase Storage bucket (public), URL form `{SUPABASE_URL}/storage/v1/object/public/hero-images/<filename>` |
| `bubble_text` / `bubble_text_en` | text | `bubble_text` required, `bubble_text_en` nullable |
| `display_order` | int | Determines card position on landing hero |

RLS: public read. Consumed by `getHeroCards()` in `src/lib/supabase/queries-landing.ts` for the 3 image+caption pairs in the landing page hero (`Hero.tsx`); falls back to `heroCards` mock data in `mock-data.ts` if the table doesn't exist yet or is empty. Image+bubble are stored as one row (a unit), not separate image/text lists, so a future admin screen can edit or reorder a pair together.

**`hero-images` Storage bucket** (public, created via `supabase/migrations/20260823140000_hero_images_storage.sql`): holds the 3 real hero photos (`soldier.jpeg`, `elderly.jpeg`, `family.jpeg`), uploaded via `supabase storage cp --experimental --linked`. RLS policy `hero_images_public_read` on `storage.objects` allows public `select` for this bucket only.

### `site_content`
| Column | Type | Notes |
|---|---|---|
| `key` | text | PK — matches a key in `src/lib/translations.ts` (e.g. `"landing.hero.title"`) |
| `text_he` / `text_en` | text | Nullable — a row overrides the static `translations.ts` value for that key at runtime |
| `updated_at` | timestamptz | |

RLS: public read **and public write** (no real admin auth exists in this app yet — see `TASKS.md` note to lock this down before production). Read via `getSiteContentOverrides()`, written via `upsertSiteContent(key, he, en)`, both in `src/lib/supabase/queries-content.ts`. `LanguageContext`'s `t()` checks this override map before falling back to `translations.ts`. `EditableText` (`src/components/admin/EditableText.tsx`) wraps a single `t(tKey)` call with a pencil-icon inline editor, gated by `AdminModeContext` (`src/contexts/AdminModeContext.tsx`, a localStorage-persisted boolean toggle in `DemoBar` — no route, no real permission check).

**Operable, partial rollout:** `AdminModeProvider` is mounted in `layout.tsx`, the toggle is wired into `DemoBar`, and `Hero.tsx`/`WhyJoinSection.tsx` are converted to `EditableText` — edits there save live and are verified working. Most of the site's ~270 other `t()` call sites are not yet converted. See `TASKS.md`.

## SQL Files

| File | Purpose | When to run |
|---|---|---|
| `supabase/schema.sql` | Creates all tables, enums, RLS policies, triggers, indexes | Once on new project |
| `supabase/seed.sql` | Inserts demo data (orgs, campaigns, products, communities) | After schema, on fresh DB |
