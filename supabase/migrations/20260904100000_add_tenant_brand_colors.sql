-- Persist a leading brand color selected during NGO and community sign-up.
alter table public.communities
  add column if not exists color text not null default '#00B5AD';

alter table public.communities
  drop constraint if exists communities_color_hex_check;

alter table public.communities
  add constraint communities_color_hex_check
  check (color ~ '^#[0-9A-Fa-f]{6}$');

grant select (color) on public.communities to anon, authenticated;

drop function if exists public.complete_ngo_signup(text, text, text, jsonb);
create function public.complete_ngo_signup(
  p_full_name text,
  p_org_name text,
  p_org_name_en text,
  p_goals jsonb,
  p_color text default '#00B5AD'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_org uuid;
  v_color text := upper(btrim(coalesce(p_color, '')));
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if nullif(btrim(p_full_name), '') is null or nullif(btrim(p_org_name), '') is null then
    raise exception 'Full name and NGO name are required';
  end if;
  if v_color !~ '^#[0-9A-F]{6}$' then
    raise exception 'Brand color must be a six-digit hexadecimal color';
  end if;
  select * into v_profile from public.profiles where id = v_user for update;
  if not found then raise exception 'Profile not found'; end if;
  if v_profile.onboarding_completed_at is not null then
    raise exception 'Onboarding already completed';
  end if;

  insert into public.organizations (name, name_en, initials, goals, color)
  values (
    left(btrim(p_org_name), 160),
    nullif(left(btrim(p_org_name_en), 160), ''),
    upper(left(coalesce(nullif(btrim(p_org_name_en), ''), btrim(p_org_name)), 2)),
    public.normalize_organization_goals(p_goals),
    v_color
  ) returning id into v_org;

  update public.profiles set full_name = left(btrim(p_full_name), 120),
    app_role = 'ngo_owner', org_id = v_org, community_id = null,
    onboarding_completed_at = now(), updated_at = now()
  where id = v_user;
  return v_org;
end
$$;

drop function if exists public.complete_community_signup(text, text, text);
create function public.complete_community_signup(
  p_full_name text,
  p_community_name text,
  p_community_name_en text default null,
  p_color text default '#00B5AD'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_community uuid;
  v_color text := upper(btrim(coalesce(p_color, '')));
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if nullif(btrim(p_full_name), '') is null or nullif(btrim(p_community_name), '') is null then
    raise exception 'Full name and community name are required';
  end if;
  if v_color !~ '^#[0-9A-F]{6}$' then
    raise exception 'Brand color must be a six-digit hexadecimal color';
  end if;
  select * into v_profile from public.profiles where id = v_user for update;
  if not found then raise exception 'Profile not found'; end if;
  if v_profile.onboarding_completed_at is not null then
    raise exception 'Onboarding already completed';
  end if;

  insert into public.communities (name, name_en, manager_id, color)
  values (
    left(btrim(p_community_name), 160),
    nullif(left(btrim(p_community_name_en), 160), ''),
    v_user,
    v_color
  ) returning id into v_community;

  update public.profiles set full_name = left(btrim(p_full_name), 120),
    app_role = 'community_owner', org_id = null, community_id = v_community,
    onboarding_completed_at = now(), updated_at = now()
  where id = v_user;
  return v_community;
end
$$;

revoke all on function public.complete_ngo_signup(text, text, text, jsonb, text)
  from public, anon, authenticated;
revoke all on function public.complete_community_signup(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.complete_ngo_signup(text, text, text, jsonb, text)
  to authenticated;
grant execute on function public.complete_community_signup(text, text, text, text)
  to authenticated;
