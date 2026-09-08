begin;

alter table public.system_updates add column if not exists community_id uuid references public.communities(id);
create index if not exists idx_system_updates_community on public.system_updates(community_id, created_at desc) where community_id is not null;

create table if not exists public.community_updates (
  id uuid primary key default gen_random_uuid(), community_id uuid not null references public.communities(id) on delete cascade,
  audience text not null check (audience in ('all', 'campaigns')), target_ids uuid[] not null default '{}',
  channels text[] not null default '{push}' check (channels <@ array['push', 'email', 'sms']::text[]), timing text not null check (timing in ('now', 'scheduled', 'trigger')),
  scheduled_at timestamptz, trigger_type text check (trigger_type is null or trigger_type in ('donation', 'quantity', 'days')),
  title text not null check (length(btrim(title)) between 1 and 120), body text not null check (length(btrim(body)) between 1 and 2000),
  cta text not null default 'none' check (cta in ('none', 'addProduct', 'priceQty')), image_name text,
  status text not null default 'active' check (status in ('active', 'paused', 'sent')), sent_so_far integer not null default 0 check (sent_so_far >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.community_updates enable row level security;
create policy "community_updates_owner_read" on public.community_updates for select to authenticated using (community_id = public.current_community_id() and public.current_app_role() = 'community_owner');
revoke insert, update, delete on public.community_updates from anon, authenticated;
grant select on public.community_updates to authenticated;
create index if not exists idx_community_updates_community_created on public.community_updates(community_id, created_at desc);

create or replace function public.save_community_update(p_update_id uuid, p_audience text, p_target_ids uuid[], p_channels text[], p_timing text, p_scheduled_at timestamptz, p_trigger_type text, p_title text, p_body text, p_cta text, p_image_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_community uuid; v_id uuid; v_sent integer := 0;
begin
  select community_id into v_community from public.profiles where id = auth.uid() and app_role = 'community_owner' and onboarding_completed_at is not null;
  if v_community is null then raise exception 'Community owner access required'; end if;
  if p_audience not in ('all', 'campaigns') then raise exception 'Invalid audience'; end if;
  if p_audience = 'campaigns' and coalesce(cardinality(p_target_ids), 0) = 0 then raise exception 'Choose at least one campaign'; end if;
  if p_audience = 'campaigns' and exists (select 1 from unnest(p_target_ids) requested(id) left join public.community_campaigns cc on cc.campaign_id = requested.id and cc.community_id = v_community and cc.status in ('active', 'paused') where cc.campaign_id is null) then raise exception 'Campaign targets must be linked to your community'; end if;
  if coalesce(cardinality(p_channels), 0) = 0 or not (p_channels <@ array['push', 'email', 'sms']::text[]) or p_timing not in ('now', 'scheduled', 'trigger') then raise exception 'Invalid delivery settings'; end if;
  if nullif(btrim(p_title), '') is null or length(btrim(p_title)) > 120 or nullif(btrim(p_body), '') is null or length(btrim(p_body)) > 2000 then raise exception 'Invalid update content'; end if;
  if p_update_id is null then
    insert into public.community_updates (community_id, audience, target_ids, channels, timing, scheduled_at, trigger_type, title, body, cta, image_name) values (v_community, p_audience, coalesce(p_target_ids, '{}'), p_channels, p_timing, p_scheduled_at, case when p_timing = 'trigger' then p_trigger_type else null end, btrim(p_title), btrim(p_body), p_cta, nullif(btrim(p_image_name), '')) returning id into v_id;
    if p_timing = 'now' and 'push' = any(p_channels) then
      insert into public.system_updates (donor_id, community_id, title, detail) select distinct d.donor_id, v_community, btrim(p_title), btrim(p_body) from public.donations d where d.community_id = v_community and d.donor_id is not null and (p_audience = 'all' or d.campaign_id = any(p_target_ids));
      get diagnostics v_sent = row_count;
      update public.community_updates set status = 'sent', sent_so_far = v_sent, updated_at = now() where id = v_id;
    end if;
  else
    update public.community_updates set audience = p_audience, target_ids = coalesce(p_target_ids, '{}'), channels = p_channels, timing = p_timing, scheduled_at = p_scheduled_at, trigger_type = case when p_timing = 'trigger' then p_trigger_type else null end, title = btrim(p_title), body = btrim(p_body), cta = p_cta, image_name = nullif(btrim(p_image_name), ''), updated_at = now() where id = p_update_id and community_id = v_community returning id into v_id;
    if v_id is null then raise exception 'Update not found'; end if;
  end if;
  return v_id;
end $$;

create or replace function public.manage_community_update(p_update_id uuid, p_action text) returns uuid language plpgsql security definer set search_path = public as $$
declare v_community uuid; v_id uuid;
begin
  select community_id into v_community from public.profiles where id = auth.uid() and app_role = 'community_owner';
  if v_community is null then raise exception 'Community owner access required'; end if;
  if p_action = 'delete' then delete from public.community_updates where id = p_update_id and community_id = v_community returning id into v_id;
  elsif p_action in ('pause', 'resume') then update public.community_updates set status = case p_action when 'pause' then 'paused' else 'active' end, updated_at = now() where id = p_update_id and community_id = v_community and status <> 'sent' returning id into v_id;
  elsif p_action = 'duplicate' then insert into public.community_updates (community_id, audience, target_ids, channels, timing, scheduled_at, trigger_type, title, body, cta, image_name) select community_id, audience, target_ids, channels, timing, scheduled_at, trigger_type, title, body, cta, image_name from public.community_updates where id = p_update_id and community_id = v_community returning id into v_id;
  else raise exception 'Invalid action'; end if;
  if v_id is null then raise exception 'Update not found or action not allowed'; end if;
  return v_id;
end $$;

revoke all on function public.save_community_update(uuid, text, uuid[], text[], text, timestamptz, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.save_community_update(uuid, text, uuid[], text[], text, timestamptz, text, text, text, text, text) to authenticated;
revoke all on function public.manage_community_update(uuid, text) from public, anon, authenticated;
grant execute on function public.manage_community_update(uuid, text) to authenticated;
commit;
