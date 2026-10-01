-- A Tranzila customer may have separate terminals for ordinary payments and
-- tokenized/recurring payments. Existing connections remain regular terminals.
alter table public.org_payment_connections
  add column if not exists connection_kind text not null default 'regular';

alter table public.org_payment_connections
  drop constraint if exists org_payment_connections_org_id_provider_key;

alter table public.org_payment_connections
  add constraint org_payment_connections_org_provider_kind_key
  unique (org_id, provider, connection_kind);

alter table public.org_payment_connections
  add constraint org_payment_connections_provider_kind_check
  check (
    (provider = 'tranzila' and connection_kind in ('regular', 'token'))
    or (provider in ('cardcom', 'grow') and connection_kind = 'regular')
  );

drop function if exists public.get_ngo_payment_connections();

create function public.get_ngo_payment_connections()
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
  select org_id into v_org
  from public.profiles
  where id = auth.uid() and app_role = 'ngo_owner' and onboarding_completed_at is not null;

  if v_org is null then raise exception 'NGO owner access required'; end if;

  return query
    select c.id, c.provider, c.connection_kind, c.terminal_id, c.status, c.last_verified_at, c.created_at
    from public.org_payment_connections c
    where c.org_id = v_org
    order by c.created_at desc;
end;
$$;

create function public.start_ngo_payment_connection(
  p_provider text,
  p_terminal_id text,
  p_connection_kind text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_connection uuid;
  v_terminal text := trim(coalesce(p_terminal_id, ''));
  v_connection_kind text := trim(coalesce(p_connection_kind, ''));
begin
  select org_id into v_org
  from public.profiles
  where id = auth.uid() and app_role = 'ngo_owner' and onboarding_completed_at is not null;

  if v_org is null then raise exception 'NGO owner access required'; end if;
  if p_provider not in ('cardcom', 'grow', 'tranzila') then raise exception 'Unsupported payment provider'; end if;
  if v_connection_kind not in ('regular', 'token') then raise exception 'Unsupported terminal type'; end if;
  if p_provider <> 'tranzila' and v_connection_kind <> 'regular' then raise exception 'Token terminals are only supported by Tranzila'; end if;
  if length(v_terminal) < 1 or length(v_terminal) > 120 then raise exception 'Terminal identifier is required'; end if;

  insert into public.org_payment_connections (org_id, provider, connection_kind, terminal_id, status, created_by)
  values (v_org, p_provider, v_connection_kind, v_terminal, 'setup_required', auth.uid())
  on conflict (org_id, provider, connection_kind) do update
    set terminal_id = excluded.terminal_id,
        status = case
          when public.org_payment_connections.terminal_id = excluded.terminal_id
            then public.org_payment_connections.status
          else 'setup_required'
        end,
        updated_at = now()
  returning id into v_connection;

  return v_connection;
end;
$$;

-- Keep deployed clients that still pass two arguments working while they roll out.
create or replace function public.start_ngo_payment_connection(
  p_provider text,
  p_terminal_id text
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.start_ngo_payment_connection(p_provider, p_terminal_id, 'regular');
$$;

revoke all on function public.get_ngo_payment_connections() from public, anon, authenticated;
revoke all on function public.start_ngo_payment_connection(text, text) from public, anon, authenticated;
revoke all on function public.start_ngo_payment_connection(text, text, text) from public, anon, authenticated;
grant execute on function public.get_ngo_payment_connections() to authenticated;
grant execute on function public.start_ngo_payment_connection(text, text) to authenticated;
grant execute on function public.start_ngo_payment_connection(text, text, text) to authenticated;
