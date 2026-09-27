-- Contact details are required for every completed onboarding flow.
drop function if exists public.complete_donor_signup(text);
drop function if exists public.complete_ngo_signup(text, text, text, jsonb, text);
drop function if exists public.complete_community_signup(text, text, text, text);

create function public.complete_donor_signup(p_full_name text, p_phone text) returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid := auth.uid(); v_phone text := regexp_replace(coalesce(p_phone,''), '[^0-9+]', '', 'g');
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if nullif(btrim(p_full_name),'') is null or length(v_phone) < 8 or length(v_phone) > 24 then raise exception 'Full name and valid phone are required'; end if;
 update public.profiles set full_name=left(btrim(p_full_name),120), phone=v_phone, app_role='donor', org_id=null, community_id=null, onboarding_completed_at=now(), updated_at=now() where id=v_user and onboarding_completed_at is null;
 if not found then raise exception 'Onboarding already completed or profile not found'; end if; return v_user;
end $$;

create function public.complete_ngo_signup(p_full_name text,p_org_name text,p_org_name_en text,p_goals jsonb,p_color text,p_phone text) returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_org uuid; v_phone text:=regexp_replace(coalesce(p_phone,''),'[^0-9+]','','g'); v_color text:=upper(btrim(coalesce(p_color,'')));
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if nullif(btrim(p_full_name),'') is null or nullif(btrim(p_org_name),'') is null or length(v_phone) < 8 or length(v_phone)>24 then raise exception 'Name, organization and valid phone are required'; end if;
 if v_color !~ '^#[0-9A-F]{6}$' then raise exception 'Invalid brand color'; end if;
 perform 1 from public.profiles where id=v_user and onboarding_completed_at is null for update;
 if not found then raise exception 'Onboarding already completed or profile not found'; end if;
 insert into public.organizations(name,name_en,initials,goals,color) values(left(btrim(p_org_name),160),nullif(left(btrim(p_org_name_en),160),''),upper(left(coalesce(nullif(btrim(p_org_name_en),''),btrim(p_org_name)),2)),public.normalize_organization_goals(p_goals),v_color) returning id into v_org;
 update public.profiles set full_name=left(btrim(p_full_name),120),phone=v_phone,app_role='ngo_owner',org_id=v_org,community_id=null,onboarding_completed_at=now(),updated_at=now() where id=v_user; return v_org;
end $$;

create function public.complete_community_signup(p_full_name text,p_community_name text,p_community_name_en text,p_color text,p_phone text) returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_community uuid; v_phone text:=regexp_replace(coalesce(p_phone,''),'[^0-9+]','','g'); v_color text:=upper(btrim(coalesce(p_color,'')));
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if nullif(btrim(p_full_name),'') is null or nullif(btrim(p_community_name),'') is null or length(v_phone)<8 or length(v_phone)>24 then raise exception 'Name, community and valid phone are required'; end if;
 if v_color !~ '^#[0-9A-F]{6}$' then raise exception 'Invalid brand color'; end if;
 perform 1 from public.profiles where id=v_user and onboarding_completed_at is null for update;
 if not found then raise exception 'Onboarding already completed or profile not found'; end if;
 insert into public.communities(name,name_en,manager_id,color) values(left(btrim(p_community_name),160),nullif(left(btrim(p_community_name_en),160),''),v_user,v_color) returning id into v_community;
 update public.profiles set full_name=left(btrim(p_full_name),120),phone=v_phone,app_role='community_owner',org_id=null,community_id=v_community,onboarding_completed_at=now(),updated_at=now() where id=v_user; return v_community;
end $$;
revoke all on function public.complete_donor_signup(text,text), public.complete_ngo_signup(text,text,text,jsonb,text,text), public.complete_community_signup(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.complete_donor_signup(text,text), public.complete_ngo_signup(text,text,text,jsonb,text,text), public.complete_community_signup(text,text,text,text,text) to authenticated;

create table public.volunteer_opportunities (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizations(id) on delete cascade, community_id uuid references public.communities(id) on delete set null, campaign_id uuid references public.campaigns(id) on delete set null,
 title text not null check(length(btrim(title)) between 2 and 160), description text not null default '', starts_at timestamptz, location text, calendar_url text check(calendar_url is null or calendar_url ~ '^https://'), capacity integer check(capacity is null or capacity > 0), status text not null default 'active' check(status in ('active','full','closed')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.volunteer_signups (
 id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.volunteer_opportunities(id) on delete cascade, volunteer_id uuid not null references auth.users(id) on delete cascade, org_id uuid not null references public.organizations(id) on delete cascade, community_id uuid references public.communities(id) on delete set null, status text not null default 'registered' check(status in ('registered','scheduled','attended','cancelled')), created_at timestamptz not null default now(), unique(opportunity_id, volunteer_id)
);
alter table public.volunteer_opportunities enable row level security; alter table public.volunteer_signups enable row level security;
create policy volunteer_opportunities_public_read on public.volunteer_opportunities for select using(status='active' or org_id=public.current_org_id() or community_id=public.current_community_id());
create policy volunteer_opportunities_owner_write on public.volunteer_opportunities for all to authenticated using(org_id=public.current_org_id() or community_id=public.current_community_id()) with check(
  (org_id=public.current_org_id() and public.current_app_role()='ngo_owner') or
  (community_id=public.current_community_id() and public.current_app_role()='community_owner' and exists(
    select 1 from public.community_campaigns cc join public.campaigns c on c.id=cc.campaign_id
    where cc.community_id=public.current_community_id() and cc.campaign_id=volunteer_opportunities.campaign_id and cc.status='active' and c.org_id=volunteer_opportunities.org_id
  ))
);
create policy volunteer_signups_owner_read on public.volunteer_signups for select to authenticated using(volunteer_id=auth.uid() or org_id=public.current_org_id() or community_id=public.current_community_id());
create policy volunteer_signups_self_insert on public.volunteer_signups for insert to authenticated with check(volunteer_id=auth.uid());
create policy volunteer_signups_owner_update on public.volunteer_signups for update to authenticated using(org_id=public.current_org_id() or community_id=public.current_community_id());
