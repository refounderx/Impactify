-- Each NGO keeps its own terminal and receives settlement directly from its provider.
-- This table deliberately stores no API key, password, card, or token.
create table if not exists public.org_payment_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('cardcom', 'grow')),
  terminal_id text not null check (length(trim(terminal_id)) between 1 and 120),
  status text not null default 'setup_required'
    check (status in ('setup_required', 'pending_verification', 'active', 'disabled', 'failed')),
  created_by uuid references auth.users(id) on delete set null,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, provider)
);

create index if not exists idx_org_payment_connections_org
  on public.org_payment_connections(org_id);

alter table public.org_payment_connections enable row level security;
revoke all on public.org_payment_connections from anon, authenticated;

create or replace function public.get_ngo_payment_connections()
returns table (
  id uuid,
  provider text,
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
    select c.id, c.provider, c.terminal_id, c.status, c.last_verified_at, c.created_at
    from public.org_payment_connections c
    where c.org_id = v_org
    order by c.created_at desc;
end;
$$;

create or replace function public.start_ngo_payment_connection(
  p_provider text,
  p_terminal_id text
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
begin
  select org_id into v_org
  from public.profiles
  where id = auth.uid() and app_role = 'ngo_owner' and onboarding_completed_at is not null;

  if v_org is null then raise exception 'NGO owner access required'; end if;
  if p_provider not in ('cardcom', 'grow') then raise exception 'Unsupported payment provider'; end if;
  if length(v_terminal) < 1 or length(v_terminal) > 120 then raise exception 'Terminal identifier is required'; end if;

  insert into public.org_payment_connections (org_id, provider, terminal_id, status, created_by)
  values (v_org, p_provider, v_terminal, 'setup_required', auth.uid())
  on conflict (org_id, provider) do update
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

revoke all on function public.get_ngo_payment_connections() from public, anon, authenticated;
revoke all on function public.start_ngo_payment_connection(text, text) from public, anon, authenticated;
grant execute on function public.get_ngo_payment_connections() to authenticated;
grant execute on function public.start_ngo_payment_connection(text, text) to authenticated;
