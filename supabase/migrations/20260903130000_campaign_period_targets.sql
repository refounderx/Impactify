-- Campaign targets can run until a deadline, per calendar month, or per calendar year.
-- Historical campaign totals remain intact; the public progress function aggregates only
-- completed donations in the current target window.
alter table public.campaigns
  add column if not exists goal_type text not null default 'deadline'
  check (goal_type in ('deadline', 'monthly', 'annual'));

create index if not exists idx_donations_campaign_completed_created
  on public.donations (campaign_id, created_at)
  where status = 'completed';

create or replace function public.get_campaign_progress(p_campaign_ids uuid[])
returns table (
  campaign_id uuid,
  goal_type text,
  period_start date,
  period_end date,
  raised numeric,
  donors_count bigint
)
language sql stable security definer set search_path = public as $$
  with eligible_campaigns as (
    select c.*,
      timezone('Asia/Jerusalem', now())::date as local_today
    from public.campaigns c
    where c.id = any(p_campaign_ids)
      and (c.status = 'active' or c.org_id = public.current_org_id() or public.is_admin())
  ), windows as (
    select c.*,
      case c.goal_type
        when 'monthly' then date_trunc('month', c.local_today)::date
        when 'annual' then date_trunc('year', c.local_today)::date
        else timezone('Asia/Jerusalem', c.created_at)::date
      end as period_start,
      case c.goal_type
        when 'monthly' then (date_trunc('month', c.local_today) + interval '1 month - 1 day')::date
        when 'annual' then (date_trunc('year', c.local_today) + interval '1 year - 1 day')::date
        else c.end_date
      end as period_end
    from eligible_campaigns c
  )
  select w.id, w.goal_type, w.period_start, w.period_end,
    coalesce(sum(d.amount), 0)::numeric as raised,
    count(d.id)::bigint as donors_count
  from windows w
  left join public.donations d on d.campaign_id = w.id
    and d.status = 'completed'
    and d.created_at >= (w.period_start::timestamp at time zone 'Asia/Jerusalem')
    and (w.period_end is null or d.created_at < ((w.period_end + 1)::timestamp at time zone 'Asia/Jerusalem'))
  group by w.id, w.goal_type, w.period_start, w.period_end;
$$;

revoke all on function public.get_campaign_progress(uuid[]) from public, anon, authenticated;
grant execute on function public.get_campaign_progress(uuid[]) to anon, authenticated;

drop function if exists public.publish_campaign(text, text, text, text, numeric, date, uuid[], text, text);
create function public.publish_campaign(
  p_title text, p_short_desc text, p_story text, p_category text, p_goal numeric,
  p_end_date date, p_product_ids uuid[] default '{}', p_hero_image_url text default null,
  p_video_url text default null, p_goal_type text default 'deadline'
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_campaign uuid; v_distinct_count integer;
begin
  select org_id into v_org from public.profiles where id = auth.uid()
    and app_role = 'ngo_owner' and onboarding_completed_at is not null;
  if v_org is null then raise exception 'NGO owner access required'; end if;
  if nullif(trim(p_title), '') is null or length(trim(p_title)) > 180 then raise exception 'Campaign title is required and must be at most 180 characters'; end if;
  if nullif(trim(p_category), '') is null then raise exception 'Category is required'; end if;
  if p_goal is null or p_goal <= 0 or p_goal > 100000000 then raise exception 'Invalid goal'; end if;
  if p_goal_type not in ('deadline', 'monthly', 'annual') then raise exception 'Invalid campaign goal type'; end if;
  if p_goal_type = 'deadline' and p_end_date is null then raise exception 'An end date is required for a deadline target'; end if;
  if p_goal_type <> 'deadline' and p_end_date is not null then raise exception 'Periodic targets cannot have an end date'; end if;
  if p_end_date is not null and p_end_date < current_date then raise exception 'End date must be today or later'; end if;
  if p_hero_image_url is not null and p_hero_image_url !~ '^https://' then raise exception 'Invalid campaign image URL'; end if;
  if p_video_url is not null and p_video_url !~ '^https://' then raise exception 'Invalid campaign video URL'; end if;
  select count(distinct product_id) into v_distinct_count from unnest(p_product_ids) product_id;
  if v_distinct_count <> cardinality(p_product_ids) then raise exception 'Duplicate product IDs are not allowed'; end if;
  if exists (select 1 from unnest(p_product_ids) requested(product_id) left join public.products p on p.id = requested.product_id and p.org_id = v_org and p.active where p.id is null) then raise exception 'Products must be active and owned by the NGO'; end if;
  insert into public.campaigns (title, short_desc, story, org_id, category, goal, end_date, goal_type, status, hero_image_url, video_url)
  values (trim(p_title), nullif(trim(p_short_desc), ''), nullif(trim(p_story), ''), v_org, trim(p_category), p_goal, p_end_date, p_goal_type, 'active', p_hero_image_url, p_video_url)
  returning id into v_campaign;
  insert into public.campaign_products (campaign_id, product_id) select v_campaign, product_id from unnest(p_product_ids) product_id;
  return v_campaign;
end $$;

drop function if exists public.update_campaign(uuid, text, text, text, text, numeric, date, uuid[], text, text);
create function public.update_campaign(
  p_campaign_id uuid, p_title text, p_short_desc text, p_story text, p_category text,
  p_goal numeric, p_end_date date, p_product_ids uuid[] default '{}',
  p_hero_image_url text default null, p_video_url text default null, p_goal_type text default 'deadline'
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_existing_end_date date; v_distinct_count integer;
begin
  select org_id into v_org from public.profiles where id = auth.uid()
    and app_role = 'ngo_owner' and onboarding_completed_at is not null;
  if v_org is null then raise exception 'NGO owner access required'; end if;
  select end_date into v_existing_end_date from public.campaigns where id = p_campaign_id and org_id = v_org;
  if not found then raise exception 'Campaign not found'; end if;
  if nullif(trim(p_title), '') is null or length(trim(p_title)) > 180 then raise exception 'Campaign title is required and must be at most 180 characters'; end if;
  if nullif(trim(p_category), '') is null then raise exception 'Category is required'; end if;
  if p_goal is null or p_goal <= 0 or p_goal > 100000000 then raise exception 'Invalid goal'; end if;
  if p_goal_type not in ('deadline', 'monthly', 'annual') then raise exception 'Invalid campaign goal type'; end if;
  if p_goal_type = 'deadline' and p_end_date is null then raise exception 'An end date is required for a deadline target'; end if;
  if p_goal_type <> 'deadline' and p_end_date is not null then raise exception 'Periodic targets cannot have an end date'; end if;
  if p_end_date is not null and p_end_date < current_date and p_end_date is distinct from v_existing_end_date then raise exception 'End date must be today or later'; end if;
  if p_hero_image_url is not null and p_hero_image_url !~ '^https://' then raise exception 'Invalid campaign image URL'; end if;
  if p_video_url is not null and p_video_url !~ '^https://' then raise exception 'Invalid campaign video URL'; end if;
  select count(distinct product_id) into v_distinct_count from unnest(p_product_ids) product_id;
  if v_distinct_count <> cardinality(p_product_ids) then raise exception 'Duplicate product IDs are not allowed'; end if;
  if exists (select 1 from unnest(p_product_ids) requested(product_id) left join public.products product on product.id = requested.product_id and product.org_id = v_org and product.active where product.id is null) then raise exception 'Products must be active and owned by the NGO'; end if;
  update public.campaigns set title = trim(p_title), short_desc = nullif(trim(p_short_desc), ''), story = nullif(trim(p_story), ''), category = trim(p_category), goal = p_goal, end_date = p_end_date, goal_type = p_goal_type, hero_image_url = p_hero_image_url, video_url = p_video_url, updated_at = now() where id = p_campaign_id and org_id = v_org;
  delete from public.campaign_products where campaign_id = p_campaign_id;
  insert into public.campaign_products (campaign_id, product_id) select p_campaign_id, product_id from unnest(p_product_ids) product_id;
  return p_campaign_id;
end $$;

revoke all on function public.publish_campaign(text, text, text, text, numeric, date, uuid[], text, text, text) from public, anon, authenticated;
grant execute on function public.publish_campaign(text, text, text, text, numeric, date, uuid[], text, text, text) to authenticated;
revoke all on function public.update_campaign(uuid, text, text, text, text, numeric, date, uuid[], text, text, text) from public, anon, authenticated;
grant execute on function public.update_campaign(uuid, text, text, text, text, numeric, date, uuid[], text, text, text) to authenticated;
