-- Preserve donation immutability while allowing FK-managed SET NULL anonymization.
drop rule if exists donations_no_update on public.donations;

create or replace function public.protect_donation_immutability()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    new.donor_id is not distinct from old.donor_id
    or (old.donor_id is not null and new.donor_id is null)
  ) and (
    new.product_id is not distinct from old.product_id
    or (old.product_id is not null and new.product_id is null)
  ) and (
    new.donor_id is distinct from old.donor_id
    or new.product_id is distinct from old.product_id
  ) and (
    to_jsonb(new) - array['donor_id', 'product_id']
    = to_jsonb(old) - array['donor_id', 'product_id']
  ) then
    return new;
  end if;

  raise exception 'Donations are immutable';
end
$$;

revoke all on function public.protect_donation_immutability()
  from public, anon, authenticated;

drop trigger if exists donations_immutable_before_update on public.donations;
create trigger donations_immutable_before_update
  before update on public.donations
  for each row execute function public.protect_donation_immutability();
