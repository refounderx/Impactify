-- Secure volunteer management and durable supporter attribution.
create table public.supporter_organizations (
  supporter_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  first_source text not null check (first_source in ('donation','volunteer')),
  first_seen_at timestamptz not null default now(),
  primary key (supporter_id, org_id)
);
create table public.supporter_communities (
  supporter_id uuid not null references auth.users(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  first_source text not null check (first_source in ('donation','volunteer')),
  first_seen_at timestamptz not null default now(),
  primary key (supporter_id, community_id)
);
alter table public.supporter_organizations enable row level security;
alter table public.supporter_communities enable row level security;
revoke all on public.supporter_organizations, public.supporter_communities from anon, authenticated;

create or replace function public.record_supporter_links(p_supporter_id uuid, p_org_id uuid, p_community_id uuid, p_source text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_supporter_id is null then return; end if;
  insert into public.supporter_organizations(supporter_id,org_id,first_source)
  values(p_supporter_id,p_org_id,p_source)
  on conflict(supporter_id,org_id) do nothing;
  if p_community_id is not null then
    insert into public.supporter_communities(supporter_id,community_id,first_source)
    values(p_supporter_id,p_community_id,p_source)
    on conflict(supporter_id,community_id) do nothing;
  end if;
end $$;

create or replace function public.record_completed_donation_supporter_links()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='completed' and new.donor_id is not null then
    perform public.record_supporter_links(new.donor_id,new.org_id,new.community_id,'donation');
  end if;
  return new;
end $$;
drop trigger if exists donations_record_supporter_links on public.donations;
create trigger donations_record_supporter_links after insert on public.donations for each row execute function public.record_completed_donation_supporter_links();

-- All state-changing volunteer access is routed through security-definer RPCs.
drop policy if exists volunteer_opportunities_owner_write on public.volunteer_opportunities;
drop policy if exists volunteer_signups_self_insert on public.volunteer_signups;
drop policy if exists volunteer_signups_owner_update on public.volunteer_signups;
revoke insert, update, delete on public.volunteer_opportunities, public.volunteer_signups from anon, authenticated;
grant select on public.volunteer_opportunities, public.volunteer_signups to authenticated;

create or replace function public.create_volunteer_opportunity(p_title text,p_description text,p_starts_at timestamptz,p_location text,p_calendar_url text,p_capacity integer,p_campaign_id uuid default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_org uuid; v_community uuid; v_role public.app_role:=public.current_app_role();
begin
  if auth.uid() is null or v_role not in ('ngo_owner','community_owner') then raise exception 'Owner access required'; end if;
  if nullif(btrim(p_title),'') is null then raise exception 'Title is required'; end if;
  if p_capacity is not null and p_capacity < 1 then raise exception 'Capacity must be positive'; end if;
  if p_calendar_url is not null and p_calendar_url !~ '^https://' then raise exception 'Calendar URL must use HTTPS'; end if;
  if v_role='ngo_owner' then v_org:=public.current_org_id(); v_community:=null;
  else
    v_community:=public.current_community_id();
    select c.org_id into v_org from public.community_campaigns cc join public.campaigns c on c.id=cc.campaign_id
    where cc.community_id=v_community and cc.campaign_id=p_campaign_id and cc.status='active' and c.status='active';
    if v_org is null then raise exception 'Active linked campaign required'; end if;
  end if;
  insert into public.volunteer_opportunities(org_id,community_id,campaign_id,title,description,starts_at,location,calendar_url,capacity)
  values(v_org,v_community,p_campaign_id,left(btrim(p_title),160),left(coalesce(p_description,''),4000),p_starts_at,nullif(left(btrim(coalesce(p_location,'')),240),''),nullif(btrim(p_calendar_url),''),p_capacity) returning id into v_id;
  return v_id;
end $$;

create or replace function public.update_volunteer_opportunity(p_opportunity_id uuid,p_title text,p_description text,p_starts_at timestamptz,p_location text,p_calendar_url text,p_capacity integer,p_campaign_id uuid default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_op public.volunteer_opportunities; v_role public.app_role:=public.current_app_role();
begin
  select * into v_op from public.volunteer_opportunities where id=p_opportunity_id for update;
  if not found or (v_role='ngo_owner' and v_op.org_id<>public.current_org_id()) or (v_role='community_owner' and v_op.community_id<>public.current_community_id()) then raise exception 'Opportunity not found'; end if;
  if nullif(btrim(p_title),'') is null or (p_capacity is not null and p_capacity<1) or (p_calendar_url is not null and p_calendar_url !~ '^https://') then raise exception 'Invalid opportunity details'; end if;
  if v_role='community_owner' and (p_campaign_id is null or not exists(select 1 from public.community_campaigns cc join public.campaigns c on c.id=cc.campaign_id where cc.community_id=public.current_community_id() and cc.campaign_id=p_campaign_id and cc.status='active' and c.status='active' and c.org_id=v_op.org_id)) then raise exception 'Active linked campaign required'; end if;
  update public.volunteer_opportunities set title=left(btrim(p_title),160),description=left(coalesce(p_description,''),4000),starts_at=p_starts_at,location=nullif(left(btrim(coalesce(p_location,'')),240),''),calendar_url=nullif(btrim(p_calendar_url),''),capacity=p_capacity,campaign_id=p_campaign_id,updated_at=now() where id=p_opportunity_id;
  return p_opportunity_id;
end $$;

create or replace function public.set_volunteer_opportunity_status(p_opportunity_id uuid,p_status text)
returns uuid language plpgsql security definer set search_path=public as $$
begin
  if p_status not in ('active','full','closed') then raise exception 'Invalid status'; end if;
  update public.volunteer_opportunities set status=p_status,updated_at=now() where id=p_opportunity_id and ((public.current_app_role()='ngo_owner' and org_id=public.current_org_id()) or (public.current_app_role()='community_owner' and community_id=public.current_community_id()));
  if not found then raise exception 'Opportunity not found'; end if; return p_opportunity_id;
end $$;

create or replace function public.register_for_volunteer_opportunity(p_opportunity_id uuid)
returns table(signup_id uuid, calendar_url text) language plpgsql security definer set search_path=public as $$
declare v_op public.volunteer_opportunities; v_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and nullif(btrim(phone),'') is not null) then raise exception 'Phone number required'; end if;
  select * into v_op from public.volunteer_opportunities where id=p_opportunity_id and status='active' for update;
  if not found then raise exception 'Opportunity is unavailable'; end if;
  select count(*) into v_count from public.volunteer_signups where opportunity_id=v_op.id and status<>'cancelled';
  if v_op.capacity is not null and v_count>=v_op.capacity then update public.volunteer_opportunities set status='full',updated_at=now() where id=v_op.id; raise exception 'Opportunity is full'; end if;
  insert into public.volunteer_signups(opportunity_id,volunteer_id,org_id,community_id) values(v_op.id,auth.uid(),v_op.org_id,v_op.community_id) returning id into signup_id;
  perform public.record_supporter_links(auth.uid(),v_op.org_id,v_op.community_id,'volunteer');
  calendar_url:=v_op.calendar_url; return next;
exception when unique_violation then raise exception 'Already registered';
end $$;

create or replace function public.set_volunteer_signup_status(p_signup_id uuid,p_status text)
returns uuid language plpgsql security definer set search_path=public as $$
begin
  if p_status not in ('registered','scheduled','attended','cancelled') then raise exception 'Invalid status'; end if;
  update public.volunteer_signups set status=p_status where id=p_signup_id and ((public.current_app_role()='ngo_owner' and org_id=public.current_org_id()) or (public.current_app_role()='community_owner' and community_id=public.current_community_id()));
  if not found then raise exception 'Signup not found'; end if; return p_signup_id;
end $$;

create or replace function public.get_ngo_volunteer_opportunities()
returns table(id uuid,org_id uuid,community_id uuid,campaign_id uuid,title text,description text,starts_at timestamptz,location text,calendar_url text,capacity integer,status text,created_at timestamptz,signup_count bigint,campaign_title text,community_name text) language sql stable security definer set search_path=public as $$
  select o.id,o.org_id,o.community_id,o.campaign_id,o.title,o.description,o.starts_at,o.location,o.calendar_url,o.capacity,o.status,o.created_at,count(s.id) filter(where s.status<>'cancelled'),c.title,cm.name from public.volunteer_opportunities o left join public.volunteer_signups s on s.opportunity_id=o.id left join public.campaigns c on c.id=o.campaign_id left join public.communities cm on cm.id=o.community_id where public.current_app_role()='ngo_owner' and o.org_id=public.current_org_id() group by o.id,c.title,cm.name order by o.created_at desc
$$;
-- Community query is written separately to prevent organization-wide rows leaking through an inherited filter.
create or replace function public.get_community_volunteer_opportunities()
returns table(id uuid,org_id uuid,community_id uuid,campaign_id uuid,title text,description text,starts_at timestamptz,location text,calendar_url text,capacity integer,status text,created_at timestamptz,signup_count bigint,campaign_title text,community_name text) language sql stable security definer set search_path=public as $$
 select o.id,o.org_id,o.community_id,o.campaign_id,o.title,o.description,o.starts_at,o.location,o.calendar_url,o.capacity,o.status,o.created_at,count(s.id) filter(where s.status<>'cancelled'),c.title,cm.name from public.volunteer_opportunities o left join public.volunteer_signups s on s.opportunity_id=o.id left join public.campaigns c on c.id=o.campaign_id left join public.communities cm on cm.id=o.community_id where public.current_app_role()='community_owner' and o.community_id=public.current_community_id() group by o.id,c.title,cm.name order by o.created_at desc
$$;
create or replace function public.get_ngo_volunteer_signups()
returns table(id uuid,opportunity_id uuid,status text,created_at timestamptz,volunteer_name text,volunteer_email text,volunteer_phone text,community_name text) language sql stable security definer set search_path=public as $$
 select s.id,s.opportunity_id,s.status,s.created_at,p.full_name,p.email,p.phone,cm.name from public.volunteer_signups s join public.profiles p on p.id=s.volunteer_id left join public.communities cm on cm.id=s.community_id where public.current_app_role()='ngo_owner' and s.org_id=public.current_org_id() order by s.created_at desc
$$;
create or replace function public.get_community_volunteer_signups()
returns table(id uuid,opportunity_id uuid,status text,created_at timestamptz,volunteer_name text,volunteer_email text,volunteer_phone text,community_name text) language sql stable security definer set search_path=public as $$
 select s.id,s.opportunity_id,s.status,s.created_at,p.full_name,p.email,p.phone,cm.name from public.volunteer_signups s join public.profiles p on p.id=s.volunteer_id left join public.communities cm on cm.id=s.community_id where public.current_app_role()='community_owner' and s.community_id=public.current_community_id() order by s.created_at desc
$$;
revoke all on function public.record_supporter_links(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.create_volunteer_opportunity(text,text,timestamptz,text,text,integer,uuid),public.update_volunteer_opportunity(uuid,text,text,timestamptz,text,text,integer,uuid),public.set_volunteer_opportunity_status(uuid,text),public.register_for_volunteer_opportunity(uuid),public.set_volunteer_signup_status(uuid,text),public.get_ngo_volunteer_opportunities(),public.get_community_volunteer_opportunities(),public.get_ngo_volunteer_signups(),public.get_community_volunteer_signups() to authenticated;
