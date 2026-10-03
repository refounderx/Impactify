-- The original cleanup function could expire a session without consulting the
-- provider. Requeue only rows that carry definitive proof that no provider
-- lookup was ever recorded. PII remains scrubbed.
update public.payment_checkout_sessions
set reconciliation_status = 'retry'
where status = 'expired'
  and reconciliation_status = 'not_found'
  and reconciliation_attempts = 0
  and reconciliation_checked_at is null
  and provider_transaction_id is null;

insert into supabase_migrations.schema_migrations(version, name)
values ('20261003120000', 'requeue_unverified_reconciliation')
on conflict (version) do nothing;
