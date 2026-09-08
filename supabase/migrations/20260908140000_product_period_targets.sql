-- Standalone products can use the same target periods as campaigns.
alter table public.products
  add column if not exists global_target_goal_type text not null default 'annual'
  check (global_target_goal_type in ('deadline', 'monthly', 'annual')),
  add column if not exists global_target_end_date date;

drop function if exists public.get_product_progress(uuid[]);
create function public.get_product_progress(p_product_ids uuid[])
returns table (
  product_id uuid,
  goal_type text,
  period_start date,
  period_end date,
  raised numeric,
  donated_quantity bigint,
  donors_count bigint
)
language sql stable security definer set search_path = public as $$
  with eligible_products as (
    select p.*, timezone('Asia/Jerusalem', now())::date as local_today
    from public.products p
    where p.id = any(p_product_ids) and p.active
  ), windows as (
    select p.*,
      case p.global_target_goal_type
        when 'monthly' then date_trunc('month', p.local_today)::date
        when 'annual' then date_trunc('year', p.local_today)::date
        else timezone('Asia/Jerusalem', p.created_at)::date
      end as period_start,
      case p.global_target_goal_type
        when 'monthly' then (date_trunc('month', p.local_today) + interval '1 month - 1 day')::date
        when 'annual' then (date_trunc('year', p.local_today) + interval '1 year - 1 day')::date
        else p.global_target_end_date
      end as period_end
    from eligible_products p
  )
  select w.id, w.global_target_goal_type, w.period_start, w.period_end,
    coalesce(sum(d.amount), 0)::numeric,
    coalesce(sum(d.quantity), 0)::bigint,
    count(distinct d.donor_id) filter (where d.donor_id is not null)::bigint
  from windows w
  left join public.donations d on d.product_id = w.id
    and d.status = 'completed'
    and d.created_at >= (w.period_start::timestamp at time zone 'Asia/Jerusalem')
    and (w.period_end is null or d.created_at < ((w.period_end + 1)::timestamp at time zone 'Asia/Jerusalem'))
  group by w.id, w.global_target_goal_type, w.period_start, w.period_end;
$$;

drop function if exists public.create_ngo_product(text, text, text, text, numeric, text, integer);
create function public.create_ngo_product(
  p_name text, p_name_en text, p_description text, p_description_en text,
  p_price numeric, p_emoji text, p_global_target_quantity integer default 1,
  p_global_target_goal_type text default 'annual', p_global_target_end_date date default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_product uuid;
begin
  select org_id into v_org from public.profiles
  where id = auth.uid() and app_role = 'ngo_owner' and onboarding_completed_at is not null;
  if v_org is null then raise exception 'NGO owner access required'; end if;
  if nullif(trim(p_name), '') is null or length(trim(p_name)) > 120 then raise exception 'Product name is required and must be at most 120 characters'; end if;
  if p_name_en is not null and length(trim(p_name_en)) > 120 then raise exception 'English product name must be at most 120 characters'; end if;
  if p_description is not null and length(trim(p_description)) > 1000 then raise exception 'Description must be at most 1000 characters'; end if;
  if p_description_en is not null and length(trim(p_description_en)) > 1000 then raise exception 'English description must be at most 1000 characters'; end if;
  if p_price is null or p_price <= 0 or p_price > 10000000 then raise exception 'Price must be greater than zero and at most 10000000'; end if;
  if p_emoji is not null and length(trim(p_emoji)) > 16 then raise exception 'Emoji must be at most 16 characters'; end if;
  if p_global_target_quantity is null or p_global_target_quantity < 1 or p_global_target_quantity > 10000000 then raise exception 'Global target quantity must be between 1 and 10000000'; end if;
  if p_global_target_goal_type not in ('deadline', 'monthly', 'annual') then raise exception 'Invalid product target type'; end if;
  if p_global_target_goal_type = 'deadline' and p_global_target_end_date is null then raise exception 'An end date is required for a deadline target'; end if;
  if p_global_target_goal_type <> 'deadline' and p_global_target_end_date is not null then raise exception 'Periodic targets cannot have an end date'; end if;
  if p_global_target_end_date is not null and p_global_target_end_date < current_date then raise exception 'End date must be today or later'; end if;
  insert into public.products (org_id, name, name_en, description, description_en, price, emoji, global_target_quantity, global_target_goal_type, global_target_end_date)
  values (v_org, trim(p_name), nullif(trim(p_name_en), ''), nullif(trim(p_description), ''), nullif(trim(p_description_en), ''), p_price, nullif(trim(p_emoji), ''), p_global_target_quantity, p_global_target_goal_type, p_global_target_end_date)
  returning id into v_product;
  return v_product;
end $$;

drop function if exists public.update_ngo_product(uuid, text, text, text, text, numeric, text, boolean, integer);
create function public.update_ngo_product(
  p_product_id uuid, p_name text, p_name_en text, p_description text,
  p_description_en text, p_price numeric, p_emoji text, p_active boolean,
  p_global_target_quantity integer, p_global_target_goal_type text,
  p_global_target_end_date date
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_existing_end_date date;
begin
  select org_id into v_org from public.profiles
  where id = auth.uid() and app_role = 'ngo_owner' and onboarding_completed_at is not null;
  if v_org is null then raise exception 'NGO owner access required'; end if;
  select global_target_end_date into v_existing_end_date from public.products where id = p_product_id and org_id = v_org;
  if not found then raise exception 'Product not found'; end if;
  if nullif(trim(p_name), '') is null or length(trim(p_name)) > 120 then raise exception 'Product name is required and must be at most 120 characters'; end if;
  if p_name_en is not null and length(trim(p_name_en)) > 120 then raise exception 'English product name must be at most 120 characters'; end if;
  if p_description is not null and length(trim(p_description)) > 1000 then raise exception 'Description must be at most 1000 characters'; end if;
  if p_description_en is not null and length(trim(p_description_en)) > 1000 then raise exception 'English description must be at most 1000 characters'; end if;
  if p_price is null or p_price <= 0 or p_price > 10000000 then raise exception 'Price must be greater than zero and at most 10000000'; end if;
  if p_emoji is not null and length(trim(p_emoji)) > 16 then raise exception 'Emoji must be at most 16 characters'; end if;
  if p_global_target_quantity is null or p_global_target_quantity < 1 or p_global_target_quantity > 10000000 then raise exception 'Global target quantity must be between 1 and 10000000'; end if;
  if p_global_target_goal_type not in ('deadline', 'monthly', 'annual') then raise exception 'Invalid product target type'; end if;
  if p_global_target_goal_type = 'deadline' and p_global_target_end_date is null then raise exception 'An end date is required for a deadline target'; end if;
  if p_global_target_goal_type <> 'deadline' and p_global_target_end_date is not null then raise exception 'Periodic targets cannot have an end date'; end if;
  if p_global_target_end_date is not null and p_global_target_end_date < current_date and p_global_target_end_date is distinct from v_existing_end_date then raise exception 'End date must be today or later'; end if;
  update public.products set
    name = trim(p_name), name_en = nullif(trim(p_name_en), ''),
    description = nullif(trim(p_description), ''), description_en = nullif(trim(p_description_en), ''),
    price = p_price, emoji = nullif(trim(p_emoji), ''), active = p_active,
    global_target_quantity = p_global_target_quantity,
    global_target_goal_type = p_global_target_goal_type,
    global_target_end_date = p_global_target_end_date
  where id = p_product_id and org_id = v_org;
  return p_product_id;
end $$;

revoke all on function public.get_product_progress(uuid[]) from public, anon, authenticated;
grant execute on function public.get_product_progress(uuid[]) to anon, authenticated;
revoke all on function public.create_ngo_product(text, text, text, text, numeric, text, integer, text, date) from public, anon, authenticated;
grant execute on function public.create_ngo_product(text, text, text, text, numeric, text, integer, text, date) to authenticated;
revoke all on function public.update_ngo_product(uuid, text, text, text, text, numeric, text, boolean, integer, text, date) from public, anon, authenticated;
grant execute on function public.update_ngo_product(uuid, text, text, text, text, numeric, text, boolean, integer, text, date) to authenticated;
