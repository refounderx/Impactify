# Interfaces & Contracts — Impactify

## Environment Variables

| Variable | Scope | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Yes | Supabase project URL (`https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Yes | Anon key — safe for browser, RLS-filtered |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Seeding/admin | Bypasses RLS — **never expose to client** |

All three go in `.env.local` (gitignored). Prefix `NEXT_PUBLIC_` vars are bundled into client JS.

## Browser consent contract

`CookieConsentProvider` persists the visitor's explicit analytics/marketing choices in browser local storage under `impactify-cookie-consent`, together with the policy version and timestamp. Essential authentication, security, language, accessibility, and consent-preference storage remain available. The provider emits the browser event `impactify:cookie-consent` after a choice is saved; any future analytics or advertising integration must load only after checking the relevant preference or responding to this event. No analytics or marketing SDK is currently loaded by the application. YouTube campaign embeds are also withheld until the marketing preference is positive.

## Supabase Client Modules

| File | Client type | Use in |
|---|---|---|
| `src/lib/supabase/client.ts` | `createBrowserClient` | Client components (`"use client"`) |
| `src/lib/supabase/server.ts` | `createServerClient` | Server components, API routes |
| `src/lib/supabase/admin.ts` | Service role | Server-only seeding / admin ops |

## API Routes

### `POST /api/donations`
Development-only payment simulation. Production returns `503` until a Cardcom/Grow server integration can verify a signed payment result; a browser request alone can never create a completed production ledger entry.

**Request body:**
```json
{ "campaign_id": "uuid", "org_id": "uuid", "amount": 100, "is_recurring": false, "dedication_name": null, "product_id": null, "quantity": 1, "simulation": true }
```

**Response:**
```json
{ "donation": { "id": "uuid", "receipt_id": "R-2026-XXXXXX", ... } }
```

**Security:**
- Requires same-origin JSON, enforces a bounded request body, and reads any session through Supabase SSR — never trusts client-sent `donor_id`
- Validates: `amount > 0`, `amount < 1,000,000`, UUIDs, active campaign, and campaign→organization ownership
- When `product_id` is supplied, validates that the active product is linked to the campaign and belongs to its organization; the server records `product.price × quantity` rather than trusting the submitted amount
- In development only, `simulation=true` creates a completed fixture entry with a cryptographically random confirmation reference; production refuses the request
- The live PSP implementation must create completed donations and recurring instructions only after verifying a signed provider callback on the server

### `POST /api/contact`
Stores a public landing-page contact request. The route accepts same-origin JSON only, limits the body size, validates bounded name/email/phone/message fields, then writes with the server-only Supabase admin client. It does not send email; operators read requests through the database until a delivery provider is configured.

### `POST /api/refunds`
Authenticated NGO owners can create an idempotent refund request for a completed donation in their own organization. The route writes a `pending` row to `refund_requests`; it does **not** claim to execute a card refund until a payment-service-provider integration is configured.

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
| `update_ngo_profile(name, description, activity_area, address, phone, ceo, founded, logo_url)` | NGO owner only | Validates editable organization fields and updates the organization derived from `auth.uid()`; no client-supplied organization ID is trusted |
| `publish_campaign(title, short_desc, story, category, goal, end_date, product_ids?, hero_image_url?, video_url?)` | NGO owner only | Validates tenant products and HTTPS media URLs, then atomically publishes a campaign |
| `update_campaign(campaign_id, title, short_desc, story, category, goal, end_date, product_ids?, hero_image_url?, video_url?)` | NGO owner only | Derives the tenant from auth, verifies campaign/product ownership and HTTPS media, then atomically updates the campaign and product links |
| `save_ngo_update(update_id?, audience, target_ids, channels, timing, scheduled_at, trigger_type, title, body, cta, image_name)` | NGO owner only | Persists an update in the NGO tenant; a new immediate Push update also creates donor-facing `system_updates` rows for matching donors |
| `manage_ngo_update(update_id, action)` | NGO owner only | Duplicates, pauses/resumes, or deletes only an update owned by the caller's organization |
| `set_community_campaign(campaign_id, action)` | Community owner only | Creates/cancels a pending join request or pauses/resumes the caller's own active campaign relationship |
| `get_discoverable_products(categories?)` | Anonymous or authenticated | Returns non-demo active campaign products ordered by completed donated units; exposes product/campaign display fields and aggregate count only, never donor or payment data |
| `get_discoverable_products_for_audience(audience)` | Anonymous or authenticated | Returns non-demo active products explicitly linked to one home-page audience, ordered by completed donated units |
| `get_public_impact_stats()` | Anonymous or authenticated | Read-only, platform-wide aggregate counts and completed donation total for the landing page; never returns donation, payment, or donor rows |
| `get_ngo_payment_connections()` | NGO owner only | Returns only the caller's Cardcom/Grow terminal metadata; never returns provider credentials, card data, or payment tokens |
| `start_ngo_payment_connection(provider, terminal_id)` | NGO owner only | Registers or updates the caller's Cardcom/Grow terminal identifier and keeps it in setup-required state until server-side verification is implemented |
| `set_my_recurring_donation_status(recurring_id, status)` | Donor only | Changes only the caller's non-cancelled instruction to active, paused, or permanently cancelled |
| `add_my_payment_method(brand, last_four)` | Donor only | Stores validated display metadata only; never accepts PAN, CVV, or a PSP token from the browser |
| `remove_my_payment_method(payment_method_id)` | Donor only | Deletes only a display-metadata row owned by the caller |

## Data Fetching API (`src/lib/supabase/queries.ts`)

Query errors and empty results are returned to callers; active runtime paths do not fall back to local fixture arrays.

| Function | Auth required | Returns | Tables |
|---|---|---|---|
| `getCampaigns(category?)` | No | `Campaign[]` | `campaigns`, `organizations`, `campaign_products` |
| `getCampaignById(id)` | No | `Campaign \| null` | same |
| `searchCampaigns(q, category?)` | No | `Campaign[]` | same |
| `getOrganizations()` | No | `Organization[]` | `organizations` |
| `getProductsByIds(ids[])` | No | `Product[]` | `products` |
| `getDiscoverableProducts(categories?)` | No | Active campaign products ordered by donated quantity | `get_discoverable_products` |
| `getDiscoverableProductsForAudience(audience)` | No | Active products linked to a home-page audience | `get_discoverable_products_for_audience` |
| `getNgoAdminData()` | NGO owner | Own tenant's campaigns, products, donations, communities | normalized tenant tables |
| `getCommunityAdminData()` | Community owner | Own community and attributed campaigns/donations | normalized tenant tables |
| `getMyDonations(userId)` | Yes | donation rows | `donations`, `campaigns`, `organizations` |
| `getMyProductDonations(userId)` | Yes | Product-grouped donor donations, including the latest linked `campaignId` for repeat giving | `donations`, `products`, `campaigns`, `organizations` |
| `getMyTaxDonationRecords(userId)` | Yes | Every completed donor donation with receipt reference, date, amount, and organization for a client-generated tax report | `donations`, `organizations` |
| `getMyRecurring(userId)` | Yes | recurring rows | `recurring_donations`, `campaigns`, `organizations` |
| `updateRecurringStatus(id, status)` | Yes (owner-scoped RPC) | `boolean` | `recurring_donations` |
| `cancelRecurring(id)` | Yes (owner-scoped RPC) | `boolean` | `recurring_donations` |
| `getSiteDatasets()` | No | typed shared/landing presentation bundle | `site_datasets` |
| `getNgoUpdates()` / `saveNgoUpdate()` / `manageNgoUpdate()` | NGO owner | Persistent update rows and tenant-safe mutations | `ngo_updates`, `system_updates` |
| `getCommunityCampaignStatuses()` / `setCommunityCampaign()` | Community owner | Persistent join-request status and participation controls | `community_campaigns` |
| `getPublicImpactStats()` | No | Landing-page aggregate impact metrics plus up to six public organization names | `get_public_impact_stats`, `organizations` |
| `getNgoPaymentConnections()` / `startNgoPaymentConnection()` | NGO owner | Tenant-scoped Cardcom/Grow terminal metadata; no credentials, card data, or tokens | `org_payment_connections` |

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
| `activity_area` | text | Nullable operating region selected in the NGO-owner profile |

Public reads include `goals` and `activity_area` but continue to exclude bank-account columns. Goal writes use `update_ngo_goals`; editable profile fields use `update_ngo_profile`. Both RPCs resolve the target organization from the authenticated NGO-owner profile.

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

### `product_home_audiences`
| Column | Type | Notes |
|---|---|---|
| `product_id` | uuid | FK → `products`; composite primary key with `audience` |
| `audience` | text | One of `elderly`, `soldier`, `teen`, `baby`, or `child` |

Public reads support the home-page audience selectors. An NGO owner may create, change, or remove links only for products in the owner's organization. Education campaign products are initially linked to both `teen` and `child`; future product-to-audience choices are stored here rather than inferred from a campaign category.

### `donations` (append-only)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `donor_id` | uuid | FK → auth.users (nullable for anonymous) |
| `amount` | numeric | Positive, ILS |
| `product_id` / `quantity` | uuid / integer | Optional purchased product and positive unit count; product donations record the server-calculated product price |
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
| `psp_token` | text | Server-only nullable field reserved for a future PSP token; browser roles have no column access |

RLS and grants: donors read only their own non-token display columns and add/remove metadata through owner-derived RPCs. Browser roles cannot insert a PSP token.

### `org_payment_connections`
Each row associates one organization with one configured provider (`cardcom` or `grow`) and its terminal identifier. A setup row is **not** a live processor connection: its `status` remains `setup_required` until a future server-side credential check, hosted checkout/token flow, and verified webhook integration are in place. The table stores neither credentials nor card details nor PSP tokens. Browser roles have no direct table grants; the two authenticated RPCs derive the organization exclusively from `auth.uid()`.

### `contact_messages`
Public contact requests written only through `POST /api/contact`. RLS permits read access only to authenticated administrators; browser clients receive no table write policy.

### `refund_requests`
An immutable donation remains the financial ledger entry. A refund request stores the donation, NGO, requesting owner, pending/processed/rejected status, and time. Browser roles have no direct access; the server route validates the NGO tenant before using its service-role client. A real payment-provider operation is still required to mark an actual settlement refund.

### `profile_special_days`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `profile_id` | uuid | Required FK → `profiles.id`; cascades on account deletion |
| `title` | text | Trimmed display label, 1–120 characters |
| `event_date` | date | Date of the occasion |
| `emoji` | text | Short visual marker; defaults to `🎉` |
| `created_at` | timestamptz | Creation timestamp |

RLS and grants: only `authenticated` receives table privileges, and every select/insert/update/delete policy requires `profile_id = auth.uid()`. The NGO-owner profile at `/nonprofit/profile` currently exposes create, list, and delete operations.

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

RLS: readable when `donor_id = auth.uid()` or `donor_id is null`. Surfaced in the "עדכוני מערכת" tab of `/my-donations` (updates view). Immediate NGO Push updates are written here by the `save_ngo_update` security-definer RPC. Email/SMS delivery still requires a configured provider/worker.

### `ngo_updates`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → organizations; derived from the authenticated NGO owner for writes |
| `audience` / `target_ids` | text / uuid[] | `all`, `campaigns`, or `products`; target ownership is validated by the RPC |
| `channels` / `timing` | text[] / text | Push, email, SMS and `now`, `scheduled`, or `trigger` configuration |
| `title` / `body` | text | Required bounded update content |
| `status` | text | `active`, `paused`, or `sent`; immediate Push sends are marked sent with a recipient count |

RLS: NGO owners can read only their organization's rows. All writes use the tenant-derived `save_ngo_update` and `manage_ngo_update` RPCs.

### `community_campaigns`
| Column | Type | Notes |
|---|---|---|
| `community_id` / `campaign_id` | uuid | Composite PK linking a community to a campaign |
| `status` | text | `pending`, `active`, `paused`, or `rejected`; join requests start as `pending` |
| `source` | text | `linked` or `created` for the community campaigns tabs |

RLS: a community owner can read only its own relationships. Mutations use `set_community_campaign`, which derives the community from `auth.uid()` and never accepts a client-supplied tenant ID. Migration `20260831110000_invite_communities_to_campaign.sql` adds `invite_communities_to_campaign(p_campaign_id, p_community_ids)` for an NGO owner to queue pending invitations after saving one of its own campaigns; the RPC derives the NGO tenant from `auth.uid()`, validates every community ID, and never accepts an organization ID from the browser.

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
| `supabase/migrations/20260830143000_org_payment_connections.sql` | Adds NGO-scoped Cardcom/Grow terminal registry and tenant-derived setup RPCs | Apply through Supabase SQL Editor before enabling the profile connection UI |
| `supabase/migrations/20260830170000_security_hardening.sql` | Removes direct financial/campaign mutations, hides token/referral columns, and adds narrow donor RPCs | Applied through Supabase SQL Editor on 2026-08-30; privilege verification returned `false, false, true, true, false, false` for direct donation insert, direct recurring update, the two approved RPCs, token read, and referral-code read |
