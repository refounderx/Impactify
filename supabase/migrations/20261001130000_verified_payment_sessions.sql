create table if not exists public.payment_checkout_sessions (
  reference uuid primary key,
  provider text not null check (provider in ('tranzila')),
  terminal_id text not null,
  org_id uuid not null references public.organizations(id),
  campaign_id uuid references public.campaigns(id),
  product_id uuid references public.products(id),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'ILS',
  customer_email text not null,
  customer_name text not null,
  customer_address text not null,
  customer_city text not null,
  customer_zip text not null,
  customer_country text not null,
  status text not null default 'pending' check (status in ('pending','completed','failed','expired')),
  provider_transaction_id bigint unique,
  donation_id uuid unique references public.donations(id),
  receipt_id text,
  registration_opt_in_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  completed_at timestamptz
);

create index if not exists payment_checkout_sessions_recent_org_idx
  on public.payment_checkout_sessions(org_id, created_at desc);
alter table public.payment_checkout_sessions enable row level security;
revoke all on public.payment_checkout_sessions from public, anon, authenticated;

create or replace function public.complete_verified_checkout(
  p_reference uuid, p_transaction_id bigint, p_receipt_id text,
  p_last_four text default null, p_card_brand text default null
) returns table(donation_id uuid, receipt_id text)
language plpgsql security definer set search_path=public as $$
declare s public.payment_checkout_sessions%rowtype; created_id uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  select * into s from public.payment_checkout_sessions where reference=p_reference for update;
  if not found or s.expires_at < now() then raise exception 'checkout session unavailable'; end if;
  if s.status='completed' then return query select s.donation_id, s.receipt_id; return; end if;
  if s.status <> 'pending' then raise exception 'checkout session is not pending'; end if;
  if exists(select 1 from public.payment_checkout_sessions where provider_transaction_id=p_transaction_id and reference<>p_reference) then
    raise exception 'transaction already consumed';
  end if;
  insert into public.donations(
    donor_id,campaign_id,org_id,amount,currency,status,is_recurring,dedication_name,dedication_message,
    donor_name,community_id,psp_token,last_four,card_brand,receipt_id,receipt_url,product_id,donation_type,quantity
  ) values (
    null,s.campaign_id,s.org_id,s.amount,s.currency,'completed',false,null,null,
    s.customer_name,null,null,p_last_four,p_card_brand,p_receipt_id,null,s.product_id,
    case when s.product_id is null then 'one_time' else 'product' end,1
  ) returning id into created_id;
  update public.payment_checkout_sessions set status='completed',provider_transaction_id=p_transaction_id,
    donation_id=created_id,receipt_id=p_receipt_id,completed_at=now() where reference=p_reference;
  return query select created_id,p_receipt_id;
end $$;

revoke all on function public.complete_verified_checkout(uuid,bigint,text,text,text) from public,anon,authenticated;
grant execute on function public.complete_verified_checkout(uuid,bigint,text,text,text) to service_role;

create table if not exists public.donor_contact_details (
  donor_id uuid primary key references auth.users(id) on delete cascade,
  address text not null, city text not null, zip text not null, country text not null,
  updated_at timestamptz not null default now()
);
alter table public.donor_contact_details enable row level security;
create policy donor_contact_owner_select on public.donor_contact_details for select to authenticated using (donor_id=auth.uid());
create policy donor_contact_owner_update on public.donor_contact_details for update to authenticated using (donor_id=auth.uid()) with check (donor_id=auth.uid());
revoke all on public.donor_contact_details from public,anon;
grant select,update on public.donor_contact_details to authenticated;

create or replace function public.claim_verified_donation(p_donation_id uuid) returns boolean
language plpgsql security definer set search_path=public as $$
declare s public.payment_checkout_sessions%rowtype; account_email text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  account_email := lower(coalesce(auth.jwt()->>'email',''));
  select * into s from public.payment_checkout_sessions
    where donation_id=p_donation_id and status='completed' and registration_opt_in_at is not null for update;
  if not found or account_email <> lower(s.customer_email) then raise exception 'donation claim denied'; end if;
  update public.donations set donor_id=auth.uid(),donor_name=s.customer_name
    where id=p_donation_id and donor_id is null;
  update public.profiles set full_name=coalesce(nullif(full_name,''),s.customer_name) where id=auth.uid();
  insert into public.donor_contact_details(donor_id,address,city,zip,country)
    values(auth.uid(),s.customer_address,s.customer_city,s.customer_zip,s.customer_country)
    on conflict(donor_id) do update set address=excluded.address,city=excluded.city,zip=excluded.zip,country=excluded.country,updated_at=now();
  update public.payment_checkout_sessions set customer_email='',customer_name='',customer_address='',
    customer_city='',customer_zip='',customer_country='' where reference=s.reference;
  return true;
end $$;
revoke all on function public.claim_verified_donation(uuid) from public,anon;
grant execute on function public.claim_verified_donation(uuid) to authenticated;
