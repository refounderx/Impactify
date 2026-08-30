create or replace function public.get_ngo_community_links()
returns table (
  community_id uuid,
  community_name text,
  community_name_en text,
  community_total_raised numeric,
  community_created_at timestamptz,
  campaign_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select org_id into v_org
  from public.profiles
  where id = auth.uid()
    and app_role = 'ngo_owner';

  if v_org is null then
    raise exception 'NGO owner profile required';
  end if;

  return query
  select
    community.id,
    community.name,
    community.name_en,
    community.total_raised,
    community.created_at,
    membership.campaign_id,
    membership.status
  from public.community_campaigns membership
  join public.campaigns campaign on campaign.id = membership.campaign_id
  join public.communities community on community.id = membership.community_id
  where campaign.org_id = v_org
    and membership.status in ('active', 'paused')
  order by community.created_at desc;
end;
$$;

revoke all on function public.get_ngo_community_links()
  from public, anon, authenticated;

grant execute on function public.get_ngo_community_links()
  to authenticated;
