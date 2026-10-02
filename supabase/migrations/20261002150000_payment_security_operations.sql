create unique index if not exists org_payment_connections_active_terminal_key
  on public.org_payment_connections(provider, lower(btrim(terminal_id)))
  where status = 'active';

create table if not exists public.payment_connection_audit (
  id bigint generated always as identity primary key,
  connection_id uuid,
  org_id uuid not null,
  provider text not null,
  connection_kind text not null,
  previous_status text,
  new_status text not null,
  terminal_changed boolean not null default false,
  actor_id uuid,
  source_role text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists payment_connection_audit_connection_idx
  on public.payment_connection_audit(connection_id, created_at desc);

alter table public.payment_connection_audit enable row level security;
revoke all on public.payment_connection_audit from public, anon, authenticated;

create table if not exists public.api_rate_limit_buckets (
  scope text not null,
  bucket_key text not null check (bucket_key ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (scope, bucket_key)
);

alter table public.api_rate_limit_buckets enable row level security;
revoke all on public.api_rate_limit_buckets from public, anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_scope text,
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  if length(p_scope) not between 3 and 80 or p_bucket_key !~ '^[a-f0-9]{64}$'
    or p_limit not between 1 and 10000 or p_window_seconds not between 1 and 86400 then
    raise exception 'invalid rate-limit input';
  end if;

  insert into public.api_rate_limit_buckets(scope, bucket_key, window_start, request_count)
  values (p_scope, p_bucket_key, now(), 1)
  on conflict (scope, bucket_key) do update
  set request_count = case
        when public.api_rate_limit_buckets.window_start <= now() - make_interval(secs => p_window_seconds)
          then 1
        else public.api_rate_limit_buckets.request_count + 1
      end,
      window_start = case
        when public.api_rate_limit_buckets.window_start <= now() - make_interval(secs => p_window_seconds)
          then now()
        else public.api_rate_limit_buckets.window_start
      end,
      updated_at = now()
  returning request_count into v_count;
  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role;

create or replace function public.audit_payment_connection_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.payment_connection_audit(
      connection_id, org_id, provider, connection_kind, previous_status,
      new_status, terminal_changed, actor_id, source_role, reason
    ) values (
      new.id, new.org_id, new.provider, new.connection_kind,
      null, new.status, false,
      auth.uid(), coalesce(auth.role(), current_user), null
    );
  elsif old.status is distinct from new.status
    or old.terminal_id is distinct from new.terminal_id then
    insert into public.payment_connection_audit(
      connection_id, org_id, provider, connection_kind, previous_status,
      new_status, terminal_changed, actor_id, source_role, reason
    ) values (
      new.id, new.org_id, new.provider, new.connection_kind,
      old.status, new.status, old.terminal_id is distinct from new.terminal_id,
      auth.uid(), coalesce(auth.role(), current_user), null
    );
  end if;
  return new;
end;
$$;

revoke all on function public.audit_payment_connection_change() from public, anon, authenticated;

drop trigger if exists audit_payment_connection_change on public.org_payment_connections;
create trigger audit_payment_connection_change
after insert or update of terminal_id, status on public.org_payment_connections
for each row execute function public.audit_payment_connection_change();

create or replace function public.set_payment_connection_status(
  p_connection_id uuid,
  p_status text,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_connection public.org_payment_connections%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  if p_status not in ('active', 'disabled', 'failed') then raise exception 'unsupported status'; end if;
  if length(btrim(coalesce(p_reason, ''))) not between 3 and 200 then raise exception 'reason required'; end if;

  select * into v_connection
  from public.org_payment_connections
  where id = p_connection_id
  for update;
  if not found then return false; end if;
  if v_connection.status = p_status then return true; end if;

  update public.org_payment_connections
  set status = p_status,
      last_verified_at = case when p_status = 'active' then now() else last_verified_at end,
      updated_at = now()
  where id = p_connection_id;

  update public.payment_connection_audit
  set reason = btrim(p_reason)
  where id = (
    select id from public.payment_connection_audit
    where connection_id = p_connection_id
    order by created_at desc, id desc
    limit 1
  );
  return true;
end;
$$;

revoke all on function public.set_payment_connection_status(uuid, text, text) from public, anon, authenticated;
grant execute on function public.set_payment_connection_status(uuid, text, text) to service_role;

create or replace function public.cleanup_payment_checkout_pii()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  update public.payment_checkout_sessions
  set customer_email = '', customer_name = '', customer_address = '',
      customer_city = '', customer_zip = '', customer_country = '',
      status = case when status = 'pending' then 'expired' else status end
  where (
      (status = 'pending' and expires_at < now())
      or status in ('failed', 'expired')
      or (status = 'completed' and completed_at < now() - interval '7 days')
    ) and (
      customer_email <> '' or customer_name <> '' or customer_address <> ''
      or customer_city <> '' or customer_zip <> '' or customer_country <> ''
    );
  get diagnostics v_rows = row_count;
  delete from public.api_rate_limit_buckets where updated_at < now() - interval '1 day';
  return v_rows;
end;
$$;

revoke all on function public.cleanup_payment_checkout_pii() from public, anon, authenticated;
grant execute on function public.cleanup_payment_checkout_pii() to service_role;

insert into supabase_migrations.schema_migrations(version, name)
values ('20261002150000', 'payment_security_operations')
on conflict (version) do nothing;
