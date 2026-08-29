create or replace function public.get_ngo_campaign_requests()
returns table (community_campaign_id uuid, campaign_id uuid, community_id uuid, community_name text, campaign_title text, requested_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from public.profiles where id = auth.uid() and app_role = 'ngo_owner';
  if v_org is null then raise exception 'NGO owner profile required'; end if;
  return query select cc.community_id, cc.campaign_id, cc.community_id, c.name, ca.title, cc.requested_at
    from public.community_campaigns cc join public.communities c on c.id = cc.community_id
    join public.campaigns ca on ca.id = cc.campaign_id
    where ca.org_id = v_org and cc.status = 'pending' order by cc.created_at desc;
end; $$;
drop function if exists public.manage_ngo_campaign_request(uuid, text);
create or replace function public.manage_ngo_campaign_request(p_community_id uuid, p_campaign_id uuid, p_action text)
returns text language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_status text;
begin
  select org_id into v_org from public.profiles where id = auth.uid() and app_role = 'ngo_owner';
  if v_org is null or p_action not in ('approve','reject') then raise exception 'Invalid request'; end if;
  update public.community_campaigns cc set status = case when p_action = 'approve' then 'active' else 'rejected' end, updated_at = now()
    from public.campaigns ca where cc.community_id = p_community_id and cc.campaign_id = p_campaign_id and ca.id = cc.campaign_id and ca.org_id = v_org and cc.status = 'pending'
    returning cc.status into v_status;
  if v_status is null then raise exception 'Request not found'; end if;
  return v_status;
end; $$;
revoke all on function public.get_ngo_campaign_requests() from public, anon, authenticated;
grant execute on function public.get_ngo_campaign_requests() to authenticated;
revoke all on function public.manage_ngo_campaign_request(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.manage_ngo_campaign_request(uuid,uuid,text) to authenticated;
