-- ============================================================
-- Impactify — Full Database Schema
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────
create type app_role as enum ('donor', 'ngo_owner', 'community_owner', 'admin');
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
  onboarding_completed_at timestamptz,
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

-- Immutable record of privileged role and tenant-assignment changes.
create table public.admin_role_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  profile_id uuid not null,
  old_role app_role not null,
  new_role app_role not null,
  old_org_id uuid,
  new_org_id uuid,
  old_community_id uuid,
  new_community_id uuid,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_org_id_fkey foreign key (org_id) references public.organizations(id) on delete restrict,
  add constraint profiles_community_id_fkey foreign key (community_id) references public.communities(id) on delete restrict,
  add constraint profiles_role_tenant_consistency check (
    (onboarding_completed_at is null and app_role = 'donor' and org_id is null and community_id is null) or
    (onboarding_completed_at is not null and app_role = 'donor' and org_id is null and community_id is null) or
    (onboarding_completed_at is not null and app_role = 'ngo_owner' and org_id is not null and community_id is null) or
    (onboarding_completed_at is not null and app_role = 'community_owner' and org_id is null and community_id is not null) or
    (onboarding_completed_at is not null and app_role = 'admin' and org_id is null and community_id is null)
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
alter table public.admin_role_audit   enable row level security;
alter table public.organizations      enable row level security;
alter table public.campaigns          enable row level security;
alter table public.products           enable row level security;
alter table public.campaign_products  enable row level security;
alter table public.donations          enable row level security;
alter table public.recurring_donations enable row level security;
alter table public.communities        enable row level security;

create or replace function public.current_app_role()
returns public.app_role language sql stable security definer set search_path = public
as $$ select app_role from public.profiles where id = auth.uid() $$;
create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public
as $$ select org_id from public.profiles where id = auth.uid() $$;
create or replace function public.current_community_id()
returns uuid language sql stable security definer set search_path = public
as $$ select community_id from public.profiles where id = auth.uid() $$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.current_app_role() = 'admin', false) $$;

revoke all on function public.current_app_role() from public, anon, authenticated;
revoke all on function public.current_org_id() from public, anon, authenticated;
revoke all on function public.current_community_id() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.current_org_id() to authenticated;
grant execute on function public.current_community_id() to authenticated;
grant execute on function public.is_admin() to authenticated;

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
      where id = auth.uid() and app_role = 'ngo_owner'
    )
  );

create policy "campaigns_org_update" on public.campaigns
  for update using (
    org_id in (
      select org_id from public.profiles
      where id = auth.uid() and app_role = 'ngo_owner'
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

create policy "profiles_own_details_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_read" on public.profiles
  for select using (public.is_admin());
create policy "admin_role_audit_admin_read" on public.admin_role_audit
  for select to authenticated using (public.is_admin());
revoke insert, update, delete on public.admin_role_audit from anon, authenticated;
grant select on public.admin_role_audit to authenticated;

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
create policy "donations_community_read" on public.donations
  for select using (
    community_id = public.current_community_id() and public.current_app_role() = 'community_owner'
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
-- Public reads support translated copy. Only authenticated app admins write.
create table if not exists public.site_content (
  key        text primary key,
  text_he    text,
  text_en    text,
  updated_at timestamptz default now() not null
);

alter table public.site_content enable row level security;

create policy "site_content_public_read" on public.site_content
  for select using (true);
create policy "site_content_admin_insert" on public.site_content
  for insert to authenticated with check (public.is_admin());
create policy "site_content_admin_update" on public.site_content
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Ordinary users can edit personal fields, never their role or tenant IDs.
revoke insert, delete, update on public.profiles from anon, authenticated;
grant update (full_name, full_name_en, phone, avatar_url, id_number) on public.profiles to authenticated;

-- Bank account columns are not part of the public organization contract.
revoke select on public.organizations from anon, authenticated;
grant select (id, name, name_en, initials, color, description, description_en,
  logo_url, registration_number, verified, founded, founded_en, ceo, ceo_en,
  volunteers, address, address_en, phone, video_gradient, created_at)
on public.organizations to anon, authenticated;

-- Onboarding, admin role management, and atomic campaign publishing RPCs are
-- defined in migrations 20260823161000 and 20260823162000. Migrations are the
-- executable source of truth; this file remains the readable base schema.
