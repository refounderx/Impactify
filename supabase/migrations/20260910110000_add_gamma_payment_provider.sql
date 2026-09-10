-- Gamma terminal metadata follows the same NGO-scoped, credential-free model
-- as the existing providers. Provider secrets remain server-only and are not
-- accepted by this table or its browser-callable RPCs.
alter table public.org_payment_connections
  drop constraint if exists org_payment_connections_provider_check;

alter table public.org_payment_connections
  add constraint org_payment_connections_provider_check
  check (provider in ('cardcom', 'grow', 'gamma'));

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
  if p_provider not in ('cardcom', 'grow', 'gamma') then raise exception 'Unsupported payment provider'; end if;
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
