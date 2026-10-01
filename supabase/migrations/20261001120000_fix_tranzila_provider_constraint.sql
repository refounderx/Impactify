-- Repair databases where terminal kinds were applied before the earlier
-- Tranzila-provider migration. This permits the existing Tranzila connection
-- RPC and regular/token terminal rows without reintroducing Gamma.
alter table public.org_payment_connections
  drop constraint if exists org_payment_connections_provider_check;

alter table public.org_payment_connections
  add constraint org_payment_connections_provider_check
  check (provider in ('cardcom', 'grow', 'tranzila'));
