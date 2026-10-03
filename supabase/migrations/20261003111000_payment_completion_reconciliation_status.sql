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
  update public.payment_checkout_sessions
  set status='completed', provider_transaction_id=p_transaction_id,
      donation_id=created_id, receipt_id=p_receipt_id, completed_at=now(),
      reconciliation_status='completed', reconciliation_checked_at=now()
  where reference=p_reference;
  return query select created_id,p_receipt_id;
end $$;

revoke all on function public.complete_verified_checkout(uuid,bigint,text,text,text) from public,anon,authenticated;
grant execute on function public.complete_verified_checkout(uuid,bigint,text,text,text) to service_role;

insert into supabase_migrations.schema_migrations(version, name)
values ('20261003111000', 'payment_completion_reconciliation_status')
on conflict (version) do nothing;
