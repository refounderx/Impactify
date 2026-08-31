create or replace function public.invite_communities_to_campaign(
  p_campaign_id uuid,
  p_community_ids uuid[]
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_count integer;
begin
  select org_id into v_org
  from public.profiles
  where id = auth.uid() and app_role = 'ngo_owner' and onboarding_completed_at is not null;
  if v_org is null then raise exception 'NGO owner access required'; end if;

  if not exists (select 1 from public.campaigns where id = p_campaign_id and org_id = v_org) then
    raise exception 'Campaign not found';
  end if;
  if coalesce(cardinality(p_community_ids), 0) = 0 then return 0; end if;
  if cardinality(p_community_ids) <> (select count(distinct id) from unnest(p_community_ids) as requested(id)) then
    raise exception 'Duplicate community IDs are not allowed';
  end if;
  if exists (
    select 1 from unnest(p_community_ids) as requested(id)
    left join public.communities community on community.id = requested.id
    where community.id is null
  ) then
    raise exception 'Community not found';
  end if;

  insert into public.community_campaigns (community_id, campaign_id, status, source)
  select requested.id, p_campaign_id, 'pending', 'linked'
  from unnest(p_community_ids) as requested(id)
  on conflict (community_id, campaign_id) do update
    set status = case when community_campaigns.status = 'rejected' then 'pending' else community_campaigns.status end,
        requested_at = case when community_campaigns.status = 'rejected' then now() else community_campaigns.requested_at end,
        updated_at = now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.invite_communities_to_campaign(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.invite_communities_to_campaign(uuid, uuid[]) to authenticated;
