-- Public organization pages expose aggregate donation activity without donor identity,
-- plus communities with an active relationship to one of the organization's campaigns.
create or replace function public.get_public_organization_donations(p_org_id uuid)
returns table(amount numeric, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select donation.amount, donation.created_at
  from public.donations donation
  join public.campaigns campaign on campaign.id = donation.campaign_id
  where donation.org_id = p_org_id
    and donation.status = 'completed'
    and campaign.status = 'active'
  order by donation.created_at desc
  limit 12
$$;

create or replace function public.get_public_organization_communities(p_org_id uuid)
returns table(
  community_id uuid,
  community_name text,
  community_name_en text,
  community_color text,
  community_total_raised numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    community.id,
    community.name,
    community.name_en,
    community.color,
    community.total_raised
  from public.communities community
  join public.community_campaigns membership on membership.community_id = community.id
  join public.campaigns campaign on campaign.id = membership.campaign_id
  where campaign.org_id = p_org_id
    and campaign.status = 'active'
    and membership.status = 'active'
  group by community.id, community.name, community.name_en, community.color, community.total_raised
  order by community.name
$$;

revoke all on function public.get_public_organization_donations(uuid) from public, anon, authenticated;
revoke all on function public.get_public_organization_communities(uuid) from public, anon, authenticated;
grant execute on function public.get_public_organization_donations(uuid) to anon, authenticated;
grant execute on function public.get_public_organization_communities(uuid) to anon, authenticated;
