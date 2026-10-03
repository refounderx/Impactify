alter table public.payment_checkout_sessions
  drop constraint if exists payment_checkout_sessions_status_check;
alter table public.payment_checkout_sessions
  add constraint payment_checkout_sessions_status_check
  check (status in ('pending','completed','failed','expired','manual_review'));

alter table public.payment_checkout_sessions
  add column if not exists reconciliation_status text not null default 'pending'
    check (reconciliation_status in ('pending','retry','not_found','review','completed','not_required')),
  add column if not exists reconciliation_attempts integer not null default 0 check (reconciliation_attempts >= 0),
  add column if not exists reconciliation_checked_at timestamptz;

update public.payment_checkout_sessions
set reconciliation_status = case status
  when 'completed' then 'completed'
  when 'failed' then 'not_required'
  when 'expired' then 'not_found'
  else reconciliation_status
end;

create index if not exists payment_checkout_sessions_reconciliation_idx
  on public.payment_checkout_sessions(reconciliation_status, expires_at)
  where status in ('pending','expired');

create table if not exists public.payment_reconciliation_alerts (
  id bigint generated always as identity primary key,
  reference uuid not null unique references public.payment_checkout_sessions(reference),
  org_id uuid not null references public.organizations(id),
  provider text not null check (provider = 'tranzila'),
  provider_transaction_id bigint,
  reason text not null check (reason in ('provider_match','reconciliation_timeout','late_callback')),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.payment_reconciliation_alerts enable row level security;
revoke all on public.payment_reconciliation_alerts from public, anon, authenticated;

create or replace function public.record_payment_reconciliation(
  p_reference uuid,
  p_outcome text,
  p_transaction_id bigint default null,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.payment_checkout_sessions%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  if p_outcome not in ('retry','not_found','review') then raise exception 'invalid reconciliation outcome'; end if;
  if p_reason not in ('provider_match','provider_not_found','provider_error','field_configuration_error','late_callback') then
    raise exception 'invalid reconciliation reason';
  end if;

  select * into s from public.payment_checkout_sessions where reference = p_reference for update;
  if not found then return false; end if;
  if s.status = 'completed' then return true; end if;
  if s.status not in ('pending','expired','manual_review') then return false; end if;

  if p_outcome = 'review' then
    if p_transaction_id is null or p_transaction_id <= 0 then raise exception 'transaction required'; end if;
    if exists (
      select 1 from public.payment_checkout_sessions
      where provider_transaction_id = p_transaction_id and reference <> p_reference
    ) then raise exception 'transaction already consumed'; end if;
    update public.payment_checkout_sessions
    set status = 'manual_review', provider_transaction_id = p_transaction_id,
        reconciliation_status = 'review', reconciliation_attempts = reconciliation_attempts + 1,
        reconciliation_checked_at = now()
    where reference = p_reference;
    insert into public.payment_reconciliation_alerts(reference, org_id, provider, provider_transaction_id, reason)
    values (s.reference, s.org_id, s.provider, p_transaction_id,
      case when p_reason = 'late_callback' then 'late_callback' else 'provider_match' end)
    on conflict (reference) do update
      set provider_transaction_id = excluded.provider_transaction_id, reason = excluded.reason, status = 'open', resolved_at = null;
  elsif p_outcome = 'not_found' then
    if s.expires_at > now() - interval '48 hours' then raise exception 'reconciliation grace period active'; end if;
    update public.payment_checkout_sessions
    set status = 'expired', reconciliation_status = 'not_found',
        reconciliation_attempts = reconciliation_attempts + 1, reconciliation_checked_at = now(),
        customer_email = '', customer_name = '', customer_address = '',
        customer_city = '', customer_zip = '', customer_country = ''
    where reference = p_reference;
  else
    update public.payment_checkout_sessions
    set reconciliation_status = 'retry', reconciliation_attempts = reconciliation_attempts + 1,
        reconciliation_checked_at = now()
    where reference = p_reference;
  end if;
  return true;
end;
$$;

revoke all on function public.record_payment_reconciliation(uuid,text,bigint,text) from public, anon, authenticated;
grant execute on function public.record_payment_reconciliation(uuid,text,bigint,text) to service_role;

create or replace function public.cleanup_payment_checkout_pii()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_changed integer;
begin
  if auth.role() <> 'service_role' and session_user <> 'postgres' then raise exception 'privileged role required'; end if;

  insert into public.payment_reconciliation_alerts(reference, org_id, provider, reason)
  select reference, org_id, provider, 'reconciliation_timeout'
  from public.payment_checkout_sessions
  where status = 'pending' and expires_at < now() - interval '7 days'
  on conflict (reference) do nothing;

  update public.payment_checkout_sessions
  set status = 'manual_review', reconciliation_status = 'review', reconciliation_checked_at = now(),
      customer_email = '', customer_name = '', customer_address = '',
      customer_city = '', customer_zip = '', customer_country = ''
  where status = 'pending' and expires_at < now() - interval '7 days';
  get diagnostics v_changed = row_count;
  v_rows := v_rows + v_changed;

  update public.payment_checkout_sessions
  set customer_email = '', customer_name = '', customer_address = '',
      customer_city = '', customer_zip = '', customer_country = ''
  where (
      status in ('failed','expired','manual_review')
      or (status = 'completed' and completed_at < now() - interval '7 days')
    ) and (
      customer_email <> '' or customer_name <> '' or customer_address <> ''
      or customer_city <> '' or customer_zip <> '' or customer_country <> ''
    );
  get diagnostics v_changed = row_count;
  v_rows := v_rows + v_changed;

  delete from public.api_rate_limit_buckets where updated_at < now() - interval '1 day';
  return v_rows;
end;
$$;

revoke all on function public.cleanup_payment_checkout_pii() from public, anon, authenticated;
grant execute on function public.cleanup_payment_checkout_pii() to service_role;

do $$
declare job record;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise exception 'Enable pg_cron before applying this migration';
  end if;
  for job in select jobid from cron.job where jobname = 'impactify-payment-pii-cleanup' loop
    perform cron.unschedule(job.jobid);
  end loop;
  perform cron.schedule(
    'impactify-payment-pii-cleanup', '17 2 * * *',
    $cron$select public.cleanup_payment_checkout_pii();$cron$
  );
end;
$$;

insert into supabase_migrations.schema_migrations(version, name)
values ('20261003110000', 'payment_reconciliation_and_cleanup')
on conflict (version) do nothing;
