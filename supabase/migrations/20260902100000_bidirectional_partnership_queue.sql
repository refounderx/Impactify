begin;

create table public.partnership_requests (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  initiator_type text not null check (initiator_type in ('community', 'organization')),
  status text not null default 'queued' check (status in ('queued', 'active_review', 'approved', 'rejected', 'cancelled')),
  review_slot smallint check (review_slot between 1 and 3),
  requested_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  promoted_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null,
  cancelled_at timestamptz,
  last_notified_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((status = 'active_review' and review_slot is not null) or (status <> 'active_review' and review_slot is null))
);

create table public.partnership_request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.partnership_requests(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'promoted', 'approved', 'rejected', 'cancelled', 'mutual_interest', 'digest_notified')),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.partnership_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_type text not null check (recipient_type in ('community', 'organization')),
  recipient_id uuid not null,
  digest_date date not null,
  total_waiting integer not null check (total_waiting >= 0),
  new_waiting integer not null check (new_waiting >= 0),
  channel text not null default 'in_app' check (channel = 'in_app'),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_type, recipient_id, digest_date)
);

create unique index partnership_requests_one_open_pair
  on public.partnership_requests(community_id, campaign_id)
  where status in ('queued', 'active_review');
create unique index partnership_requests_community_slots
  on public.partnership_requests(community_id, review_slot)
  where initiator_type = 'organization' and status = 'active_review';
create unique index partnership_requests_org_slots
  on public.partnership_requests(org_id, review_slot)
  where initiator_type = 'community' and status = 'active_review';
create index partnership_requests_recipient_queue on public.partnership_requests(initiator_type, community_id, org_id, status, requested_at, id);
create index partnership_request_events_request on public.partnership_request_events(request_id, created_at);
create index partnership_notifications_recipient on public.partnership_notifications(recipient_type, recipient_id, created_at desc);

alter table public.partnership_requests enable row level security;
alter table public.partnership_request_events enable row level security;
alter table public.partnership_notifications enable row level security;
revoke all on public.partnership_requests, public.partnership_request_events, public.partnership_notifications from anon, authenticated;

create policy "Partnership notification recipients can read their digests"
on public.partnership_notifications
for select
to authenticated
using (
  (recipient_type = 'community' and recipient_id = public.current_community_id() and public.current_app_role() = 'community_owner')
  or
  (recipient_type = 'organization' and recipient_id = public.current_org_id() and public.current_app_role() = 'ngo_owner')
);

grant select on public.partnership_notifications to authenticated;

create or replace function public.refill_partnership_queue(p_recipient_type text, p_recipient_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_needed integer; v_count integer;
begin
  if p_recipient_type not in ('community', 'organization') then raise exception 'Invalid recipient'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_recipient_type || ':' || p_recipient_id::text, 0));
  select 3 - count(*) into v_needed from public.partnership_requests
  where status = 'active_review'
    and ((p_recipient_type = 'community' and initiator_type = 'organization' and community_id = p_recipient_id)
      or (p_recipient_type = 'organization' and initiator_type = 'community' and org_id = p_recipient_id));
  if v_needed <= 0 then return 0; end if;
  with slots as (
    select slot, row_number() over (order by slot) as rn from generate_series(1, 3) slot
    where not exists (select 1 from public.partnership_requests r where r.status = 'active_review' and r.review_slot = slot
      and ((p_recipient_type = 'community' and r.initiator_type = 'organization' and r.community_id = p_recipient_id)
        or (p_recipient_type = 'organization' and r.initiator_type = 'community' and r.org_id = p_recipient_id)))
    order by slot limit v_needed
  ), locked as (
    select id, requested_at from public.partnership_requests
    where status = 'queued'
      and ((p_recipient_type = 'community' and initiator_type = 'organization' and community_id = p_recipient_id)
        or (p_recipient_type = 'organization' and initiator_type = 'community' and org_id = p_recipient_id))
    order by requested_at, id for update skip locked limit v_needed
  ), queued as (
    select id, row_number() over (order by requested_at, id) as rn from locked
  ), promoted as (
    update public.partnership_requests r set status = 'active_review', review_slot = slots.slot, promoted_at = now(), updated_at = now()
    from queued join slots on slots.rn = queued.rn where r.id = queued.id returning r.id
  )
  insert into public.partnership_request_events(request_id, event_type) select id, 'promoted' from promoted;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

create or replace function public.create_partnership_request(p_campaign_id uuid, p_initiator_type text, p_community_id uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_community uuid; v_request uuid; v_existing uuid; v_rejected_at timestamptz;
begin
  if p_initiator_type not in ('community', 'organization') then raise exception 'Invalid initiator'; end if;
  select org_id into v_org from public.campaigns where id = p_campaign_id and status = 'active';
  if v_org is null then raise exception 'Campaign not available'; end if;
  if p_initiator_type = 'community' then
    select community_id into v_community from public.profiles where id = auth.uid() and app_role = 'community_owner' and onboarding_completed_at is not null;
    if v_community is null then raise exception 'Community owner access required'; end if;
  else
    if not exists (select 1 from public.profiles where id = auth.uid() and app_role = 'ngo_owner' and org_id = v_org and onboarding_completed_at is not null) then raise exception 'NGO owner access required'; end if;
    v_community := p_community_id;
    if v_community is null or not exists (select 1 from public.communities where id = v_community) then raise exception 'Community not found'; end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_community::text || ':' || p_campaign_id::text, 0));
  if exists (select 1 from public.community_campaigns where community_id = v_community and campaign_id = p_campaign_id and status in ('active', 'paused')) then raise exception 'Partnership already exists'; end if;
  select id into v_existing from public.partnership_requests where community_id = v_community and campaign_id = p_campaign_id and status in ('queued', 'active_review') for update;
  if v_existing is not null then
    if exists (select 1 from public.partnership_requests where id = v_existing and initiator_type <> p_initiator_type) then
      update public.partnership_requests set status = 'approved', review_slot = null, decided_at = now(), decided_by = auth.uid(), updated_at = now() where id = v_existing;
      insert into public.community_campaigns(community_id, campaign_id, status, source) values(v_community, p_campaign_id, 'active', 'linked') on conflict (community_id, campaign_id) do update set status = 'active', updated_at = now();
      insert into public.partnership_request_events(request_id, event_type, actor_id) values(v_existing, 'mutual_interest', auth.uid()), (v_existing, 'approved', auth.uid());
      perform public.refill_partnership_queue(case when p_initiator_type = 'community' then 'organization' else 'community' end, case when p_initiator_type = 'community' then v_org else v_community end);
      return v_existing;
    end if;
    return v_existing;
  end if;
  select decided_at into v_rejected_at from public.partnership_requests where community_id = v_community and campaign_id = p_campaign_id and initiator_type = p_initiator_type and status = 'rejected' order by decided_at desc limit 1;
  if v_rejected_at is not null and v_rejected_at > now() - interval '30 days' then raise exception 'A new request can be sent 30 days after rejection'; end if;
  insert into public.partnership_requests(community_id, campaign_id, org_id, initiator_type, requested_by)
  values(v_community, p_campaign_id, v_org, p_initiator_type, auth.uid()) returning id into v_request;
  insert into public.partnership_request_events(request_id, event_type, actor_id) values(v_request, 'created', auth.uid());
  perform public.refill_partnership_queue(case when p_initiator_type = 'community' then 'organization' else 'community' end, case when p_initiator_type = 'community' then v_org else v_community end);
  return v_request;
end $$;

create or replace function public.decide_partnership_request(p_request_id uuid, p_action text)
returns text language plpgsql security definer set search_path = public as $$
declare r public.partnership_requests; v_recipient text; v_recipient_id uuid; v_status text;
begin
  if p_action not in ('approve', 'reject') then raise exception 'Invalid decision'; end if;
  select * into r from public.partnership_requests where id = p_request_id and status in ('queued', 'active_review') for update;
  if not found then raise exception 'Request not found'; end if;
  v_recipient := case when r.initiator_type = 'community' then 'organization' else 'community' end;
  v_recipient_id := case when r.initiator_type = 'community' then r.org_id else r.community_id end;
  if (v_recipient = 'organization' and not exists (select 1 from public.profiles where id = auth.uid() and app_role = 'ngo_owner' and org_id = r.org_id))
    or (v_recipient = 'community' and not exists (select 1 from public.profiles where id = auth.uid() and app_role = 'community_owner' and community_id = r.community_id)) then raise exception 'Decision access denied'; end if;
  v_status := case when p_action = 'approve' then 'approved' else 'rejected' end;
  update public.partnership_requests set status = v_status, review_slot = null, decided_at = now(), decided_by = auth.uid(), updated_at = now() where id = r.id;
  if p_action = 'approve' then insert into public.community_campaigns(community_id, campaign_id, status, source) values(r.community_id, r.campaign_id, 'active', 'linked') on conflict (community_id, campaign_id) do update set status = 'active', updated_at = now(); end if;
  insert into public.partnership_request_events(request_id, event_type, actor_id) values(r.id, case when p_action = 'approve' then 'approved' else 'rejected' end, auth.uid());
  perform public.refill_partnership_queue(v_recipient, v_recipient_id);
  return v_status;
end $$;

create or replace function public.cancel_partnership_request(p_request_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare r public.partnership_requests; v_recipient text; v_recipient_id uuid;
begin
  select * into r from public.partnership_requests where id = p_request_id and status in ('queued', 'active_review') for update;
  if not found then raise exception 'Request not found'; end if;
  if (r.initiator_type = 'community' and not exists (select 1 from public.profiles where id = auth.uid() and app_role = 'community_owner' and community_id = r.community_id))
    or (r.initiator_type = 'organization' and not exists (select 1 from public.profiles where id = auth.uid() and app_role = 'ngo_owner' and org_id = r.org_id)) then raise exception 'Cancellation access denied'; end if;
  v_recipient := case when r.initiator_type = 'community' then 'organization' else 'community' end;
  v_recipient_id := case when r.initiator_type = 'community' then r.org_id else r.community_id end;
  update public.partnership_requests set status = 'cancelled', review_slot = null, cancelled_at = now(), updated_at = now() where id = r.id;
  insert into public.partnership_request_events(request_id, event_type, actor_id) values(r.id, 'cancelled', auth.uid());
  perform public.refill_partnership_queue(v_recipient, v_recipient_id);
  return 'cancelled';
end $$;

create or replace function public.get_partnership_requests(p_view text)
returns table(id uuid, community_id uuid, community_name text, campaign_id uuid, campaign_title text, org_id uuid, org_name text, initiator_type text, status text, requested_at timestamptz, promoted_at timestamptz, review_slot smallint)
language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_community uuid; v_role public.app_role;
begin
  select app_role, org_id, community_id into v_role, v_org, v_community from public.profiles where id = auth.uid();
  if v_role = 'ngo_owner' then
    return query select r.id,r.community_id,c.name,r.campaign_id,ca.title,r.org_id,o.name,r.initiator_type,r.status,r.requested_at,r.promoted_at,r.review_slot from public.partnership_requests r join public.communities c on c.id=r.community_id join public.campaigns ca on ca.id=r.campaign_id join public.organizations o on o.id=r.org_id
    where r.org_id=v_org and ((p_view='inbox' and r.initiator_type='community' and r.status='active_review') or (p_view='backlog' and r.initiator_type='community' and r.status='queued') or (p_view='sent' and r.initiator_type='organization')) order by r.requested_at;
  elsif v_role = 'community_owner' then
    return query select r.id,r.community_id,c.name,r.campaign_id,ca.title,r.org_id,o.name,r.initiator_type,r.status,r.requested_at,r.promoted_at,r.review_slot from public.partnership_requests r join public.communities c on c.id=r.community_id join public.campaigns ca on ca.id=r.campaign_id join public.organizations o on o.id=r.org_id
    where r.community_id=v_community and ((p_view='inbox' and r.initiator_type='organization' and r.status='active_review') or (p_view='backlog' and r.initiator_type='organization' and r.status='queued') or (p_view='sent' and r.initiator_type='community')) order by r.requested_at;
  else raise exception 'Partnership access required'; end if;
end $$;

create or replace function public.create_partnership_daily_digests()
returns integer language plpgsql security definer set search_path = public as $$
declare rec record; v_total integer; v_new integer; v_count integer := 0; v_date date := (now() at time zone 'Asia/Jerusalem')::date;
begin
  for rec in select 'community'::text recipient_type, community_id recipient_id from public.partnership_requests where initiator_type='organization' group by community_id
             union select 'organization'::text, org_id from public.partnership_requests where initiator_type='community' group by org_id loop
    perform public.refill_partnership_queue(rec.recipient_type, rec.recipient_id);
    select count(*), count(*) filter (where last_notified_at is null) into v_total, v_new from public.partnership_requests where status='active_review' and ((rec.recipient_type='community' and initiator_type='organization' and community_id=rec.recipient_id) or (rec.recipient_type='organization' and initiator_type='community' and org_id=rec.recipient_id));
    if v_total > 0 then
      insert into public.partnership_notifications(recipient_type,recipient_id,digest_date,total_waiting,new_waiting) values(rec.recipient_type,rec.recipient_id,v_date,v_total,v_new) on conflict do nothing;
      update public.partnership_requests set last_notified_at=now() where status='active_review' and last_notified_at is null and ((rec.recipient_type='community' and initiator_type='organization' and community_id=rec.recipient_id) or (rec.recipient_type='organization' and initiator_type='community' and org_id=rec.recipient_id));
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end $$;

-- Schedule at 08:00 in the database timezone when pg_cron is enabled. The
-- function remains callable by a server-side scheduler if this extension is
-- unavailable in an environment.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'impactify-partnership-daily-digest') then
      perform cron.schedule('impactify-partnership-daily-digest', '0 8 * * *', 'select public.create_partnership_daily_digests()');
    end if;
  end if;
exception when undefined_table or insufficient_privilege then
  raise notice 'pg_cron is unavailable; invoke public.create_partnership_daily_digests() from the server scheduler.';
end $$;

insert into public.partnership_requests(community_id,campaign_id,org_id,initiator_type,status,review_slot,requested_at,promoted_at,decided_at,updated_at)
select cc.community_id,cc.campaign_id,c.org_id,'community',case when cc.status='pending' then 'queued' else 'rejected' end,null,cc.requested_at,null,case when cc.status='rejected' then cc.updated_at else null end,cc.updated_at
from public.community_campaigns cc join public.campaigns c on c.id=cc.campaign_id where cc.status in ('pending','rejected');
insert into public.partnership_request_events(request_id,event_type) select id,case when status='rejected' then 'rejected' else 'created' end from public.partnership_requests;
delete from public.community_campaigns where status in ('pending','rejected');
do $$ declare rec record; begin
  for rec in select distinct org_id from public.partnership_requests where initiator_type='community' and status='queued' loop
    perform public.refill_partnership_queue('organization',rec.org_id);
  end loop;
end $$;
alter table public.community_campaigns drop constraint if exists community_campaigns_status_check;
alter table public.community_campaigns add constraint community_campaigns_status_check check (status in ('active','paused'));
alter table public.communities drop column if exists org_id;

create or replace function public.set_community_campaign(p_campaign_id uuid, p_action text)
returns text language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_status text;
begin
  if p_action='request' then select public.create_partnership_request(p_campaign_id,'community') into v_id; return 'requested';
  elsif p_action='cancel' then select id into v_id from public.partnership_requests where campaign_id=p_campaign_id and initiator_type='community' and requested_by=auth.uid() and status in ('queued','active_review') order by requested_at desc limit 1; if v_id is null then raise exception 'Request not found'; end if; return public.cancel_partnership_request(v_id);
  elsif p_action in ('pause','resume') then update public.community_campaigns set status=case when p_action='pause' then 'paused' else 'active' end, updated_at=now() where community_id=public.current_community_id() and campaign_id=p_campaign_id and status in ('active','paused') returning status into v_status; if v_status is null then raise exception 'Partnership not found'; end if; return v_status;
  else raise exception 'Invalid action'; end if;
end $$;

create or replace function public.manage_ngo_campaign_request(p_community_id uuid,p_campaign_id uuid,p_action text)
returns text language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from public.partnership_requests where community_id=p_community_id and campaign_id=p_campaign_id and initiator_type='community' and status in ('queued','active_review') order by requested_at limit 1;
  if v_id is null then raise exception 'Request not found'; end if;
  return public.decide_partnership_request(v_id,p_action);
end $$;

create or replace function public.invite_communities_to_campaign(p_campaign_id uuid,p_community_ids uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare v_community uuid; v_count integer := 0;
begin
  if coalesce(cardinality(p_community_ids),0)=0 then return 0; end if;
  if cardinality(p_community_ids) <> (select count(distinct id) from unnest(p_community_ids) requested(id)) then raise exception 'Duplicate community IDs are not allowed'; end if;
  foreach v_community in array p_community_ids loop perform public.create_partnership_request(p_campaign_id,'organization',v_community); v_count:=v_count+1; end loop;
  return v_count;
end $$;

revoke all on function public.refill_partnership_queue(text,uuid), public.create_partnership_request(uuid,text,uuid), public.decide_partnership_request(uuid,text), public.cancel_partnership_request(uuid), public.get_partnership_requests(text), public.create_partnership_daily_digests() from public,anon,authenticated;
grant execute on function public.create_partnership_request(uuid,text,uuid), public.decide_partnership_request(uuid,text), public.cancel_partnership_request(uuid), public.get_partnership_requests(text), public.set_community_campaign(uuid,text), public.manage_ngo_campaign_request(uuid,uuid,text), public.invite_communities_to_campaign(uuid,uuid[]) to authenticated;

insert into supabase_migrations.schema_migrations(version,name) values ('20260902100000','bidirectional_partnership_queue') on conflict do nothing;
commit;
