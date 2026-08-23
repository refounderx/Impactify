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
Two ways to apply schema/seed changes:

**Via Supabase CLI (connected 2026-08-23):**
```bash
npx supabase login          # one-time, opens a browser
npx supabase link --project-ref <your-project-ref>
npx supabase db push        # applies supabase/migrations/*.sql to the linked project
```
New schema/seed changes should be added as a new timestamped file under `supabase/migrations/` going forward (not appended to `schema.sql`/`seed.sql` — see `PROJECT_CONTEXT.md`/`DECISIONS.md` for the still-open question of whether the historical `schema.sql`/`seed.sql` files get retired in favor of `migrations/`).

**Manual fallback (Dashboard → SQL Editor → paste and run):**
1. `supabase/schema.sql` — creates all tables, RLS policies, triggers
2. `supabase/seed.sql` — populates with demo data (6 campaigns, 5 orgs, etc.)

### 4. Start dev server
```bash
npm run dev   # http://localhost:3000
```

Pages fall back to mock data if Supabase is unreachable or tables are empty.

## Route Map

| Route | Screen |
|---|---|
| `/` | Marketing landing page (changed 2026-08-23, was donor home) |
| `/landing` | Same content as `/` (duplicate route) |
| `/search` | Campaign search & filters |
| `/campaign/[id]` | Campaign detail |
| `/donate/[id]/amount` | Donation amount selection |
| `/donate/[id]/payment` | Payment form (mock) |
| `/donate/[id]/thanks` | Thank you / confirmation |
| `/nonprofit` | Org dashboard |
| `/nonprofit/create-campaign` | 6-step campaign creation wizard |
| `/community` | Community manager dashboard |
| `/profile` | Donor profile & history |
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
