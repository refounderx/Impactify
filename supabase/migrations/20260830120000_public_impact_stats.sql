-- Public landing-page aggregates only: no donor, payment, or campaign-level details.
create or replace function public.get_public_impact_stats()
returns table (
  completed_donations bigint,
  completed_amount numeric,
  known_donors bigint,
  active_campaigns bigint,
  partner_organizations bigint,
  communities_count bigint,
  active_recurring_donations bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.donations where status = 'completed'),
    (select coalesce(sum(amount), 0) from public.donations where status = 'completed'),
    (select count(distinct donor_id) from public.donations where status = 'completed' and donor_id is not null),
    (select count(*) from public.campaigns where status = 'active'),
    (select count(*) from public.organizations),
    (select count(*) from public.communities),
    (select count(*) from public.recurring_donations where status = 'active');
$$;

revoke all on function public.get_public_impact_stats() from public;
grant execute on function public.get_public_impact_stats() to anon, authenticated;
