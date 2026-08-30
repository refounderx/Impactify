-- Refunds are queued for an operator/PSP integration; donation ledger rows remain immutable.
create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null unique references public.donations(id) on delete restrict,
  org_id uuid not null references public.organizations(id) on delete restrict,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'processed', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists refund_requests_org_created_idx
  on public.refund_requests(org_id, created_at desc);

alter table public.refund_requests enable row level security;
revoke all on public.refund_requests from anon, authenticated;
