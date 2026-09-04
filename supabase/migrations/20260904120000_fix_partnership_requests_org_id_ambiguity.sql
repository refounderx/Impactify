-- `org_id` is also a RETURNS TABLE field, so every profile column must be
-- explicitly qualified inside this PL/pgSQL function.
create or replace function public.get_partnership_requests(p_view text)
returns table(
  id uuid,
  community_id uuid,
  community_name text,
  campaign_id uuid,
  campaign_title text,
  org_id uuid,
  org_name text,
  initiator_type text,
  status text,
  requested_at timestamptz,
  promoted_at timestamptz,
  review_slot smallint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_community uuid;
  v_role public.app_role;
begin
  select profile.app_role, profile.org_id, profile.community_id
  into v_role, v_org, v_community
  from public.profiles profile
  where profile.id = auth.uid();

  if v_role = 'ngo_owner' then
    return query
      select request.id, request.community_id, community.name, request.campaign_id, campaign.title,
        request.org_id, organization.name, request.initiator_type, request.status,
        request.requested_at, request.promoted_at, request.review_slot
      from public.partnership_requests request
      join public.communities community on community.id = request.community_id
      join public.campaigns campaign on campaign.id = request.campaign_id
      join public.organizations organization on organization.id = request.org_id
      where request.org_id = v_org
        and ((p_view = 'inbox' and request.initiator_type = 'community' and request.status = 'active_review')
          or (p_view = 'backlog' and request.initiator_type = 'community' and request.status = 'queued')
          or (p_view = 'sent' and request.initiator_type = 'organization'))
      order by request.requested_at;
  elsif v_role = 'community_owner' then
    return query
      select request.id, request.community_id, community.name, request.campaign_id, campaign.title,
        request.org_id, organization.name, request.initiator_type, request.status,
        request.requested_at, request.promoted_at, request.review_slot
      from public.partnership_requests request
      join public.communities community on community.id = request.community_id
      join public.campaigns campaign on campaign.id = request.campaign_id
      join public.organizations organization on organization.id = request.org_id
      where request.community_id = v_community
        and ((p_view = 'inbox' and request.initiator_type = 'organization' and request.status = 'active_review')
          or (p_view = 'backlog' and request.initiator_type = 'organization' and request.status = 'queued')
          or (p_view = 'sent' and request.initiator_type = 'community'))
      order by request.requested_at;
  else
    raise exception 'Partnership access required';
  end if;
end
$$;

revoke all on function public.get_partnership_requests(text) from public, anon, authenticated;
grant execute on function public.get_partnership_requests(text) to authenticated;
