select version, name
from supabase_migrations.schema_migrations
where version in ('20261002150000', '20261002151000')
order by version;

select
  p.proname,
  p.prosecdef as security_definer,
  p.proconfig,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') as service_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('set_payment_connection_status', 'cleanup_payment_checkout_pii', 'consume_api_rate_limit')
order by p.proname;

select
  has_table_privilege('authenticated', 'public.org_payment_connections', 'UPDATE') as authenticated_connection_update,
  has_table_privilege('authenticated', 'public.payment_connection_audit', 'SELECT') as authenticated_audit_read,
  has_table_privilege('authenticated', 'public.payment_checkout_sessions', 'SELECT') as authenticated_checkout_read,
  has_table_privilege('authenticated', 'public.api_rate_limit_buckets', 'SELECT') as authenticated_rate_limit_read;

do $$
declare
  v_schedule_migrated boolean;
  v_job_exists boolean;
begin
  select exists(
    select 1 from supabase_migrations.schema_migrations
    where version = '20261002151000'
  ) into v_schedule_migrated;
  if not v_schedule_migrated then
    raise notice 'Cron migration is not applied yet';
    return;
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise exception 'Cron migration is recorded but pg_cron is unavailable';
  end if;
  execute $query$
    select exists(
      select 1 from cron.job
      where jobname = 'impactify-payment-pii-cleanup'
        and schedule = '17 2 * * *'
        and active
    )
  $query$ into v_job_exists;
  if not v_job_exists then raise exception 'Daily payment PII cleanup job is missing'; end if;
end;
$$;

select provider, lower(btrim(terminal_id)) as terminal, count(*)
from public.org_payment_connections
where status = 'active'
group by provider, lower(btrim(terminal_id))
having count(*) > 1;

select count(*) as expired_sessions_with_pii
from public.payment_checkout_sessions
where status in ('expired', 'failed')
  and (
    customer_email <> '' or customer_name <> '' or customer_address <> ''
    or customer_city <> '' or customer_zip <> '' or customer_country <> ''
  );
