-- Temporary QA fixture for the bidirectional partnership queue.
-- Run in Supabase Dashboard -> SQL Editor. This creates no donor or payment data.
-- Keep the output tag; it is used by partnership_queue_qa_cleanup.sql.

begin;

do $$
declare
  v_tag text := '[QA Partnership Queue ' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS') || ']';
  v_instance_id uuid := coalesce((select instance_id from auth.users limit 1), '00000000-0000-0000-0000-000000000000'::uuid);
  ngo_1_user uuid := gen_random_uuid(); ngo_2_user uuid := gen_random_uuid(); ngo_3_user uuid := gen_random_uuid();
  community_1_user uuid := gen_random_uuid(); community_2_user uuid := gen_random_uuid(); community_3_user uuid := gen_random_uuid();
  ngo_1 uuid := gen_random_uuid(); ngo_2 uuid := gen_random_uuid(); ngo_3 uuid := gen_random_uuid();
  community_1 uuid := gen_random_uuid(); community_2 uuid := gen_random_uuid(); community_3 uuid := gen_random_uuid();
  campaign_a uuid := gen_random_uuid(); campaign_a2 uuid := gen_random_uuid();
  campaign_b uuid := gen_random_uuid(); campaign_b2 uuid := gen_random_uuid();
  campaign_c uuid := gen_random_uuid(); campaign_c2 uuid := gen_random_uuid();
  v_user uuid; v_email text;
begin
  foreach v_user in array array[ngo_1_user, ngo_2_user, ngo_3_user, community_1_user, community_2_user, community_3_user] loop
    v_email := 'qa-partnership-' || replace(v_user::text, '-', '') || '@example.invalid';
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      v_user, v_instance_id, 'authenticated', 'authenticated', v_email,
      crypt(encode(gen_random_bytes(24), 'hex'), gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('fixture', 'partnership_queue_qa', 'tag', v_tag), now(), now()
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    values (gen_random_uuid(), v_user, jsonb_build_object('sub', v_user::text, 'email', v_email, 'email_verified', true), 'email', v_email, now(), now());
  end loop;

  insert into public.organizations (id, name, name_en, initials, description, description_en, goals, registration_number)
  values
    (ngo_1, v_tag || ' עמותה א׳', 'QA NGO One', 'Q1', 'עמותת דמה לבדיקת תורי שותפויות.', 'Temporary partnership-queue QA NGO.', '["qa"]', v_tag || '-NGO-1'),
    (ngo_2, v_tag || ' עמותה ב׳', 'QA NGO Two', 'Q2', 'עמותת דמה לבדיקת תורי שותפויות.', 'Temporary partnership-queue QA NGO.', '["qa"]', v_tag || '-NGO-2'),
    (ngo_3, v_tag || ' עמותה ג׳', 'QA NGO Three', 'Q3', 'עמותת דמה לבדיקת תורי שותפויות.', 'Temporary partnership-queue QA NGO.', '["qa"]', v_tag || '-NGO-3');

  insert into public.communities (id, name, name_en, description, manager_id)
  values
    (community_1, v_tag || ' קהילה א׳', 'QA Community One', 'קהילת דמה לבדיקת תורי שותפויות.', community_1_user),
    (community_2, v_tag || ' קהילה ב׳', 'QA Community Two', 'קהילת דמה לבדיקת תורי שותפויות.', community_2_user),
    (community_3, v_tag || ' קהילה ג׳', 'QA Community Three', 'קהילת דמה לבדיקת תורי שותפויות.', community_3_user);

  update public.profiles set full_name = 'QA NGO owner', app_role = 'ngo_owner', org_id = ngo_1, onboarding_completed_at = now(), updated_at = now() where id = ngo_1_user;
  update public.profiles set full_name = 'QA NGO owner', app_role = 'ngo_owner', org_id = ngo_2, onboarding_completed_at = now(), updated_at = now() where id = ngo_2_user;
  update public.profiles set full_name = 'QA NGO owner', app_role = 'ngo_owner', org_id = ngo_3, onboarding_completed_at = now(), updated_at = now() where id = ngo_3_user;
  update public.profiles set full_name = 'QA community owner', app_role = 'community_owner', community_id = community_1, onboarding_completed_at = now(), updated_at = now() where id = community_1_user;
  update public.profiles set full_name = 'QA community owner', app_role = 'community_owner', community_id = community_2, onboarding_completed_at = now(), updated_at = now() where id = community_2_user;
  update public.profiles set full_name = 'QA community owner', app_role = 'community_owner', community_id = community_3, onboarding_completed_at = now(), updated_at = now() where id = community_3_user;

  insert into public.campaigns (id, title, title_en, short_desc, org_id, category, goal, end_date, status)
  values
    (campaign_a,  v_tag || ' קמפיין א׳',  'QA Campaign A',  'QA queue test', ngo_1, 'QA', 1000, current_date + 30, 'active'),
    (campaign_a2, v_tag || ' קמפיין א2', 'QA Campaign A2', 'QA queue test', ngo_1, 'QA', 1000, current_date + 30, 'active'),
    (campaign_b,  v_tag || ' קמפיין ב׳',  'QA Campaign B',  'QA queue test', ngo_2, 'QA', 1000, current_date + 30, 'active'),
    (campaign_b2, v_tag || ' קמפיין ב2', 'QA Campaign B2', 'QA queue test', ngo_2, 'QA', 1000, current_date + 30, 'active'),
    (campaign_c,  v_tag || ' קמפיין ג׳',  'QA Campaign C',  'QA queue test', ngo_3, 'QA', 1000, current_date + 30, 'active'),
    (campaign_c2, v_tag || ' קמפיין ג2', 'QA Campaign C2', 'QA queue test', ngo_3, 'QA', 1000, current_date + 30, 'active');

  -- Community -> NGO: three active reviews and one queued request for NGO 1.
  perform set_config('request.jwt.claim.sub', community_1_user::text, true); perform public.create_partnership_request(campaign_a, 'community');
  perform set_config('request.jwt.claim.sub', community_2_user::text, true); perform public.create_partnership_request(campaign_a, 'community');
  perform set_config('request.jwt.claim.sub', community_3_user::text, true); perform public.create_partnership_request(campaign_a, 'community');
  perform set_config('request.jwt.claim.sub', community_1_user::text, true); perform public.create_partnership_request(campaign_a2, 'community');

  -- NGO 1 approves one request: the queued request immediately fills the open slot.
  perform set_config('request.jwt.claim.sub', ngo_1_user::text, true);
  perform public.decide_partnership_request((select id from public.partnership_requests where campaign_id = campaign_a and community_id = community_1 and initiator_type = 'community'), 'approve');

  -- NGO -> community: three active reviews and one queued request for community 1.
  perform set_config('request.jwt.claim.sub', ngo_2_user::text, true); perform public.create_partnership_request(campaign_b, 'organization', community_1);
  perform set_config('request.jwt.claim.sub', ngo_2_user::text, true); perform public.create_partnership_request(campaign_b2, 'organization', community_1);
  perform set_config('request.jwt.claim.sub', ngo_3_user::text, true); perform public.create_partnership_request(campaign_c, 'organization', community_1);
  perform set_config('request.jwt.claim.sub', ngo_3_user::text, true); perform public.create_partnership_request(campaign_c2, 'organization', community_1);

  -- Community 1 approves one request: its queued request immediately fills the open slot.
  perform set_config('request.jwt.claim.sub', community_1_user::text, true);
  perform public.decide_partnership_request((select id from public.partnership_requests where campaign_id = campaign_b and community_id = community_1 and initiator_type = 'organization'), 'approve');

  -- Mutual interest: community 2 requests campaign C, then NGO 3 invites it to the same campaign.
  perform set_config('request.jwt.claim.sub', community_2_user::text, true); perform public.create_partnership_request(campaign_c, 'community');
  perform set_config('request.jwt.claim.sub', ngo_3_user::text, true); perform public.create_partnership_request(campaign_c, 'organization', community_2);

  raise notice 'Created temporary fixture %', v_tag;
end $$;

commit;

select
  request.initiator_type,
  request.status,
  request.review_slot,
  community.name as community_name,
  campaign.title as campaign_title,
  organization.name as organization_name
from public.partnership_requests request
join public.communities community on community.id = request.community_id
join public.campaigns campaign on campaign.id = request.campaign_id
join public.organizations organization on organization.id = request.org_id
where organization.name like '[QA Partnership Queue %'
order by organization.name, request.initiator_type, request.requested_at;

select
  event.event_type,
  count(*) as event_count
from public.partnership_request_events event
join public.partnership_requests request on request.id = event.request_id
join public.organizations organization on organization.id = request.org_id
where organization.name like '[QA Partnership Queue %'
group by event.event_type
order by event.event_type;
