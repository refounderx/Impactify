# Impactify

Bilingual (Hebrew/English) Israeli-market charitable donation platform. Connects donors, non-profits, and community managers. Hebrew RTL ↔ English LTR.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database + Auth | Supabase (PostgreSQL + RLS + Auth) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Icons | lucide-react |
| Fonts | Heebo · Assistant · Roboto (Google Fonts) |

## Quick Start

### 1. Install dependencies
```bash
cd donation-platform
npm install
```

### 2. Configure Supabase
Copy `.env.local` and fill in your values (Settings → API in Supabase dashboard):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-only, never commit
```

### 3. Run the database schema
New schema/seed changes should be added as a new timestamped file under `supabase/migrations/` going forward (not appended to `schema.sql`/`seed.sql` — see `PROJECT_CONTEXT.md`/`DECISIONS.md` for the still-open question of whether the historical `schema.sql`/`seed.sql` files get retired in favor of `migrations/`).

**Required deployment path (Dashboard → SQL Editor):**

- For initial setup, run `supabase/schema.sql`, followed by `supabase/seed.sql` for demo data.
- Do not retry the Supabase CLI for migration deployment; this project consistently hits the same temporary database `login role` failure. Run the exact timestamped migration in a transaction through the already-authenticated SQL Editor.
- Record its version/name in `supabase_migrations.schema_migrations` in the same transaction when the migration does not already do so.
- Run a separate read-only verification query afterward. Confirm the ledger entry and changed objects, plus grants, fixed `search_path`, and tenant checks for privileged functions. Do not treat the migration as live until these checks pass.
- Apply both partnership-queue migrations before deploying the accompanying application code: `supabase/migrations/20260902100000_bidirectional_partnership_queue.sql` and `supabase/migrations/20260902101500_fix_partnership_queue_slot_assignment.sql`.
- For product-media content, apply `supabase/migrations/20260903110000_product_images.sql` and `supabase/migrations/20260903111500_product_discovery_media.sql`; then run `supabase/scripts/create-impact-products.sql` to create the three demonstration organizations, products, campaigns, and product links.
- Before deploying the NGO/community sign-up color picker, apply `supabase/migrations/20260904100000_add_tenant_brand_colors.sql`.

See `AGENTS.md` for the required agent workflow and security constraints.

### 4. Start dev server
```bash
npm run dev   # http://localhost:3000
```

In Supabase Authentication → URL Configuration, set the production Site URL and allow both callback URLs:

- `https://impactify-sable.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback`

Runtime data queries Supabase directly; missing data or query failures surface explicit states rather than local mock fallbacks.

## Route Map

| Route | Screen |
|---|---|
| `/` | Marketing landing page (changed 2026-08-23, was donor home) |
| `/landing` | Same content as `/` (duplicate route) |
| `/search` | Campaign search & filters |
| `/campaign/[id]` | Campaign detail |
| `/product/[id]?campaign_id=…` | Product detail, nonprofit/campaign context, and donation entry point |
| `/donate/[id]/amount` | Donation amount selection |
| `/donate/[id]/payment` | Payment form (mock) |
| `/donate/[id]/thanks` | Thank you / confirmation |
| `/nonprofit` | Org dashboard |
| `/nonprofit/onboarding` | Guided NGO setup: account readiness, payment terminal, first product, then campaign/community setup |
| `/nonprofit/create-campaign` | 6-step campaign creation wizard |
| `/community/onboarding` | Guided community setup: campaign discovery, a real join request, NGO approval, then dashboard handoff |
| `/community` | Community manager dashboard |
| `/community/updates` | Community partnership inbox, FIFO backlog, and in-app daily digests |
| `/profile` | Donor profile inside the donor side panel |
| `/nonprofit/profile` | NGO organization profile inside the NGO admin shell |
| `/community/profile` | Community-owner profile inside the community admin shell |
| `/admin/profile` | Platform-admin profile inside the admin profile shell |
| `/recurring` | Standing orders (הוראות קבע) |

## Demo Mode

Every screen has a **demo bar** (top) for switching roles + language:
- **תורם / Donor** → `/`
- **עמותה / Org** → `/nonprofit`
- **מנהל קהילה / Community** → `/community`
- **עב / EN** toggle — switches full RTL/LTR + all translations

## Key Docs

- [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) — product scope, user types, build status
- [ARCHITECTURE.md](./ARCHITECTURE.md) — system architecture, Supabase schema, data flow
- [INTERFACES.md](./INTERFACES.md) — env vars, table contracts, API boundaries
- [DECISIONS.md](./DECISIONS.md) — key technical decisions and rationale
- [TASKS.md](./TASKS.md) — remaining work and known gaps
