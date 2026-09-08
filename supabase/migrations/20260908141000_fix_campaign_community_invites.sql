-- Partnership requests replaced pending community_campaign rows. Keep the
-- campaign wizard's bulk-invite RPC on the current request queue.
create or replace function public.invite_communities_to_campaign(
  p_campaign_id uuid,
  p_community_ids uuid[]
) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_community_id uuid;
  v_count integer := 0;
begin
  select org_id into v_org
  from public.profiles
  where id = auth.uid() and app_role = 'ngo_owner' and onboarding_completed_at is not null;
  if v_org is null then raise exception 'NGO owner access required'; end if;
  if not exists (select 1 from public.campaigns where id = p_campaign_id and org_id = v_org and status = 'active') then
    raise exception 'Active campaign not found';
  end if;
  if coalesce(cardinality(p_community_ids), 0) = 0 then return 0; end if;
  if cardinality(p_community_ids) <> (select count(distinct id) from unnest(p_community_ids) as requested(id)) then
    raise exception 'Duplicate community IDs are not allowed';
  end if;
  if exists (
    select 1 from unnest(p_community_ids) as requested(id)
    left join public.communities community on community.id = requested.id
    where community.id is null
  ) then raise exception 'Community not found'; end if;

  foreach v_community_id in array p_community_ids loop
    if exists (
      select 1 from public.community_campaigns
      where community_id = v_community_id and campaign_id = p_campaign_id
        and status in ('active', 'paused')
    ) then continue; end if;
    perform public.create_partnership_request(p_campaign_id, 'organization', v_community_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

revoke all on function public.invite_communities_to_campaign(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.invite_communities_to_campaign(uuid, uuid[]) to authenticated;
