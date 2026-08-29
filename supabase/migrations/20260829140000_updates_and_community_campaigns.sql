begin;

create table if not exists public.ngo_updates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  audience text not null check (audience in ('all', 'campaigns', 'products')),
  target_ids uuid[] not null default '{}',
  channels text[] not null default '{push}' check (channels <@ array['push', 'email', 'sms']::text[]),
  timing text not null check (timing in ('now', 'scheduled', 'trigger')),
  scheduled_at timestamptz,
  trigger_type text check (trigger_type is null or trigger_type in ('donation', 'quantity', 'days')),
  title text not null check (length(btrim(title)) between 1 and 120),
  body text not null check (length(btrim(body)) between 1 and 2000),
  cta text not null default 'none' check (cta in ('none', 'addProduct', 'priceQty')),
  image_name text,
  status text not null default 'active' check (status in ('active', 'paused', 'sent')),
  sent_so_far integer not null default 0 check (sent_so_far >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ngo_updates enable row level security;
create policy "ngo_updates_org_read" on public.ngo_updates for select to authenticated
  using (org_id = public.current_org_id() and public.current_app_role() = 'ngo_owner');
revoke insert, update, delete on public.ngo_updates from anon, authenticated;
grant select on public.ngo_updates to authenticated;
create index if not exists idx_ngo_updates_org_created on public.ngo_updates(org_id, created_at desc);

create table if not exists public.community_campaigns (
  community_id uuid not null references public.communities(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'paused', 'rejected')),
  source text not null default 'linked' check (source in ('created', 'linked')),
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (community_id, campaign_id)
);

alter table public.community_campaigns enable row level security;
create policy "community_campaigns_community_read" on public.community_campaigns for select to authenticated
  using (community_id = public.current_community_id() and public.current_app_role() = 'community_owner');
revoke insert, update, delete on public.community_campaigns from anon, authenticated;
grant select on public.community_campaigns to authenticated;
create index if not exists idx_community_campaigns_campaign on public.community_campaigns(campaign_id);

create policy "campaigns_community_members_read" on public.campaigns for select to authenticated
  using (exists (
    select 1 from public.community_campaigns cc
    where cc.campaign_id = id and cc.community_id = public.current_community_id()
  ));

insert into public.community_campaigns (community_id, campaign_id, status, source)
select community.id, campaign.id, 'active', 'linked'
from public.communities community
join public.campaigns campaign on campaign.org_id = community.org_id
where community.org_id is not null
on conflict (community_id, campaign_id) do nothing;

create or replace function public.save_ngo_update(
  p_update_id uuid, p_audience text, p_target_ids uuid[], p_channels text[],
  p_timing text, p_scheduled_at timestamptz, p_trigger_type text,
  p_title text, p_body text, p_cta text, p_image_name text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_id uuid; v_sent integer := 0;
begin
  select org_id into v_org from public.profiles
  where id = auth.uid() and app_role = 'ngo_owner' and onboarding_completed_at is not null;
  if v_org is null then raise exception 'NGO owner access required'; end if;
  if p_audience not in ('all', 'campaigns', 'products') then raise exception 'Invalid audience'; end if;
  if p_audience <> 'all' and coalesce(cardinality(p_target_ids), 0) = 0 then raise exception 'Choose at least one target'; end if;
  if p_audience = 'campaigns' and exists (
    select 1 from unnest(p_target_ids) requested(id)
    left join public.campaigns campaign on campaign.id = requested.id and campaign.org_id = v_org
    where campaign.id is null
  ) then raise exception 'Campaign targets must belong to your organization'; end if;
  if p_audience = 'products' and exists (
    select 1 from unnest(p_target_ids) requested(id)
    left join public.products product on product.id = requested.id and product.org_id = v_org
    where product.id is null
  ) then raise exception 'Product targets must belong to your organization'; end if;
  if coalesce(cardinality(p_channels), 0) = 0 or not (p_channels <@ array['push', 'email', 'sms']::text[]) then raise exception 'Invalid channels'; end if;
  if p_timing not in ('now', 'scheduled', 'trigger') then raise exception 'Invalid timing'; end if;
  if nullif(btrim(p_title), '') is null or length(btrim(p_title)) > 120 then raise exception 'Title must be 1-120 characters'; end if;
  if nullif(btrim(p_body), '') is null or length(btrim(p_body)) > 2000 then raise exception 'Body must be 1-2000 characters'; end if;

  if p_update_id is null then
    insert into public.ngo_updates (org_id, audience, target_ids, channels, timing, scheduled_at, trigger_type, title, body, cta, image_name)
    values (v_org, p_audience, coalesce(p_target_ids, '{}'), p_channels, p_timing, p_scheduled_at,
      case when p_timing = 'trigger' then p_trigger_type else null end, btrim(p_title), btrim(p_body), p_cta, nullif(btrim(p_image_name), ''))
    returning id into v_id;
    if p_timing = 'now' and 'push' = any(p_channels) then
      insert into public.system_updates (donor_id, org_id, title, detail)
      select distinct d.donor_id, v_org, btrim(p_title), btrim(p_body)
      from public.donations d
      where d.org_id = v_org and d.donor_id is not null and (
        p_audience = 'all' or (p_audience = 'campaigns' and d.campaign_id = any(p_target_ids)) or
        (p_audience = 'products' and d.product_id = any(p_target_ids))
      );
      get diagnostics v_sent = row_count;
      update public.ngo_updates set status = 'sent', sent_so_far = v_sent, updated_at = now() where id = v_id;
    end if;
  else
    update public.ngo_updates set audience = p_audience, target_ids = coalesce(p_target_ids, '{}'), channels = p_channels,
      timing = p_timing, scheduled_at = p_scheduled_at, trigger_type = case when p_timing = 'trigger' then p_trigger_type else null end,
      title = btrim(p_title), body = btrim(p_body), cta = p_cta, image_name = nullif(btrim(p_image_name), ''), updated_at = now()
    where id = p_update_id and org_id = v_org returning id into v_id;
    if v_id is null then raise exception 'Update not found'; end if;
  end if;
  return v_id;
end $$;

create or replace function public.manage_ngo_update(p_update_id uuid, p_action text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_id uuid;
begin
  select org_id into v_org from public.profiles where id = auth.uid() and app_role = 'ngo_owner';
  if v_org is null then raise exception 'NGO owner access required'; end if;
  if p_action = 'delete' then delete from public.ngo_updates where id = p_update_id and org_id = v_org returning id into v_id;
  elsif p_action in ('pause', 'resume') then
    update public.ngo_updates set status = case p_action when 'pause' then 'paused' else 'active' end, updated_at = now()
    where id = p_update_id and org_id = v_org and status <> 'sent' returning id into v_id;
  elsif p_action = 'duplicate' then
    insert into public.ngo_updates (org_id, audience, target_ids, channels, timing, scheduled_at, trigger_type, title, body, cta, image_name)
    select org_id, audience, target_ids, channels, timing, scheduled_at, trigger_type, title, body, cta, image_name
    from public.ngo_updates where id = p_update_id and org_id = v_org returning id into v_id;
  else raise exception 'Invalid action'; end if;
  if v_id is null then raise exception 'Update not found or action not allowed'; end if;
  return v_id;
end $$;

create or replace function public.set_community_campaign(p_campaign_id uuid, p_action text)
returns text language plpgsql security definer set search_path = public as $$
declare v_community uuid; v_status text;
begin
  select community_id into v_community from public.profiles
  where id = auth.uid() and app_role = 'community_owner' and onboarding_completed_at is not null;
  if v_community is null then raise exception 'Community owner access required'; end if;
  if not exists (select 1 from public.campaigns where id = p_campaign_id and status = 'active') then raise exception 'Campaign not available'; end if;
  if p_action = 'request' then
    if exists (select 1 from public.community_campaigns where community_id = v_community and campaign_id = p_campaign_id and status in ('active', 'paused')) then
      raise exception 'Community is already joined to this campaign';
    end if;
    insert into public.community_campaigns (community_id, campaign_id, status, source)
    values (v_community, p_campaign_id, 'pending', 'linked')
    on conflict (community_id, campaign_id) do update set status = 'pending', updated_at = now()
    returning status into v_status;
  elsif p_action = 'cancel' then
    delete from public.community_campaigns where community_id = v_community and campaign_id = p_campaign_id and status = 'pending'
    returning 'cancelled' into v_status;
  elsif p_action in ('pause', 'resume') then
    update public.community_campaigns set status = case p_action when 'pause' then 'paused' else 'active' end, updated_at = now()
    where community_id = v_community and campaign_id = p_campaign_id and status in ('active', 'paused') returning status into v_status;
  else raise exception 'Invalid action'; end if;
  if v_status is null then raise exception 'Campaign relationship not found or action not allowed'; end if;
  return v_status;
end $$;

revoke all on function public.save_ngo_update(uuid, text, uuid[], text[], text, timestamptz, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.save_ngo_update(uuid, text, uuid[], text[], text, timestamptz, text, text, text, text, text) to authenticated;
revoke all on function public.manage_ngo_update(uuid, text) from public, anon, authenticated;
grant execute on function public.manage_ngo_update(uuid, text) to authenticated;
revoke all on function public.set_community_campaign(uuid, text) from public, anon, authenticated;
grant execute on function public.set_community_campaign(uuid, text) to authenticated;

insert into supabase_migrations.schema_migrations(version, name)
values ('20260829140000', 'updates_and_community_campaigns') on conflict (version) do nothing;

commit;
