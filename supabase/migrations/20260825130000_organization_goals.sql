-- Structured bilingual NGO goals, required for new NGO onboarding and owner-editable later.
alter table public.organizations
  add column if not exists goals jsonb not null default '[]'::jsonb;

alter table public.organizations
  add constraint organizations_goals_shape check (
    jsonb_typeof(goals) = 'array' and jsonb_array_length(goals) <= 10
  );

grant select (goals) on public.organizations to anon, authenticated;

create or replace function public.normalize_organization_goals(p_goals jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  v_normalized jsonb;
begin
  if p_goals is null
    or jsonb_typeof(p_goals) <> 'array'
    or jsonb_array_length(p_goals) < 1
    or jsonb_array_length(p_goals) > 10
  then
    raise exception 'Between 1 and 10 organization goals are required';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_goals) as item(value)
    where jsonb_typeof(value) <> 'object'
      or nullif(btrim(value->>'he'), '') is null
      or char_length(btrim(value->>'he')) > 200
      or char_length(btrim(coalesce(value->>'en', ''))) > 200
  ) then
    raise exception 'Each goal requires Hebrew text of at most 200 characters';
  end if;

  select jsonb_agg(jsonb_build_object(
    'he', btrim(value->>'he'),
    'en', nullif(btrim(coalesce(value->>'en', '')), '')
  )) into v_normalized
  from jsonb_array_elements(p_goals) as item(value);

  return v_normalized;
end
$$;

revoke all on function public.normalize_organization_goals(jsonb)
  from public, anon, authenticated;

drop function if exists public.complete_ngo_signup(text, text, text);
create function public.complete_ngo_signup(
  p_full_name text,
  p_org_name text,
  p_org_name_en text,
  p_goals jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_org uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if nullif(btrim(p_full_name), '') is null or nullif(btrim(p_org_name), '') is null then
    raise exception 'Full name and NGO name are required';
  end if;
  select * into v_profile from public.profiles where id = v_user for update;
  if not found then raise exception 'Profile not found'; end if;
  if v_profile.onboarding_completed_at is not null then
    raise exception 'Onboarding already completed';
  end if;

  insert into public.organizations (name, name_en, initials, goals)
  values (
    left(btrim(p_org_name), 160),
    nullif(left(btrim(p_org_name_en), 160), ''),
    upper(left(coalesce(nullif(btrim(p_org_name_en), ''), btrim(p_org_name)), 2)),
    public.normalize_organization_goals(p_goals)
  ) returning id into v_org;

  update public.profiles set full_name = left(btrim(p_full_name), 120),
    app_role = 'ngo_owner', org_id = v_org, community_id = null,
    onboarding_completed_at = now(), updated_at = now()
  where id = v_user;
  return v_org;
end
$$;

create or replace function public.update_ngo_goals(p_goals jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  select * into v_profile from public.profiles where id = auth.uid() for update;
  if not found or v_profile.app_role <> 'ngo_owner' or v_profile.org_id is null then
    raise exception 'NGO owner access required';
  end if;

  update public.organizations
  set goals = public.normalize_organization_goals(p_goals)
  where id = v_profile.org_id;
  if not found then raise exception 'Organization not found'; end if;
end
$$;

revoke all on function public.complete_ngo_signup(text, text, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.update_ngo_goals(jsonb)
  from public, anon, authenticated;
grant execute on function public.complete_ngo_signup(text, text, text, jsonb)
  to authenticated;
grant execute on function public.update_ngo_goals(jsonb) to authenticated;
