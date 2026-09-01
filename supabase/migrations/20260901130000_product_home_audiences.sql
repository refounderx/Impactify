-- Explicit product-to-home-audience links replace campaign-category inference.
create table public.product_home_audiences (
  product_id uuid not null references public.products(id) on delete cascade,
  audience text not null check (audience in ('elderly', 'soldier', 'teen', 'baby', 'child')),
  primary key (product_id, audience)
);

alter table public.product_home_audiences enable row level security;
revoke all on public.product_home_audiences from public, anon, authenticated;
grant select on public.product_home_audiences to anon, authenticated;
grant insert, update, delete on public.product_home_audiences to authenticated;

create policy "product_home_audiences_public_read" on public.product_home_audiences for select using (true);
create policy "product_home_audiences_ngo_manage" on public.product_home_audiences for all to authenticated
using (exists (select 1 from public.products p join public.profiles profile on profile.org_id = p.org_id where p.id = product_id and profile.id = auth.uid() and profile.app_role = 'ngo_owner'))
with check (exists (select 1 from public.products p join public.profiles profile on profile.org_id = p.org_id where p.id = product_id and profile.id = auth.uid() and profile.app_role = 'ngo_owner'));

insert into public.product_home_audiences (product_id, audience)
select distinct cp.product_id, mapping.audience
from public.campaign_products cp
join public.campaigns c on c.id = cp.campaign_id
cross join lateral (values
  (case when c.category = 'elderly' then 'elderly' end),
  (case when c.category = 'soldier' then 'soldier' end),
  (case when c.category in ('education', 'children') then 'teen' end),
  (case when c.category in ('education', 'children') then 'child' end)
) as mapping(audience)
where mapping.audience is not null
on conflict do nothing;

create or replace function public.get_discoverable_products_for_audience(p_audience text)
returns table (
  product_id uuid, campaign_id uuid, category text, name text, name_en text,
  description text, description_en text, price numeric, emoji text, donation_count bigint
)
language sql stable security definer set search_path = public as $$
  select p.id, c.id, c.category, p.name, p.name_en, p.description, p.description_en,
    p.price, p.emoji,
    coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0)::bigint
  from public.product_home_audiences pha
  join public.products p on p.id = pha.product_id and p.active
  join public.campaign_products cp on cp.product_id = p.id
  join public.campaigns c on c.id = cp.campaign_id and c.status = 'active'
  left join public.donations d on d.campaign_id = c.id and d.product_id = p.id
  where pha.audience = p_audience
    and c.id not in (
      'c1111111-1111-1111-1111-111111111111'::uuid,
      'c2222222-2222-2222-2222-222222222222'::uuid,
      'c3333333-3333-3333-3333-333333333333'::uuid,
      'c4444444-4444-4444-4444-444444444444'::uuid,
      'c5555555-5555-5555-5555-555555555555'::uuid,
      'c6666666-6666-6666-6666-666666666666'::uuid
    )
  group by p.id, c.id, c.category
  order by coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0) desc, max(p.created_at) desc;
$$;

revoke all on function public.get_discoverable_products_for_audience(text) from public, anon, authenticated;
grant execute on function public.get_discoverable_products_for_audience(text) to anon, authenticated;
