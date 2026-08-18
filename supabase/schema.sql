-- ============================================================
-- Impactify — Full Database Schema
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────
create type app_role as enum ('donor', 'org_admin', 'org_member', 'community_manager');
create type campaign_status as enum ('draft', 'active', 'paused', 'completed', 'archived', 'blocked');
create type donation_status as enum ('pending', 'completed', 'failed', 'refunded');
create type recurring_status as enum ('active', 'paused', 'cancelled');

-- ── Profiles (extends auth.users) ───────────────────────────
create table public.profiles (
  id             uuid references auth.users(id) on delete cascade primary key,
  full_name      text,
  full_name_en   text,
  phone          text,
  email          text,
  avatar_url     text,
  app_role       app_role not null default 'donor',
  org_id         uuid,
  community_id   uuid,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.phone
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Organizations ────────────────────────────────────────────
create table public.organizations (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  name_en             text,
  initials            text,
  color               text not null default '#00B5AD',
  description         text,
  description_en      text,
  logo_url            text,
  registration_number text,        -- מספר עמותה
  verified            boolean not null default false,
  bank_name           text,
  bank_branch         text,
  bank_account        text,        -- stored encrypted in production
  created_at          timestamptz default now() not null
);

-- ── Campaigns ────────────────────────────────────────────────
create table public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  title_en      text,
  short_desc    text,
  short_desc_en text,
  story         text,
  story_en      text,
  org_id        uuid not null references public.organizations(id) on delete cascade,
  category      text not null,
  goal          numeric(12,2) not null check (goal > 0),
  raised        numeric(12,2) not null default 0 check (raised >= 0),
  donors_count  integer not null default 0 check (donors_count >= 0),
  end_date      date,
  status        campaign_status not null default 'active',
  gradient      text not null default 'from-teal-400 to-blue-400',
  emoji         text not null default '💙',
  hero_image_url text,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- ── Products (charitable items) ──────────────────────────────
create table public.products (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id) on delete cascade,
  name           text not null,
  name_en        text,
  description    text,
  description_en text,
  price          numeric(10,2) not null check (price > 0),
  emoji          text,
  active         boolean not null default true,
  created_at     timestamptz default now() not null
);

-- ── Campaign ↔ Product (many-to-many) ───────────────────────
create table public.campaign_products (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  primary key (campaign_id, product_id)
);

-- ── Donations (append-only financial ledger) ─────────────────
create table public.donations (
  id                uuid primary key default gen_random_uuid(),
  donor_id          uuid references auth.users(id) on delete set null,
  campaign_id       uuid not null references public.campaigns(id),
  org_id            uuid not null references public.organizations(id),
  amount            numeric(10,2) not null check (amount > 0),
  currency          text not null default 'ILS',
  status            donation_status not null default 'completed',
  is_recurring      boolean not null default false,
  dedication_name   text,
  dedication_message text,
  community_id      uuid,
  psp_token         text,          -- PSP reference token
  last_four         text,          -- last 4 digits of card
  card_brand        text,
  receipt_id        text unique,
  receipt_url       text,
  created_at        timestamptz default now() not null
  -- No updated_at — donations are immutable
);

-- Prevent any UPDATE or DELETE on donations (enforced at DB level)
create rule donations_no_update as on update to public.donations do instead nothing;
create rule donations_no_delete as on delete to public.donations do instead nothing;

-- Auto-update campaign raised amount + donors_count on new donation
create or replace function public.update_campaign_stats()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.campaigns
  set
    raised       = raised + new.amount,
    donors_count = donors_count + 1,
    updated_at   = now()
  where id = new.campaign_id
    and new.status = 'completed';
  return new;
end;
$$;

create trigger after_donation_insert
  after insert on public.donations
  for each row execute function public.update_campaign_stats();

-- ── Recurring Donations (standing orders / הוראות קבע) ───────
create table public.recurring_donations (
  id               uuid primary key default gen_random_uuid(),
  donor_id         uuid not null references auth.users(id) on delete cascade,
  campaign_id      uuid not null references public.campaigns(id),
  org_id           uuid not null references public.organizations(id),
  amount           numeric(10,2) not null check (amount > 0),
  status           recurring_status not null default 'active',
  next_charge_date date,
  start_date       date not null default current_date,
  psp_token        text,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

-- ── Communities ──────────────────────────────────────────────
create table public.communities (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  name_en       text,
  description   text,
  manager_id    uuid references auth.users(id) on delete set null,
  org_id        uuid references public.organizations(id) on delete set null,
  referral_code text unique default encode(gen_random_bytes(6), 'hex'),
  total_raised  numeric(12,2) not null default 0,
  donors_count  integer not null default 0,
  created_at    timestamptz default now() not null
);

-- ── Indexes ──────────────────────────────────────────────────
create index idx_campaigns_org_id   on public.campaigns(org_id);
create index idx_campaigns_status   on public.campaigns(status);
create index idx_campaigns_category on public.campaigns(category);
create index idx_donations_donor    on public.donations(donor_id);
create index idx_donations_campaign on public.donations(campaign_id);
create index idx_donations_org      on public.donations(org_id);
create index idx_recurring_donor    on public.recurring_donations(donor_id);
create index idx_profiles_org       on public.profiles(org_id);

-- ── Row Level Security ───────────────────────────────────────
alter table public.profiles           enable row level security;
alter table public.organizations      enable row level security;
alter table public.campaigns          enable row level security;
alter table public.products           enable row level security;
alter table public.campaign_products  enable row level security;
alter table public.donations          enable row level security;
alter table public.recurring_donations enable row level security;
alter table public.communities        enable row level security;

-- Organizations: public read
create policy "orgs_public_read" on public.organizations
  for select using (true);

-- Campaigns: public read active campaigns
create policy "campaigns_public_read" on public.campaigns
  for select using (status = 'active');

-- Campaigns: org members read all their org's campaigns (including drafts)
create policy "campaigns_org_read" on public.campaigns
  for select using (
    org_id in (
      select org_id from public.profiles
      where id = auth.uid() and org_id is not null
    )
  );

-- Campaigns: org admin can insert/update
create policy "campaigns_org_insert" on public.campaigns
  for insert with check (
    org_id in (
      select org_id from public.profiles
      where id = auth.uid() and app_role in ('org_admin', 'org_member')
    )
  );

create policy "campaigns_org_update" on public.campaigns
  for update using (
    org_id in (
      select org_id from public.profiles
      where id = auth.uid() and app_role in ('org_admin', 'org_member')
    )
  );

-- Products: public read active products
create policy "products_public_read" on public.products
  for select using (active = true);

-- Campaign products: public read
create policy "campaign_products_public_read" on public.campaign_products
  for select using (true);

-- Profiles: users read own profile
create policy "profiles_own_read" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_own_update" on public.profiles
  for update using (id = auth.uid());

-- Donations: donors read own donations
create policy "donations_own_read" on public.donations
  for select using (donor_id = auth.uid());

-- Donations: org reads donations to their campaigns
create policy "donations_org_read" on public.donations
  for select using (
    org_id in (
      select org_id from public.profiles
      where id = auth.uid() and org_id is not null
    )
  );

-- Donations: authenticated users can insert
create policy "donations_insert" on public.donations
  for insert with check (donor_id = auth.uid());

-- Recurring: donors manage own
create policy "recurring_own_read" on public.recurring_donations
  for select using (donor_id = auth.uid());

create policy "recurring_own_update" on public.recurring_donations
  for update using (donor_id = auth.uid());

create policy "recurring_own_insert" on public.recurring_donations
  for insert with check (donor_id = auth.uid());

-- Communities: public read
create policy "communities_public_read" on public.communities
  for select using (true);

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
