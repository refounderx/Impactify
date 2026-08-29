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
- Validates: `amount > 0`, `amount < 1,000,000`, UUIDs, active campaign, and campaign→organization ownership
- `donor_id` is `null` for anonymous donations (allowed by schema)
- Creates `recurring_donations` row only when `is_recurring=true` AND user is authenticated

## Auth Routes

| Route | Purpose |
|---|---|
| `/auth` | Email entry (step 1) + OTP verification (step 2) — single page |
| `/auth/setup` | One-time donor/NGO-owner/community-owner onboarding; admin is never self-selectable |
| `/admin/users` | Admin-only user role, tenant-assignment, and permanent account deletion management |

**Auth mechanism:** Supabase email magic link. `/auth` sends `emailRedirectTo` as the current origin plus `/auth/callback`, so local and production sign-ins return to the site that initiated them. Supabase's redirect allowlist must contain `http://localhost:3000/auth/callback` and `https://impactify-sable.vercel.app/auth/callback`; its production Site URL is `https://impactify-sable.vercel.app`. The callback routes incomplete profiles to setup and returning users to the dashboard for their persisted role. `proxy.ts` refreshes sessions and performs coarse route protection; server layouts enforce the exact role. In the browser, `AuthContext` restores the persisted session before network validation, keeps it during transient validation errors, reacts to Supabase auth events, and reconciles on network recovery or tab focus. The UI shows a global notice for offline state, temporary verification failure, or a confirmed ended session; only the last state offers re-authentication.

### Auth and campaign RPCs

| Function | Caller | Contract |
|---|---|---|
| `complete_donor_signup(full_name)` | Authenticated, incomplete user | Completes onboarding as donor |
| `complete_ngo_signup(full_name, org_name, org_name_en, goals)` | Authenticated, incomplete user | Validates 1–10 bilingual goals, atomically creates an NGO, and assigns its owner |
| `complete_community_signup(full_name, community_name, community_name_en?)` | Authenticated, incomplete user | Atomically creates a community and assigns its owner |
| `admin_update_profile_role(profile_id, role, org_id?, community_id?)` | Admin only | Changes role/tenant, blocks self-change and last-admin demotion, writes an audit row |
| `admin_delete_user(user_id)` | Admin only | Deletes another `auth.users` account, blocks self-deletion and last-admin deletion, anonymizes retained donation rows through FK `SET NULL`, and writes a non-PII audit row |
| `create_ngo_product(name, name_en, description, description_en, price, emoji)` | NGO owner only | Validates product fields and creates an active product for the organization derived from `auth.uid()` |
| `update_ngo_product(product_id, name, name_en, description, description_en, price, emoji, active)` | NGO owner only | Derives the tenant from auth, validates all product fields, and updates only a product owned by that organization |
| `update_ngo_goals(goals)` | NGO owner only | Validates 1–10 goals and updates the organization derived from `auth.uid()`; no client-supplied organization ID is trusted |
| `publish_campaign(title, short_desc, story, category, goal, end_date, product_ids?, hero_image_url?, video_url?)` | NGO owner only | Validates tenant products and HTTPS media URLs, then atomically publishes a campaign |
| `update_campaign(campaign_id, title, short_desc, story, category, goal, end_date, product_ids?, hero_image_url?, video_url?)` | NGO owner only | Derives the tenant from auth, verifies campaign/product ownership and HTTPS media, then atomically updates the campaign and product links |

## Data Fetching API (`src/lib/supabase/queries.ts`)

Query errors and empty results are returned to callers; active runtime paths do not fall back to local fixture arrays.

| Function | Auth required | Returns | Tables |
|---|---|---|---|
| `getCampaigns(category?)` | No | `Campaign[]` | `campaigns`, `organizations`, `campaign_products` |
| `getCampaignById(id)` | No | `Campaign \| null` | same |
| `searchCampaigns(q, category?)` | No | `Campaign[]` | same |
| `getOrganizations()` | No | `Organization[]` | `organizations` |
| `getProductsByIds(ids[])` | No | `Product[]` | `products` |
| `getNgoAdminData()` | NGO owner | Own tenant's campaigns, products, donations, communities | normalized tenant tables |
| `getCommunityAdminData()` | Community owner | Own community and attributed campaigns/donations | normalized tenant tables |
| `getMyDonations(userId)` | Yes | donation rows | `donations`, `campaigns`, `organizations` |
| `getMyRecurring(userId)` | Yes | recurring rows | `recurring_donations`, `campaigns`, `organizations` |
| `updateRecurringStatus(id, status)` | Yes (RLS) | `boolean` | `recurring_donations` |
| `cancelRecurring(id)` | Yes (RLS) | `boolean` | `recurring_donations` |
| `getSiteDatasets()` | No | typed shared/landing presentation bundle | `site_datasets` |

### `site_datasets`

Two runtime public-read-only rows keyed by `shared` and `landing`. The historical admin snapshot rows are deleted by the auth migration because admin screens now query tenant tables directly. A missing required row is an error, not a local fallback.

## Database Table Contracts

Key columns only — see `supabase/schema.sql` for full definitions.

### `organizations`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` / `name_en` | text | Hebrew name required; English nullable |
| `goals` | jsonb | Array of 1–10 `{ he, en }` objects for new NGOs; legacy rows default to `[]` until their owner updates the profile |

Public reads include `goals` but continue to exclude bank-account columns. Writes to `goals` are available only through `update_ngo_goals`, which resolves the target organization from the authenticated NGO-owner profile.

### `campaigns`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → organizations |
| `status` | enum | `draft\|active\|paused\|completed\|archived\|blocked` |
| `raised` | numeric | Auto-incremented by trigger on donation insert |
| `donors_count` | integer | Auto-incremented by trigger |
| `hero_image_url` | text | Nullable public URL for the uploaded campaign header image |
| `video_url` | text | Nullable HTTPS YouTube, Vimeo, or direct-video URL; displayed ahead of the header image |

### `donations` (append-only)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `donor_id` | uuid | FK → auth.users (nullable for anonymous) |
| `amount` | numeric | Positive, ILS |
| `psp_token` | text | PSP reference — never store card numbers |
| `last_four` | text | Display only |

**Immutability:** A `BEFORE UPDATE` trigger rejects ledger edits but permits foreign-key anonymization that changes only `donor_id` and/or `product_id` from a UUID to `null`. A DB rule blocks DELETE. This lets account/product deletion retain financial history without allowing ordinary donation updates.

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK = auth.users.id |
| `app_role` | enum | `donor\|ngo_owner\|community_owner\|admin` |
| `org_id` | uuid | Required only for `ngo_owner`; FK → organizations |
| `community_id` | uuid | Required only for `community_owner`; FK → communities |
| `onboarding_completed_at` | timestamptz | Null until a one-time onboarding RPC succeeds |
| `id_number` | text | Nullable — donor ID number, editable via `/my-donations` profile view |

Auto-created by trigger on `auth.users` insert. Ordinary users may update personal fields only; role and tenant columns are not granted to them. Admin changes go through audited security-definer RPCs. Deleting an authentication account cascades its profile and account-linked rows; donation-ledger rows remain with `donor_id = null`.

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

**`landing-media` Storage bucket** (public, created via `supabase/migrations/20260823170000_landing_media_storage.sql`): holds media embedded directly on the public landing page. `VideoSection.tsx` expects the donation-impact video at `{SUPABASE_URL}/storage/v1/object/public/landing-media/landing-video.mp4`. The bucket accepts only `video/mp4` objects up to 25 MB; policy `landing_media_public_read` allows public reads for this bucket only. Uploads require a privileged operator/service role and are never permitted by the browser client.

**`campaign-media` Storage bucket** (public, created via `supabase/migrations/20260824120000_campaign_media.sql`): holds campaign header images. It accepts JPG, PNG, and WebP objects up to 5 MB. Public reads support campaign pages; authenticated NGO owners may insert/delete only inside the folder named for their own `org_id`. The wizard uploads the image before calling `publish_campaign` and removes it if publication fails.

### `site_content`
| Column | Type | Notes |
|---|---|---|
| `key` | text | PK — matches a key in `src/lib/translations.ts` (e.g. `"landing.hero.title"`) |
| `text_he` / `text_en` | text | Nullable — a row overrides the static `translations.ts` value for that key at runtime |
| `updated_at` | timestamptz | |

RLS: public read; insert/update require an authenticated `admin` profile. Read via `getSiteContentOverrides()`, written via `upsertSiteContent(key, he, en)`. `AdminModeProvider` independently checks the authenticated profile, clears stale browser edit state for non-admins, and exposes active edit mode only while the role is `admin`. The production `TopNav` renders the edit toggle only for admins; the development `DemoBar` follows the same role check.

**Operable rollout:** `EditableText` wraps the converted rendered text nodes across the site and saves live overrides to `site_content`. Attribute-position strings such as placeholders and ARIA labels remain outside the inline editor; see `TASKS.md`.

## SQL Files

| File | Purpose | When to run |
|---|---|---|
| `supabase/schema.sql` | Creates all tables, enums, RLS policies, triggers, indexes | Once on new project |
| `supabase/seed.sql` | Inserts demo data (orgs, campaigns, products, communities) | After schema, on fresh DB |
