drop policy if exists "community_campaigns_ngo_read" on public.community_campaigns;

create policy "community_campaigns_ngo_read"
on public.community_campaigns
for select
to authenticated
using (
  public.current_app_role() = 'ngo_owner'
  and exists (
    select 1
    from public.campaigns campaign
    where campaign.id = community_campaigns.campaign_id
      and campaign.org_id = public.current_org_id()
  )
);
