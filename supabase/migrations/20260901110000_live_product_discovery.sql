-- Replace landing-page product fixtures with active campaign products ranked by donated units.
create or replace function public.get_discoverable_products(p_categories text[] default null)
returns table (
  product_id uuid,
  campaign_id uuid,
  category text,
  name text,
  name_en text,
  description text,
  description_en text,
  price numeric,
  emoji text,
  donation_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    c.id,
    c.category,
    p.name,
    p.name_en,
    p.description,
    p.description_en,
    p.price,
    p.emoji,
    coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0)::bigint as donation_count
  from public.campaign_products cp
  join public.campaigns c on c.id = cp.campaign_id and c.status = 'active'
  join public.products p on p.id = cp.product_id and p.active
  left join public.donations d on d.campaign_id = c.id and d.product_id = p.id
  where p_categories is null or c.category = any(p_categories)
  group by p.id, c.id, c.category
  order by donation_count desc, p.created_at desc;
$$;

revoke all on function public.get_discoverable_products(text[]) from public, anon, authenticated;
grant execute on function public.get_discoverable_products(text[]) to anon, authenticated;

-- Product mockups are no longer part of the public landing dataset.
update public.site_datasets
set value = value - 'audienceProducts' - 'landingProducts'
where key = 'landing';
