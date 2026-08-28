-- Atomically update an NGO-owned campaign and its product links.
create or replace function public.update_campaign(
  p_campaign_id uuid,
  p_title text,
  p_short_desc text,
  p_story text,
  p_category text,
  p_goal numeric,
  p_end_date date,
  p_product_ids uuid[] default '{}',
  p_hero_image_url text default null,
  p_video_url text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_existing_end_date date;
  v_distinct_count integer;
begin
  select org_id into v_org from public.profiles
  where id = auth.uid() and app_role = 'ngo_owner' and onboarding_completed_at is not null;
  if v_org is null then raise exception 'NGO owner access required'; end if;

  select end_date into v_existing_end_date from public.campaigns
  where id = p_campaign_id and org_id = v_org;
  if not found then raise exception 'Campaign not found'; end if;

  if nullif(trim(p_title), '') is null or length(trim(p_title)) > 180 then
    raise exception 'Campaign title is required and must be at most 180 characters';
  end if;
  if nullif(trim(p_category), '') is null then raise exception 'Category is required'; end if;
  if p_goal is null or p_goal <= 0 or p_goal > 100000000 then raise exception 'Invalid goal'; end if;
  if p_end_date is not null and p_end_date < current_date and p_end_date is distinct from v_existing_end_date then
    raise exception 'End date must be today or later';
  end if;
  if p_hero_image_url is not null and p_hero_image_url !~ '^https://' then
    raise exception 'Invalid campaign image URL';
  end if;
  if p_video_url is not null and p_video_url !~ '^https://' then
    raise exception 'Invalid campaign video URL';
  end if;

  select count(distinct product_id) into v_distinct_count from unnest(p_product_ids) product_id;
  if v_distinct_count <> cardinality(p_product_ids) then
    raise exception 'Duplicate product IDs are not allowed';
  end if;
  if exists (
    select 1 from unnest(p_product_ids) requested(product_id)
    left join public.products product
      on product.id = requested.product_id and product.org_id = v_org and product.active
    where product.id is null
  ) then
    raise exception 'Products must be active and owned by the NGO';
  end if;

  update public.campaigns set
    title = trim(p_title),
    short_desc = nullif(trim(p_short_desc), ''),
    story = nullif(trim(p_story), ''),
    category = trim(p_category),
    goal = p_goal,
    end_date = p_end_date,
    hero_image_url = p_hero_image_url,
    video_url = p_video_url,
    updated_at = now()
  where id = p_campaign_id and org_id = v_org;

  delete from public.campaign_products where campaign_id = p_campaign_id;
  insert into public.campaign_products (campaign_id, product_id)
  select p_campaign_id, product_id from unnest(p_product_ids) product_id;
  return p_campaign_id;
end $$;

revoke all on function public.update_campaign(uuid, text, text, text, text, numeric, date, uuid[], text, text)
  from public, anon, authenticated;
grant execute on function public.update_campaign(uuid, text, text, text, text, numeric, date, uuid[], text, text)
  to authenticated;
