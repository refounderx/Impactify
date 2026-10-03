-- Read-only snapshot. Healthy means all_checks_pass=true, every boolean=true,
-- and every *_count column is zero. It never returns payment or donor details.
with function_oids as (
  select
    to_regprocedure('public.get_ngo_payment_connections()') as get_connections,
    to_regprocedure('public.start_ngo_payment_connection(text,text)') as start_connection_legacy,
    to_regprocedure('public.start_ngo_payment_connection(text,text,text)') as start_connection,
    to_regprocedure('public.complete_verified_checkout(uuid,bigint,text,text,text)') as complete_checkout,
    to_regprocedure('public.claim_verified_donation(uuid)') as claim_donation,
    to_regprocedure('public.set_payment_connection_status(uuid,text,text)') as set_connection_status,
    to_regprocedure('public.cleanup_payment_checkout_pii()') as cleanup_pii,
    to_regprocedure('public.consume_api_rate_limit(text,text,integer,integer)') as consume_rate_limit,
    to_regprocedure('public.record_payment_reconciliation(uuid,text,bigint,text)') as record_reconciliation,
    to_regprocedure('public.audit_payment_connection_change()') as audit_connection_change
), cron_state as (
  select
    count(*) filter (
      where j.jobname = 'impactify-payment-pii-cleanup' and j.schedule = '17 2 * * *'
        and regexp_replace(lower(btrim(j.command)), '\s+', ' ', 'g') ~ '^select public\.cleanup_payment_checkout_pii\(\);?$'
        and j.active
    ) = 1 as cleanup_cron_definition_valid,
    count(*) filter (
      where j.jobname = 'impactify-payment-pii-cleanup' and j.username = 'postgres'
    ) = 1 as cleanup_cron_runs_as_postgres,
    exists (
      select 1 from cron.job_run_details r join cron.job job on job.jobid = r.jobid
      where job.jobname = 'impactify-payment-pii-cleanup' and r.status = 'succeeded'
        and r.end_time > now() - interval '36 hours'
    ) as cleanup_cron_recent_success
  from cron.job j
), checks as (
  select
    (select count(*) = 6 from supabase_migrations.schema_migrations
      where version in ('20261002150000','20261002151000','20261002160000','20261003110000','20261003111000',
        '20261003120000'))
      as latest_security_migrations_installed,
    (select count(*) = 6 from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname in ('org_payment_connections','payment_checkout_sessions',
        'payment_connection_audit','payment_reconciliation_alerts','api_rate_limit_buckets','donor_contact_details')
        and c.relkind = 'r') as payment_tables_exist,
    (select count(*) = 5 from pg_proc p
      where p.oid in (f.get_connections,f.start_connection_legacy,f.start_connection,f.complete_checkout,f.claim_donation)
        and p.prosecdef and coalesce(p.proconfig, array[]::text[]) @> array['search_path=public'])
      as tenant_rpcs_secured,
    (select count(*) = 5 from pg_proc p
      where p.oid in (f.set_connection_status,f.cleanup_pii,f.consume_rate_limit,f.record_reconciliation,f.audit_connection_change)
        and p.prosecdef and coalesce(p.proconfig, array[]::text[]) @> array['search_path=public'])
      as service_rpcs_secured,
    not coalesce(has_function_privilege('anon', f.complete_checkout, 'EXECUTE'), true)
      and not coalesce(has_function_privilege('authenticated', f.complete_checkout, 'EXECUTE'), true)
      and coalesce(has_function_privilege('service_role', f.complete_checkout, 'EXECUTE'), false)
      and not coalesce(has_function_privilege('anon', f.set_connection_status, 'EXECUTE'), true)
      and not coalesce(has_function_privilege('authenticated', f.set_connection_status, 'EXECUTE'), true)
      and coalesce(has_function_privilege('service_role', f.set_connection_status, 'EXECUTE'), false)
      and not coalesce(has_function_privilege('anon', f.cleanup_pii, 'EXECUTE'), true)
      and not coalesce(has_function_privilege('authenticated', f.cleanup_pii, 'EXECUTE'), true)
      and coalesce(has_function_privilege('service_role', f.cleanup_pii, 'EXECUTE'), false)
      and not coalesce(has_function_privilege('anon', f.consume_rate_limit, 'EXECUTE'), true)
      and not coalesce(has_function_privilege('authenticated', f.consume_rate_limit, 'EXECUTE'), true)
      and coalesce(has_function_privilege('service_role', f.consume_rate_limit, 'EXECUTE'), false)
      and not coalesce(has_function_privilege('anon', f.record_reconciliation, 'EXECUTE'), true)
      and not coalesce(has_function_privilege('authenticated', f.record_reconciliation, 'EXECUTE'), true)
      and coalesce(has_function_privilege('service_role', f.record_reconciliation, 'EXECUTE'), false)
      as service_rpc_grants_correct,
    (select count(*) = 6 from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname in ('org_payment_connections','payment_checkout_sessions',
        'payment_connection_audit','payment_reconciliation_alerts','api_rate_limit_buckets','donor_contact_details')
        and c.relrowsecurity) as payment_tables_have_rls,
    not exists (
      select 1 from (values ('anon'),('authenticated')) roles(role_name)
      cross join (values ('public.org_payment_connections'),('public.payment_checkout_sessions'),
        ('public.payment_connection_audit'),('public.payment_reconciliation_alerts'),
        ('public.api_rate_limit_buckets')) relations(relation_name)
      where has_table_privilege(roles.role_name, relations.relation_name, 'SELECT')
        or has_table_privilege(roles.role_name, relations.relation_name, 'INSERT')
        or has_table_privilege(roles.role_name, relations.relation_name, 'UPDATE')
        or has_table_privilege(roles.role_name, relations.relation_name, 'DELETE')
    ) as browser_roles_blocked_from_payment_tables,
    exists (select 1 from pg_indexes where schemaname='public'
      and indexname='org_payment_connections_active_terminal_key'
      and indexdef ilike 'create unique index%' and indexdef ilike '%where (status = ''active''%')
      as active_terminal_unique_index_present,
    exists (select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname='org_payment_connections'
        and t.tgname='audit_payment_connection_change' and not t.tgisinternal and t.tgenabled <> 'D')
      as connection_audit_trigger_active,
    cron.cleanup_cron_definition_valid,
    cron.cleanup_cron_runs_as_postgres,
    cron.cleanup_cron_recent_success,
    (select count(*) from (select provider, lower(btrim(terminal_id)) from public.org_payment_connections
      where status='active' group by provider, lower(btrim(terminal_id)) having count(*) > 1) duplicates)
      as duplicate_active_terminal_count,
    (select count(*) from public.payment_checkout_sessions where status='pending' and expires_at < now())
      as expired_pending_session_count,
    (select count(*) from public.payment_checkout_sessions where status='pending' and expires_at < now()
      and (customer_email<>'' or customer_name<>'' or customer_address<>'' or customer_city<>'' or customer_zip<>'' or customer_country<>''))
      as expired_pending_pii_count,
    (select count(*) from public.payment_checkout_sessions
      where status='expired' and reconciliation_status='not_found'
        and reconciliation_attempts=0 and reconciliation_checked_at is null)
      as unverified_not_found_count,
    (select count(*) from public.payment_checkout_sessions
      where status in ('pending','expired') and reconciliation_status in ('pending','retry') and expires_at < now())
      as open_reconciliation_queue_count,
    (select count(*) from public.payment_checkout_sessions where status in ('expired','failed','manual_review')
      and (customer_email<>'' or customer_name<>'' or customer_address<>'' or customer_city<>'' or customer_zip<>'' or customer_country<>''))
      as closed_session_pii_count,
    (select count(*) from public.payment_checkout_sessions where status='completed' and completed_at < now()-interval '7 days'
      and (customer_email<>'' or customer_name<>'' or customer_address<>'' or customer_city<>'' or customer_zip<>'' or customer_country<>''))
      as old_completed_session_pii_count,
    (select count(*) from public.payment_reconciliation_alerts where status='open') as open_reconciliation_alert_count,
    (select count(*) from public.api_rate_limit_buckets where updated_at < now()-interval '1 day')
      as stale_rate_limit_bucket_count
  from function_oids f cross join cron_state cron
)
select
  latest_security_migrations_installed and payment_tables_exist and tenant_rpcs_secured and service_rpcs_secured
    and service_rpc_grants_correct and payment_tables_have_rls and browser_roles_blocked_from_payment_tables
    and active_terminal_unique_index_present and connection_audit_trigger_active
    and cleanup_cron_definition_valid and cleanup_cron_runs_as_postgres and cleanup_cron_recent_success
    and duplicate_active_terminal_count=0 and expired_pending_session_count=0 and expired_pending_pii_count=0
    and unverified_not_found_count=0 and open_reconciliation_queue_count=0
    and closed_session_pii_count=0 and old_completed_session_pii_count=0
    and open_reconciliation_alert_count=0 and stale_rate_limit_bucket_count=0 as all_checks_pass,
  checks.*
from checks;
