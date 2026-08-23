-- Four-role model, immutable tenant assignment for ordinary users, and safe public grants.
drop policy if exists "campaigns_org_insert" on public.campaigns;
drop policy if exists "campaigns_org_update" on public.campaigns;

alter table public.profiles alter column app_role drop default;
create type public.app_role_v2 as enum ('donor', 'ngo_owner', 'community_owner', 'admin');
alter table public.profiles alter column app_role type public.app_role_v2 using (
  case app_role::text
    when 'org_admin' then 'ngo_owner'
    when 'org_member' then 'ngo_owner'
    when 'community_manager' then 'community_owner'
    else 'donor'
  end
)::public.app_role_v2;
drop type public.app_role;
alter type public.app_role_v2 rename to app_role;
alter table public.profiles alter column app_role set default 'donor'::public.app_role;

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

-- Repair pre-production demo associations before enforcing foreign keys.
update public.profiles p set org_id = null
where org_id is not null and not exists (
  select 1 from public.organizations o where o.id = p.org_id
);
update public.profiles p set community_id = null
where community_id is not null and not exists (
  select 1 from public.communities c where c.id = p.community_id
);
update public.profiles set app_role = 'donor', org_id = null
where app_role = 'ngo_owner' and org_id is null;
update public.profiles set app_role = 'donor', community_id = null
where app_role = 'community_owner' and community_id is null;
update public.profiles set onboarding_completed_at = now()
where onboarding_completed_at is null
  and nullif(trim(full_name), '') is not null
  and (
    (app_role = 'donor' and org_id is null and community_id is null) or
    (app_role = 'ngo_owner' and org_id is not null and community_id is null) or
    (app_role = 'community_owner' and org_id is null and community_id is not null)
  );

alter table public.profiles
  add constraint profiles_org_id_fkey foreign key (org_id)
    references public.organizations(id) on delete restrict,
  add constraint profiles_community_id_fkey foreign key (community_id)
    references public.communities(id) on delete restrict,
  add constraint profiles_role_tenant_consistency check (
    (onboarding_completed_at is null and app_role = 'donor' and org_id is null and community_id is null) or
    (onboarding_completed_at is not null and app_role = 'donor' and org_id is null and community_id is null) or
    (onboarding_completed_at is not null and app_role = 'ngo_owner' and org_id is not null and community_id is null) or
    (onboarding_completed_at is not null and app_role = 'community_owner' and org_id is null and community_id is not null) or
    (onboarding_completed_at is not null and app_role = 'admin' and org_id is null and community_id is null)
  );

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

drop policy if exists "profiles_own_read" on public.profiles;
drop policy if exists "profiles_own_update" on public.profiles;
create policy "profiles_own_read" on public.profiles for select using (id = auth.uid());
create policy "profiles_admin_read" on public.profiles for select using (public.is_admin());
create policy "profiles_own_details_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
revoke insert, delete, update on public.profiles from anon, authenticated;
grant update (full_name, full_name_en, phone, avatar_url, id_number) on public.profiles to authenticated;

-- Public organization reads must never expose bank account fields.
revoke select on public.organizations from anon, authenticated;
grant select (id, name, name_en, initials, color, description, description_en,
  logo_url, registration_number, verified, founded, founded_en, ceo, ceo_en,
  volunteers, address, address_en, phone, video_gradient, created_at)
on public.organizations to anon, authenticated;

drop policy if exists "site_content_public_write" on public.site_content;
drop policy if exists "site_content_public_update" on public.site_content;
create policy "site_content_admin_insert" on public.site_content
  for insert to authenticated with check (public.is_admin());
create policy "site_content_admin_update" on public.site_content
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Shared admin snapshots are not production tenant data.
delete from public.site_datasets where key in ('nonprofit_admin', 'community_admin');
