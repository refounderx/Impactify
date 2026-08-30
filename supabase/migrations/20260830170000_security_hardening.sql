-- Restrict browser roles to read-only financial views and narrow RPCs.

drop policy if exists "donations_insert" on public.donations;
revoke insert, update, delete, select on public.donations from anon, authenticated;
grant select (
  id, donor_id, campaign_id, org_id, amount, currency, status, is_recurring,
  dedication_name, dedication_message, donor_name, community_id, last_four,
  card_brand, receipt_id, receipt_url, created_at, product_id, donation_type, quantity
) on public.donations to authenticated;

revoke insert, update, delete, select on public.recurring_donations from anon, authenticated;
grant select (
  id, donor_id, campaign_id, org_id, amount, status, next_charge_date,
  start_date, created_at, updated_at
) on public.recurring_donations to authenticated;

create or replace function public.set_my_recurring_donation_status(
  p_recurring_id uuid,
  p_status text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_status not in ('active', 'paused', 'cancelled') then
    raise exception 'Invalid recurring donation status';
  end if;

  update public.recurring_donations
  set status = p_status::public.recurring_status, updated_at = now()
  where id = p_recurring_id
    and donor_id = auth.uid()
    and status <> 'cancelled';

  if not found then raise exception 'Recurring donation not found'; end if;
end
$$;

revoke all on function public.set_my_recurring_donation_status(uuid, text)
  from public, anon, authenticated;
grant execute on function public.set_my_recurring_donation_status(uuid, text)
  to authenticated;

revoke insert, update, delete, select on public.payment_methods from anon, authenticated;
grant select (id, donor_id, brand, last_four, created_at)
  on public.payment_methods to authenticated;

create or replace function public.add_my_payment_method(
  p_brand text,
  p_last_four text
) returns table (id uuid, brand text, last_four text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_brand), '') is null or char_length(trim(p_brand)) > 40 then
    raise exception 'Invalid card brand';
  end if;
  if p_last_four !~ '^[0-9]{4}$' then raise exception 'Invalid last four digits'; end if;

  return query
  insert into public.payment_methods (donor_id, brand, last_four, psp_token)
  values (auth.uid(), trim(p_brand), p_last_four, null)
  returning payment_methods.id, payment_methods.brand, payment_methods.last_four;
end
$$;

create or replace function public.remove_my_payment_method(p_payment_method_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.payment_methods
  where id = p_payment_method_id and donor_id = auth.uid();
  return found;
end
$$;

revoke all on function public.add_my_payment_method(text, text)
  from public, anon, authenticated;
revoke all on function public.remove_my_payment_method(uuid)
  from public, anon, authenticated;
grant execute on function public.add_my_payment_method(text, text) to authenticated;
grant execute on function public.remove_my_payment_method(uuid) to authenticated;

-- Campaign and product mutations must go through tenant-derived RPCs.
revoke insert, update, delete on public.campaigns from anon, authenticated;
revoke insert, update, delete on public.products from anon, authenticated;
revoke insert, update, delete on public.campaign_products from anon, authenticated;

-- Public community reads do not need authentication IDs or referral secrets.
revoke select on public.communities from anon, authenticated;
grant select (id, name, name_en, description, org_id, total_raised, donors_count, created_at)
  on public.communities to anon, authenticated;
