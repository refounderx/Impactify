create or replace function public.get_ngo_payment_connections()
returns table (
  id uuid,
  provider text,
  connection_kind text,
  terminal_id text,
  status text,
  last_verified_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select p.org_id into v_org
  from public.profiles as p
  where p.id = auth.uid()
    and p.app_role = 'ngo_owner'
    and p.onboarding_completed_at is not null;

  if v_org is null then raise exception 'NGO owner access required'; end if;

  return query
    select
      c.id,
      c.provider,
      c.connection_kind,
      c.terminal_id,
      c.status,
      c.last_verified_at,
      c.created_at
    from public.org_payment_connections as c
    where c.org_id = v_org
    order by c.created_at desc;
end;
$$;

revoke all on function public.get_ngo_payment_connections()
  from public, anon, authenticated;
grant execute on function public.get_ngo_payment_connections()
  to authenticated;

insert into supabase_migrations.schema_migrations(version, name)
values ('20261002160000', 'fix_payment_connection_profile_ambiguity')
on conflict (version) do nothing;
