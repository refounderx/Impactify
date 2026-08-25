-- Authenticated NGO campaign media and persisted video playback URLs.
alter table public.campaigns add column if not exists video_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campaign-media',
  'campaign-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "campaign_media_public_read" on storage.objects;
drop policy if exists "campaign_media_ngo_insert" on storage.objects;
drop policy if exists "campaign_media_ngo_delete" on storage.objects;

create policy "campaign_media_public_read" on storage.objects
  for select using (bucket_id = 'campaign-media');

create policy "campaign_media_ngo_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'campaign-media'
    and public.current_app_role() = 'ngo_owner'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy "campaign_media_ngo_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'campaign-media'
    and public.current_app_role() = 'ngo_owner'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop function if exists public.publish_campaign(text, text, text, text, numeric, date, uuid[]);

create function public.publish_campaign(
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
  v_user uuid := auth.uid();
  v_org uuid;
  v_campaign uuid;
  v_distinct_count integer;
begin
  select org_id into v_org from public.profiles
  where id = v_user and app_role = 'ngo_owner' and onboarding_completed_at is not null;
  if v_org is null then raise exception 'NGO owner access required'; end if;
  if nullif(trim(p_title), '') is null or length(trim(p_title)) > 180 then
    raise exception 'Campaign title is required and must be at most 180 characters';
  end if;
  if nullif(trim(p_category), '') is null then raise exception 'Category is required'; end if;
  if p_goal is null or p_goal <= 0 or p_goal > 100000000 then raise exception 'Invalid goal'; end if;
  if p_end_date is not null and p_end_date < current_date then raise exception 'End date must be today or later'; end if;
  if p_hero_image_url is not null and p_hero_image_url !~ '^https://' then raise exception 'Invalid campaign image URL'; end if;
  if p_video_url is not null and p_video_url !~ '^https://' then raise exception 'Invalid campaign video URL'; end if;
  select count(distinct product_id) into v_distinct_count from unnest(p_product_ids) product_id;
  if v_distinct_count <> cardinality(p_product_ids) then raise exception 'Duplicate product IDs are not allowed'; end if;
  if exists (
    select 1 from unnest(p_product_ids) requested(product_id)
    left join public.products p on p.id = requested.product_id and p.org_id = v_org and p.active
    where p.id is null
  ) then raise exception 'Products must be active and owned by the NGO'; end if;

  insert into public.campaigns (
    title, short_desc, story, org_id, category, goal, end_date, status, hero_image_url, video_url
  ) values (
    trim(p_title), nullif(trim(p_short_desc), ''), nullif(trim(p_story), ''),
    v_org, trim(p_category), p_goal, p_end_date, 'active', p_hero_image_url, p_video_url
  ) returning id into v_campaign;

  insert into public.campaign_products (campaign_id, product_id)
  select v_campaign, product_id from unnest(p_product_ids) product_id;
  return v_campaign;
end $$;

revoke all on function public.publish_campaign(text, text, text, text, numeric, date, uuid[], text, text)
  from public, anon, authenticated;
grant execute on function public.publish_campaign(text, text, text, text, numeric, date, uuid[], text, text)
  to authenticated;
