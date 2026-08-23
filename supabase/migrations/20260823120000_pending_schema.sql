-- ── Migration 2026-08-18: donor profile details + payment methods + system updates ──

alter table public.profiles
  add column if not exists id_number text;

-- Payment methods: brand + last 4 digits only. No raw card number is ever
-- stored — real tokenized storage depends on the PSP choice, still open
-- (Tranzilla / Cardcom / PayMe).
create table if not exists public.payment_methods (
  id         uuid primary key default gen_random_uuid(),
  donor_id   uuid references auth.users(id) on delete cascade,
  brand      text not null,
  last_four  text not null,
  psp_token  text,
  created_at timestamptz default now() not null
);

alter table public.payment_methods enable row level security;

create policy "payment_methods_own_read" on public.payment_methods
  for select using (donor_id = auth.uid());
create policy "payment_methods_own_insert" on public.payment_methods
  for insert with check (donor_id = auth.uid());
create policy "payment_methods_own_delete" on public.payment_methods
  for delete using (donor_id = auth.uid());

create index if not exists idx_payment_methods_donor on public.payment_methods(donor_id);

-- System-originated updates surfaced in the donor's "עדכוני מערכת" tab.
-- donor_id null = broadcast to all donors. The nonprofit-admin authoring
-- wizard that writes into this table is separate, not-yet-built work.
create table if not exists public.system_updates (
  id               uuid primary key default gen_random_uuid(),
  donor_id         uuid references auth.users(id) on delete cascade,
  org_id           uuid references public.organizations(id),
  title            text not null,
  title_en         text,
  detail           text,
  detail_en        text,
  status           text not null default 'info', -- 'info' | 'pending' | 'action_required'
  action_label     text,
  action_label_en  text,
  created_at       timestamptz default now() not null
);

alter table public.system_updates enable row level security;

create policy "system_updates_own_read" on public.system_updates
  for select using (donor_id = auth.uid() or donor_id is null);

create index if not exists idx_system_updates_donor on public.system_updates(donor_id);
create index if not exists idx_system_updates_created on public.system_updates(created_at desc);

-- ── Migration 2026-08-23: landing hero image+bubble cards ──────
-- Each row pairs one image with one caption bubble as a single unit (not
-- separate image/text lists), so a future admin screen can edit or reorder
-- a pair together. image_url is nullable — leave it null to keep the
-- app's placeholder color block until a real image is uploaded.
create table if not exists public.hero_cards (
  id             uuid primary key default gen_random_uuid(),
  image_url      text,
  bubble_text    text not null,
  bubble_text_en text,
  display_order  int not null default 0,
  created_at     timestamptz default now() not null
);

alter table public.hero_cards enable row level security;

create policy "hero_cards_public_read" on public.hero_cards
  for select using (true);

create index if not exists idx_hero_cards_order on public.hero_cards(display_order);

-- ── Migration 2026-08-23: site content overrides (admin-editable static text) ──
-- Keyed by the same string keys used in src/lib/translations.ts (e.g.
-- "landing.hero.title"). A row here overrides the static translations.ts
-- value for that key at runtime; no row = falls back to translations.ts.
-- No real admin auth exists yet in this app (see DemoBar role switcher) —
-- write access is intentionally open for now, same trust level as the rest
-- of this demo's unauthenticated write paths. Must be locked down to a real
-- admin role before production (tracked in TASKS.md).
create table if not exists public.site_content (
  key        text primary key,
  text_he    text,
  text_en    text,
  updated_at timestamptz default now() not null
);

alter table public.site_content enable row level security;

create policy "site_content_public_read" on public.site_content
  for select using (true);
create policy "site_content_public_write" on public.site_content
  for insert with check (true);
create policy "site_content_public_update" on public.site_content
  for update using (true);
