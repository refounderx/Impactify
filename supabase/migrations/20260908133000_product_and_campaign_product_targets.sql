-- A product has its own standalone target. A campaign target is derived from
-- the selected products and their per-campaign required quantities.
alter table public.products
  add column if not exists global_target_quantity integer not null default 1
  check (global_target_quantity > 0);

drop function if exists public.create_ngo_product(text, text, text, text, numeric, text);
create function public.create_ngo_product(
  p_name text, p_name_en text, p_description text, p_description_en text,
  p_price numeric, p_emoji text, p_global_target_quantity integer default 1
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
  insert into public.products (org_id, name, name_en, description, description_en, price, emoji, global_target_quantity)
  values (v_org, trim(p_name), nullif(trim(p_name_en), ''), nullif(trim(p_description), ''), nullif(trim(p_description_en), ''), p_price, nullif(trim(p_emoji), ''), p_global_target_quantity)
  returning id into v_product;
  return v_product;
end $$;

drop function if exists public.update_ngo_product(uuid, text, text, text, text, numeric, text, boolean);
create function public.update_ngo_product(
  p_product_id uuid, p_name text, p_name_en text, p_description text,
  p_description_en text, p_price numeric, p_emoji text, p_active boolean,
  p_global_target_quantity integer
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_org uuid;
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
  update public.products set
    name = trim(p_name), name_en = nullif(trim(p_name_en), ''),
    description = nullif(trim(p_description), ''), description_en = nullif(trim(p_description_en), ''),
    price = p_price, emoji = nullif(trim(p_emoji), ''), active = p_active,
    global_target_quantity = p_global_target_quantity
  where id = p_product_id and org_id = v_org;
  if not found then raise exception 'Product not found'; end if;
  return p_product_id;
end $$;

drop function if exists public.publish_campaign(text, text, text, text, numeric, date, uuid[], text, text, text);
create function public.publish_campaign(
  p_title text, p_short_desc text, p_story text, p_category text, p_goal numeric,
  p_end_date date, p_product_ids uuid[] default '{}', p_hero_image_url text default null,
  p_video_url text default null, p_goal_type text default 'deadline',
  p_product_quantities integer[] default '{}'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_campaign uuid; v_goal numeric;
begin
  select org_id into v_org from public.profiles
  where id = auth.uid() and app_role = 'ngo_owner' and onboarding_completed_at is not null;
  if v_org is null then raise exception 'NGO owner access required'; end if;
  if nullif(trim(p_title), '') is null or length(trim(p_title)) > 180 then raise exception 'Campaign title is required and must be at most 180 characters'; end if;
  if nullif(trim(p_category), '') is null then raise exception 'Category is required'; end if;
  if p_goal_type not in ('deadline', 'monthly', 'annual') then raise exception 'Invalid campaign goal type'; end if;
  if p_goal_type = 'deadline' and p_end_date is null then raise exception 'An end date is required for a deadline target'; end if;
  if p_goal_type <> 'deadline' and p_end_date is not null then raise exception 'Periodic targets cannot have an end date'; end if;
  if p_end_date is not null and p_end_date < current_date then raise exception 'End date must be today or later'; end if;
  if p_hero_image_url is not null and p_hero_image_url !~ '^https://' then raise exception 'Invalid campaign image URL'; end if;
  if p_video_url is not null and p_video_url !~ '^https://' then raise exception 'Invalid campaign video URL'; end if;
  if cardinality(p_product_ids) = 0 then raise exception 'A campaign requires at least one product'; end if;
  if cardinality(p_product_ids) <> cardinality(p_product_quantities) then raise exception 'Each campaign product requires a quantity'; end if;
  if (select count(distinct product_id) from unnest(p_product_ids) product_id) <> cardinality(p_product_ids) then raise exception 'Duplicate product IDs are not allowed'; end if;
  if exists (select 1 from unnest(p_product_quantities) quantity where quantity is null or quantity < 1 or quantity > 10000000) then raise exception 'Product quantities must be between 1 and 10000000'; end if;
  if exists (select 1 from unnest(p_product_ids) requested(product_id) left join public.products p on p.id = requested.product_id and p.org_id = v_org and p.active where p.id is null) then raise exception 'Products must be active and owned by the NGO'; end if;
  select sum(p.price * item.quantity) into v_goal
  from unnest(p_product_ids, p_product_quantities) as item(product_id, quantity)
  join public.products p on p.id = item.product_id;
  insert into public.campaigns (title, short_desc, story, org_id, category, goal, end_date, goal_type, status, hero_image_url, video_url)
  values (trim(p_title), nullif(trim(p_short_desc), ''), nullif(trim(p_story), ''), v_org, trim(p_category), v_goal, p_end_date, p_goal_type, 'active', p_hero_image_url, p_video_url)
  returning id into v_campaign;
  insert into public.campaign_products (campaign_id, product_id, required_quantity)
  select v_campaign, item.product_id, item.quantity from unnest(p_product_ids, p_product_quantities) as item(product_id, quantity);
  return v_campaign;
end $$;

drop function if exists public.update_campaign(uuid, text, text, text, text, numeric, date, uuid[], text, text, text);
create function public.update_campaign(
  p_campaign_id uuid, p_title text, p_short_desc text, p_story text, p_category text,
  p_goal numeric, p_end_date date, p_product_ids uuid[] default '{}',
  p_hero_image_url text default null, p_video_url text default null, p_goal_type text default 'deadline',
  p_product_quantities integer[] default '{}'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_existing_end_date date; v_goal numeric;
begin
  select org_id into v_org from public.profiles
  where id = auth.uid() and app_role = 'ngo_owner' and onboarding_completed_at is not null;
  if v_org is null then raise exception 'NGO owner access required'; end if;
  select end_date into v_existing_end_date from public.campaigns where id = p_campaign_id and org_id = v_org;
  if not found then raise exception 'Campaign not found'; end if;
  if nullif(trim(p_title), '') is null or length(trim(p_title)) > 180 then raise exception 'Campaign title is required and must be at most 180 characters'; end if;
  if nullif(trim(p_category), '') is null then raise exception 'Category is required'; end if;
  if p_goal_type not in ('deadline', 'monthly', 'annual') then raise exception 'Invalid campaign goal type'; end if;
  if p_goal_type = 'deadline' and p_end_date is null then raise exception 'An end date is required for a deadline target'; end if;
  if p_goal_type <> 'deadline' and p_end_date is not null then raise exception 'Periodic targets cannot have an end date'; end if;
  if p_end_date is not null and p_end_date < current_date and p_end_date is distinct from v_existing_end_date then raise exception 'End date must be today or later'; end if;
  if p_hero_image_url is not null and p_hero_image_url !~ '^https://' then raise exception 'Invalid campaign image URL'; end if;
  if p_video_url is not null and p_video_url !~ '^https://' then raise exception 'Invalid campaign video URL'; end if;
  if cardinality(p_product_ids) = 0 then raise exception 'A campaign requires at least one product'; end if;
  if cardinality(p_product_ids) <> cardinality(p_product_quantities) then raise exception 'Each campaign product requires a quantity'; end if;
  if (select count(distinct product_id) from unnest(p_product_ids) product_id) <> cardinality(p_product_ids) then raise exception 'Duplicate product IDs are not allowed'; end if;
  if exists (select 1 from unnest(p_product_quantities) quantity where quantity is null or quantity < 1 or quantity > 10000000) then raise exception 'Product quantities must be between 1 and 10000000'; end if;
  if exists (select 1 from unnest(p_product_ids) requested(product_id) left join public.products product on product.id = requested.product_id and product.org_id = v_org and product.active where product.id is null) then raise exception 'Products must be active and owned by the NGO'; end if;
  select sum(p.price * item.quantity) into v_goal
  from unnest(p_product_ids, p_product_quantities) as item(product_id, quantity)
  join public.products p on p.id = item.product_id;
  update public.campaigns set
    title = trim(p_title), short_desc = nullif(trim(p_short_desc), ''), story = nullif(trim(p_story), ''),
    category = trim(p_category), goal = v_goal, end_date = p_end_date, goal_type = p_goal_type,
    hero_image_url = p_hero_image_url, video_url = p_video_url, updated_at = now()
  where id = p_campaign_id and org_id = v_org;
  delete from public.campaign_products where campaign_id = p_campaign_id;
  insert into public.campaign_products (campaign_id, product_id, required_quantity)
  select p_campaign_id, item.product_id, item.quantity from unnest(p_product_ids, p_product_quantities) as item(product_id, quantity);
  return p_campaign_id;
end $$;

create or replace function public.get_campaign_product_progress(p_campaign_id uuid, p_product_id uuid)
returns table (required_quantity integer, donated_quantity bigint, raised numeric)
language sql stable security definer set search_path = public as $$
  select cp.required_quantity,
    coalesce(sum(d.quantity), 0)::bigint,
    coalesce(sum(d.amount), 0)::numeric
  from public.campaign_products cp
  join public.campaigns c on c.id = cp.campaign_id and c.status = 'active'
  left join public.donations d on d.campaign_id = cp.campaign_id
    and d.product_id = cp.product_id and d.status = 'completed'
  where cp.campaign_id = p_campaign_id and cp.product_id = p_product_id
  group by cp.required_quantity;
$$;

revoke all on function public.create_ngo_product(text, text, text, text, numeric, text, integer) from public, anon, authenticated;
grant execute on function public.create_ngo_product(text, text, text, text, numeric, text, integer) to authenticated;
revoke all on function public.update_ngo_product(uuid, text, text, text, text, numeric, text, boolean, integer) from public, anon, authenticated;
grant execute on function public.update_ngo_product(uuid, text, text, text, text, numeric, text, boolean, integer) to authenticated;
revoke all on function public.publish_campaign(text, text, text, text, numeric, date, uuid[], text, text, text, integer[]) from public, anon, authenticated;
grant execute on function public.publish_campaign(text, text, text, text, numeric, date, uuid[], text, text, text, integer[]) to authenticated;
revoke all on function public.update_campaign(uuid, text, text, text, text, numeric, date, uuid[], text, text, text, integer[]) from public, anon, authenticated;
grant execute on function public.update_campaign(uuid, text, text, text, text, numeric, date, uuid[], text, text, text, integer[]) to authenticated;
revoke all on function public.get_campaign_product_progress(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_campaign_product_progress(uuid, uuid) to anon, authenticated;
