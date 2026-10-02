begin;

do $$
declare
  v_user uuid;
  v_org uuid;
  v_connection public.org_payment_connections%rowtype;
  v_foreign_connection_count integer;
  v_cross_tenant_count integer;
  v_status text;
  v_qa_terminal text := 'impactify-security-qa-' || gen_random_uuid()::text;
begin
  if not exists (
    select 1 from supabase_migrations.schema_migrations
    where version = '20261002160000'
  ) then
    raise exception 'Apply migration 20261002160000 before running payment tenant QA';
  end if;
  if has_table_privilege('authenticated', 'public.org_payment_connections', 'SELECT')
    or has_table_privilege('authenticated', 'public.org_payment_connections', 'INSERT')
    or has_table_privilege('authenticated', 'public.org_payment_connections', 'UPDATE')
    or has_table_privilege('authenticated', 'public.org_payment_connections', 'DELETE') then
    raise exception 'authenticated has direct payment-connection table access';
  end if;
  if has_table_privilege('authenticated', 'public.payment_checkout_sessions', 'SELECT')
    or has_table_privilege('authenticated', 'public.payment_connection_audit', 'SELECT')
    or has_table_privilege('authenticated', 'public.api_rate_limit_buckets', 'SELECT') then
    raise exception 'authenticated has direct payment security table access';
  end if;
  if has_function_privilege('authenticated', 'public.set_payment_connection_status(uuid,text,text)', 'EXECUTE') then
    raise exception 'authenticated can execute the trusted status function';
  end if;
  if has_function_privilege('authenticated', 'public.consume_api_rate_limit(text,text,integer,integer)', 'EXECUTE') then
    raise exception 'authenticated can execute the global rate limiter';
  end if;
  if not has_function_privilege('authenticated', 'public.get_ngo_payment_connections()', 'EXECUTE') then
    raise exception 'authenticated cannot execute the tenant-scoped read function';
  end if;

  select id, org_id into v_user, v_org
  from public.profiles
  where app_role = 'ngo_owner'
    and org_id is not null
    and onboarding_completed_at is not null
  order by created_at
  limit 1;
  if v_user is null then raise exception 'QA requires one onboarded NGO owner'; end if;

  select count(*) into v_foreign_connection_count
  from public.org_payment_connections
  where org_id <> v_org;
  if v_foreign_connection_count = 0 then
    raise exception 'QA requires a payment connection belonging to a second organization';
  end if;

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_user, 'role', 'authenticated')::text,
    true
  );

  select count(*) into v_cross_tenant_count
  from public.get_ngo_payment_connections() visible
  join public.org_payment_connections stored on stored.id = visible.id
  where stored.org_id <> v_org;
  if v_cross_tenant_count <> 0 then raise exception 'cross-tenant payment connections returned'; end if;

  select * into v_connection
  from public.org_payment_connections
  where org_id = v_org
  order by created_at
  limit 1;

  begin
    perform public.set_payment_connection_status(
      coalesce(v_connection.id, gen_random_uuid()), 'active', 'authenticated QA probe'
    );
    raise exception 'authenticated caller unexpectedly changed payment status';
  exception when others then
    if sqlerrm = 'authenticated caller unexpectedly changed payment status' then raise; end if;
    if position('service role required' in sqlerrm) = 0 then
      raise exception 'unexpected status-function failure: %', sqlerrm;
    end if;
  end;

  if v_connection.id is not null then
    update public.org_payment_connections set status = 'active' where id = v_connection.id;
    perform public.start_ngo_payment_connection(
      v_connection.provider, v_connection.terminal_id, v_connection.connection_kind
    );
    select status into v_status from public.org_payment_connections where id = v_connection.id;
    if v_status <> 'active' then raise exception 'unchanged terminal lost its active status'; end if;

    perform public.start_ngo_payment_connection(
      v_connection.provider, v_qa_terminal, v_connection.connection_kind
    );
    select status into v_status from public.org_payment_connections where id = v_connection.id;
    if v_status <> 'setup_required' then raise exception 'retargeted terminal stayed active'; end if;
  end if;

  raise notice 'payment tenant-isolation QA passed';
end;
$$;

rollback;
