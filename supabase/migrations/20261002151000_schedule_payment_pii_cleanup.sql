do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise exception 'Enable the Supabase Cron pg_cron module before applying this migration';
  end if;
end;
$$;

select cron.unschedule(jobid)
from cron.job
where jobname = 'impactify-payment-pii-cleanup';

select cron.schedule(
  'impactify-payment-pii-cleanup',
  '17 2 * * *',
  $job$select public.cleanup_payment_checkout_pii();$job$
);

insert into supabase_migrations.schema_migrations(version, name)
values ('20261002151000', 'schedule_payment_pii_cleanup')
on conflict (version) do nothing;
