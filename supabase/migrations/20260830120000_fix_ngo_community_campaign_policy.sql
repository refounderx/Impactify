create or replace function public.can_read_ngo_community_campaign(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'ngo_owner'
    and exists (
      select 1
      from public.campaigns campaign
      where campaign.id = p_campaign_id
        and campaign.org_id = public.current_org_id()
    );
$$;

revoke all on function public.can_read_ngo_community_campaign(uuid)
  from public, anon, authenticated;
grant execute on function public.can_read_ngo_community_campaign(uuid)
  to authenticated;

drop policy if exists "community_campaigns_ngo_read" on public.community_campaigns;

create policy "community_campaigns_ngo_read"
on public.community_campaigns
for select
to authenticated
using (public.can_read_ngo_community_campaign(campaign_id));
