-- Atomic one-time onboarding and admin-controlled role/tenant assignment.
create table if not exists public.admin_role_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  profile_id uuid not null,
  old_role public.app_role not null,
  new_role public.app_role not null,
  old_org_id uuid,
  new_org_id uuid,
  old_community_id uuid,
  new_community_id uuid,
  created_at timestamptz not null default now()
);
alter table public.admin_role_audit enable row level security;
create policy "admin_role_audit_admin_read" on public.admin_role_audit
  for select to authenticated using (public.is_admin());
revoke insert, update, delete on public.admin_role_audit from anon, authenticated;
grant select on public.admin_role_audit to authenticated;

create or replace function public.complete_donor_signup(p_full_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_profile public.profiles%rowtype;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_full_name), '') is null then raise exception 'Full name is required'; end if;
  select * into v_profile from public.profiles where id = v_user for update;
  if not found then raise exception 'Profile not found'; end if;
  if v_profile.onboarding_completed_at is not null then raise exception 'Onboarding already completed'; end if;
  update public.profiles set full_name = left(trim(p_full_name), 120), app_role = 'donor',
    org_id = null, community_id = null, onboarding_completed_at = now(), updated_at = now()
  where id = v_user;
  return v_user;
end $$;

create or replace function public.complete_ngo_signup(
  p_full_name text, p_org_name text, p_org_name_en text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_profile public.profiles%rowtype; v_org uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_full_name), '') is null or nullif(trim(p_org_name), '') is null then
    raise exception 'Full name and NGO name are required';
  end if;
  select * into v_profile from public.profiles where id = v_user for update;
  if not found then raise exception 'Profile not found'; end if;
  if v_profile.onboarding_completed_at is not null then raise exception 'Onboarding already completed'; end if;
  insert into public.organizations (name, name_en, initials)
  values (left(trim(p_org_name), 160), nullif(left(trim(p_org_name_en), 160), ''),
    upper(left(coalesce(nullif(trim(p_org_name_en), ''), trim(p_org_name)), 2)))
  returning id into v_org;
  update public.profiles set full_name = left(trim(p_full_name), 120), app_role = 'ngo_owner',
    org_id = v_org, community_id = null, onboarding_completed_at = now(), updated_at = now()
  where id = v_user;
  return v_org;
end $$;

create or replace function public.complete_community_signup(
  p_full_name text, p_community_name text, p_community_name_en text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_profile public.profiles%rowtype; v_community uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_full_name), '') is null or nullif(trim(p_community_name), '') is null then
    raise exception 'Full name and community name are required';
  end if;
  select * into v_profile from public.profiles where id = v_user for update;
  if not found then raise exception 'Profile not found'; end if;
  if v_profile.onboarding_completed_at is not null then raise exception 'Onboarding already completed'; end if;
  insert into public.communities (name, name_en, manager_id)
  values (left(trim(p_community_name), 160), nullif(left(trim(p_community_name_en), 160), ''), v_user)
  returning id into v_community;
  update public.profiles set full_name = left(trim(p_full_name), 120), app_role = 'community_owner',
    org_id = null, community_id = v_community, onboarding_completed_at = now(), updated_at = now()
  where id = v_user;
  return v_community;
end $$;

create or replace function public.admin_update_profile_role(
  p_profile_id uuid, p_role public.app_role, p_org_id uuid default null,
  p_community_id uuid default null
) returns void language plpgsql security definer set search_path = public as $$
declare v_current_role public.app_role; v_target public.profiles%rowtype;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  if p_profile_id = auth.uid() then raise exception 'Admins cannot change their own role'; end if;
  perform pg_advisory_xact_lock(hashtext('impactify-admin-role-management'));
  select * into v_target from public.profiles where id = p_profile_id for update;
  if not found then raise exception 'Profile not found'; end if;
  v_current_role := v_target.app_role;
  if p_role = 'ngo_owner' and (p_org_id is null or not exists (
    select 1 from public.organizations where id = p_org_id
  )) then raise exception 'A valid NGO is required'; end if;
  if p_role = 'community_owner' and (p_community_id is null or not exists (
    select 1 from public.communities where id = p_community_id
  )) then raise exception 'A valid community is required'; end if;
  if v_current_role = 'admin' and p_role <> 'admin'
    and (select count(*) from public.profiles where app_role = 'admin') <= 1
  then raise exception 'Cannot demote the last admin'; end if;
  update public.profiles set app_role = p_role,
    org_id = case when p_role = 'ngo_owner' then p_org_id else null end,
    community_id = case when p_role = 'community_owner' then p_community_id else null end,
    onboarding_completed_at = coalesce(onboarding_completed_at, now()), updated_at = now()
  where id = p_profile_id;
  insert into public.admin_role_audit (
    actor_id, profile_id, old_role, new_role, old_org_id, new_org_id,
    old_community_id, new_community_id
  ) values (
    auth.uid(), p_profile_id, v_target.app_role, p_role, v_target.org_id,
    case when p_role = 'ngo_owner' then p_org_id else null end,
    v_target.community_id,
    case when p_role = 'community_owner' then p_community_id else null end
  );
end $$;

revoke all on function public.complete_donor_signup(text) from public, anon, authenticated;
revoke all on function public.complete_ngo_signup(text, text, text) from public, anon, authenticated;
revoke all on function public.complete_community_signup(text, text, text) from public, anon, authenticated;
revoke all on function public.admin_update_profile_role(uuid, public.app_role, uuid, uuid) from public, anon, authenticated;
grant execute on function public.complete_donor_signup(text) to authenticated;
grant execute on function public.complete_ngo_signup(text, text, text) to authenticated;
grant execute on function public.complete_community_signup(text, text, text) to authenticated;
grant execute on function public.admin_update_profile_role(uuid, public.app_role, uuid, uuid) to authenticated;
