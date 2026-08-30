create or replace function public.manage_ngo_campaign_request(
  p_community_id uuid,
  p_campaign_id uuid,
  p_action text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status text;
begin
  select org_id into v_org
  from public.profiles
  where id = auth.uid()
    and app_role = 'ngo_owner';

  if v_org is null or p_action not in ('approve', 'reject') then
    raise exception 'Invalid request';
  end if;

  if p_action = 'approve' then
    update public.communities
    set org_id = v_org
    where id = p_community_id
      and (org_id is null or org_id = v_org);

    if not found then
      raise exception 'Community is already affiliated with another organization';
    end if;
  end if;

  update public.community_campaigns cc
  set
    status = case when p_action = 'approve' then 'active' else 'rejected' end,
    updated_at = now()
  from public.campaigns ca
  where cc.community_id = p_community_id
    and cc.campaign_id = p_campaign_id
    and ca.id = cc.campaign_id
    and ca.org_id = v_org
    and cc.status = 'pending'
  returning cc.status into v_status;

  if v_status is null then
    raise exception 'Request not found';
  end if;

  return v_status;
end;
$$;

revoke all on function public.manage_ngo_campaign_request(uuid, uuid, text)
from public, anon, authenticated;

grant execute on function public.manage_ngo_campaign_request(uuid, uuid, text)
to authenticated;

update public.communities community
set org_id = campaign.org_id
from public.community_campaigns membership
join public.campaigns campaign on campaign.id = membership.campaign_id
where membership.community_id = community.id
  and membership.status in ('active', 'paused')
  and community.org_id is null;
