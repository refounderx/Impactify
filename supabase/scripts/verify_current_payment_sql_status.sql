-- Read-only snapshot of the deployed payment/security SQL contract.
-- A healthy result has all_checks_pass=true, every other boolean=true,
-- and every *_count column equal to zero.
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
    to_regprocedure('public.audit_payment_connection_change()') as audit_connection_change
),
checks as (
  select
    (
      select count(*) = 3
      from supabase_migrations.schema_migrations
      where version in ('20261002150000', '20261002151000', '20261002160000')
    ) as latest_security_migrations_installed,
    to_regclass('public.org_payment_connections') is not null
      and to_regclass('public.payment_checkout_sessions') is not null
      and to_regclass('public.payment_connection_audit') is not null
      and to_regclass('public.api_rate_limit_buckets') is not null
      and to_regclass('public.donor_contact_details') is not null
      as payment_tables_exist,
    (
      select count(*) = 5
      from pg_proc p
      where p.oid in (
        f.get_connections,
        f.start_connection_legacy,
        f.start_connection,
        f.complete_checkout,
        f.claim_donation
      )
        and p.prosecdef
        and coalesce(p.proconfig, array[]::text[]) @> array['search_path=public']
    ) as tenant_rpcs_secured,
    (
      select count(*) = 4
      from pg_proc p
      where p.oid in (
        f.set_connection_status,
        f.cleanup_pii,
        f.consume_rate_limit,
        f.audit_connection_change
      )
        and p.prosecdef
        and coalesce(p.proconfig, array[]::text[]) @> array['search_path=public']
    ) as service_rpcs_secured,
    not coalesce(has_function_privilege('anon', f.get_connections, 'EXECUTE'), true)
      and coalesce(has_function_privilege('authenticated', f.get_connections, 'EXECUTE'), false)
      and not coalesce(has_function_privilege('anon', f.start_connection_legacy, 'EXECUTE'), true)
      and coalesce(has_function_privilege('authenticated', f.start_connection_legacy, 'EXECUTE'), false)
      and not coalesce(has_function_privilege('anon', f.start_connection, 'EXECUTE'), true)
      and coalesce(has_function_privilege('authenticated', f.start_connection, 'EXECUTE'), false)
      and not coalesce(has_function_privilege('anon', f.claim_donation, 'EXECUTE'), true)
      and coalesce(has_function_privilege('authenticated', f.claim_donation, 'EXECUTE'), false)
      and not coalesce(has_function_privilege('anon', f.complete_checkout, 'EXECUTE'), true)
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
      and not coalesce(has_function_privilege('anon', f.audit_connection_change, 'EXECUTE'), true)
      and not coalesce(has_function_privilege('authenticated', f.audit_connection_change, 'EXECUTE'), true)
      as rpc_grants_correct,
    (
      select count(*) = 5
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in (
          'org_payment_connections',
          'payment_checkout_sessions',
          'payment_connection_audit',
          'api_rate_limit_buckets',
          'donor_contact_details'
        )
        and c.relrowsecurity
    ) as payment_tables_have_rls,
    not exists (
      select 1
      from (values ('anon'), ('authenticated')) as roles(role_name)
      cross join (values
        ('public.org_payment_connections'),
        ('public.payment_checkout_sessions'),
        ('public.payment_connection_audit'),
        ('public.api_rate_limit_buckets')
      ) as relations(relation_name)
      where has_table_privilege(roles.role_name, relations.relation_name, 'SELECT')
        or has_table_privilege(roles.role_name, relations.relation_name, 'INSERT')
        or has_table_privilege(roles.role_name, relations.relation_name, 'UPDATE')
        or has_table_privilege(roles.role_name, relations.relation_name, 'DELETE')
    ) as browser_roles_blocked_from_payment_tables,
    exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and indexname = 'org_payment_connections_active_terminal_key'
        and indexdef ilike 'create unique index%'
        and indexdef ilike '%where (status = ''active''%'
    ) as active_terminal_unique_index_present,
    exists (
      select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = 'org_payment_connections'
        and t.tgname = 'audit_payment_connection_change'
        and not t.tgisinternal
        and t.tgenabled <> 'D'
    ) as connection_audit_trigger_active,
    exists (select 1 from pg_extension where extname = 'pg_cron')
      and exists (
        select 1
        from cron.job
        where jobname = 'impactify-payment-pii-cleanup'
          and schedule = '17 2 * * *'
          and btrim(command) = 'select public.cleanup_payment_checkout_pii();'
          and active
      ) as cleanup_cron_active,
    (
      select count(*)
      from (
        select provider, lower(btrim(terminal_id))
        from public.org_payment_connections
        where status = 'active'
        group by provider, lower(btrim(terminal_id))
        having count(*) > 1
      ) duplicates
    ) as duplicate_active_terminal_count,
    (
      select count(*)
      from public.payment_checkout_sessions
      where status = 'pending' and expires_at < now()
    ) as expired_pending_session_count,
    (
      select count(*)
      from public.payment_checkout_sessions
      where status in ('expired', 'failed')
        and (
          customer_email <> '' or customer_name <> '' or customer_address <> ''
          or customer_city <> '' or customer_zip <> '' or customer_country <> ''
        )
    ) as expired_session_pii_count,
    (
      select count(*)
      from public.payment_checkout_sessions
      where status = 'completed'
        and completed_at < now() - interval '7 days'
        and (
          customer_email <> '' or customer_name <> '' or customer_address <> ''
          or customer_city <> '' or customer_zip <> '' or customer_country <> ''
        )
    ) as old_completed_session_pii_count,
    (
      select count(*)
      from public.api_rate_limit_buckets
      where updated_at < now() - interval '1 day'
    ) as stale_rate_limit_bucket_count
  from function_oids f
)
select
  latest_security_migrations_installed
    and payment_tables_exist
    and tenant_rpcs_secured
    and service_rpcs_secured
    and rpc_grants_correct
    and payment_tables_have_rls
    and browser_roles_blocked_from_payment_tables
    and active_terminal_unique_index_present
    and connection_audit_trigger_active
    and cleanup_cron_active
    and duplicate_active_terminal_count = 0
    and expired_pending_session_count = 0
    and expired_session_pii_count = 0
    and old_completed_session_pii_count = 0
    and stale_rate_limit_bucket_count = 0
    as all_checks_pass,
  checks.*
from checks;
