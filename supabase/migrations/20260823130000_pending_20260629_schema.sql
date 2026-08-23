-- ── Migration 2026-06-29: my-donations screen support ────────

-- Add product-level and payment-type tracking to donations
alter table public.donations
  add column if not exists product_id    uuid references public.products(id) on delete set null,
  add column if not exists donation_type text,     -- e.g. הו"ק / חד"פ / חד3/6
  add column if not exists quantity      integer not null default 1 check (quantity > 0);

create index if not exists idx_donations_product on public.donations(product_id);

-- Campaign update posts (news/media updates sent to donors)
create table if not exists public.campaign_updates (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references public.campaigns(id) on delete cascade,
  org_id         uuid not null references public.organizations(id),
  description    text not null,
  description_en text,
  has_video      boolean not null default false,
  gradient       text not null default 'from-gray-700 to-gray-900',
  created_at     timestamptz default now() not null
);

alter table public.campaign_updates enable row level security;
create policy "campaign_updates_public_read" on public.campaign_updates
  for select using (true);

create index if not exists idx_campaign_updates_campaign
  on public.campaign_updates(campaign_id);
create index if not exists idx_campaign_updates_created
  on public.campaign_updates(created_at desc);
