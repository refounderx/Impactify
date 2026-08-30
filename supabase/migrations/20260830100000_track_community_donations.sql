alter table public.donations
  add column if not exists donor_name text;

create index if not exists idx_donations_community
  on public.donations(community_id, created_at desc)
  where community_id is not null;

create or replace function public.update_community_donation_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and new.community_id is not null then
    update public.communities
    set
      total_raised = total_raised + new.amount,
      donors_count = donors_count + 1
    where id = new.community_id;
  end if;
  return new;
end;
$$;

revoke all on function public.update_community_donation_stats()
  from public, anon, authenticated;

drop trigger if exists after_community_donation_insert on public.donations;
create trigger after_community_donation_insert
  after insert on public.donations
  for each row execute function public.update_community_donation_stats();
