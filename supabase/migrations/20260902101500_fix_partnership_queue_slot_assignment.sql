begin;

-- A free slot can be 2 or 3 after a decision. Match queued rows to the
-- ordered list of free slots, rather than comparing the actual slot number to
-- the queued-row ordinal.
create or replace function public.refill_partnership_queue(p_recipient_type text, p_recipient_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_needed integer; v_count integer;
begin
  if p_recipient_type not in ('community', 'organization') then raise exception 'Invalid recipient'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_recipient_type || ':' || p_recipient_id::text, 0));
  select 3 - count(*) into v_needed from public.partnership_requests
  where status = 'active_review'
    and ((p_recipient_type = 'community' and initiator_type = 'organization' and community_id = p_recipient_id)
      or (p_recipient_type = 'organization' and initiator_type = 'community' and org_id = p_recipient_id));
  if v_needed <= 0 then return 0; end if;
  with slots as (
    select slot, row_number() over (order by slot) as rn from generate_series(1, 3) slot
    where not exists (select 1 from public.partnership_requests r where r.status = 'active_review' and r.review_slot = slot
      and ((p_recipient_type = 'community' and r.initiator_type = 'organization' and r.community_id = p_recipient_id)
        or (p_recipient_type = 'organization' and r.initiator_type = 'community' and r.org_id = p_recipient_id)))
    order by slot limit v_needed
  ), locked as (
    select id, requested_at from public.partnership_requests
    where status = 'queued'
      and ((p_recipient_type = 'community' and initiator_type = 'organization' and community_id = p_recipient_id)
        or (p_recipient_type = 'organization' and initiator_type = 'community' and org_id = p_recipient_id))
    order by requested_at, id for update skip locked limit v_needed
  ), queued as (
    select id, row_number() over (order by requested_at, id) as rn from locked
  ), promoted as (
    update public.partnership_requests r set status = 'active_review', review_slot = slots.slot, promoted_at = now(), updated_at = now()
    from queued join slots on slots.rn = queued.rn where r.id = queued.id returning r.id
  )
  insert into public.partnership_request_events(request_id, event_type) select id, 'promoted' from promoted;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Repair any queues left with a free slot by the previous implementation.
do $$
declare rec record;
begin
  for rec in
    select distinct 'organization'::text as recipient_type, org_id as recipient_id
    from public.partnership_requests where initiator_type = 'community' and status in ('queued', 'active_review')
    union
    select distinct 'community'::text, community_id
    from public.partnership_requests where initiator_type = 'organization' and status in ('queued', 'active_review')
  loop
    perform public.refill_partnership_queue(rec.recipient_type, rec.recipient_id);
  end loop;
end $$;

insert into supabase_migrations.schema_migrations(version, name)
values ('20260902101500', 'fix_partnership_queue_slot_assignment') on conflict do nothing;

commit;
