begin;

alter table public.organizations
  add column if not exists activity_area text;

grant select (activity_area) on public.organizations to anon, authenticated;

create or replace function public.update_ngo_profile(
  p_name text,
  p_description text,
  p_activity_area text,
  p_address text,
  p_phone text,
  p_ceo text,
  p_founded text,
  p_logo_url text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select org_id into v_org
  from public.profiles
  where id = auth.uid()
    and app_role = 'ngo_owner'
    and onboarding_completed_at is not null;

  if v_org is null then raise exception 'NGO owner access required'; end if;
  if nullif(btrim(p_name), '') is null or length(btrim(p_name)) > 120 then raise exception 'Organization name is required and must be at most 120 characters'; end if;
  if p_description is not null and length(btrim(p_description)) > 250 then raise exception 'Description must be at most 250 characters'; end if;
  if p_activity_area is not null and length(btrim(p_activity_area)) > 80 then raise exception 'Activity area must be at most 80 characters'; end if;
  if p_address is not null and length(btrim(p_address)) > 240 then raise exception 'Address must be at most 240 characters'; end if;
  if p_phone is not null and length(btrim(p_phone)) > 30 then raise exception 'Phone must be at most 30 characters'; end if;
  if p_ceo is not null and length(btrim(p_ceo)) > 120 then raise exception 'Contact name must be at most 120 characters'; end if;
  if p_founded is not null and length(btrim(p_founded)) > 40 then raise exception 'Founded value must be at most 40 characters'; end if;
  if p_logo_url is not null and (length(btrim(p_logo_url)) > 2048 or btrim(p_logo_url) !~ '^https?://') then raise exception 'Logo URL must be a valid HTTP(S) URL'; end if;

  update public.organizations set
    name = btrim(p_name),
    description = nullif(btrim(p_description), ''),
    activity_area = nullif(btrim(p_activity_area), ''),
    address = nullif(btrim(p_address), ''),
    phone = nullif(btrim(p_phone), ''),
    ceo = nullif(btrim(p_ceo), ''),
    founded = nullif(btrim(p_founded), ''),
    logo_url = nullif(btrim(p_logo_url), '')
  where id = v_org;

  if not found then raise exception 'Organization not found'; end if;
end
$$;

revoke all on function public.update_ngo_profile(text, text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.update_ngo_profile(text, text, text, text, text, text, text, text)
  to authenticated;

insert into supabase_migrations.schema_migrations(version, name)
values ('20260829130000', 'update_ngo_profile')
on conflict (version) do nothing;

commit;
