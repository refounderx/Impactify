-- Expose optional product media wherever public product discovery is used.
drop function if exists public.get_discoverable_products(text[]);
drop function if exists public.get_discoverable_products_for_audience(text);

create or replace function public.get_discoverable_products(p_categories text[] default null)
returns table (
  product_id uuid, campaign_id uuid, category text, name text, name_en text,
  description text, description_en text, price numeric, emoji text,
  image_url text, video_url text, donation_count bigint
)
language sql stable security definer set search_path = public as $$
  select p.id, c.id, c.category, p.name, p.name_en, p.description, p.description_en,
    p.price, p.emoji, p.image_url, p.video_url,
    coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0)::bigint
  from public.campaign_products cp
  join public.campaigns c on c.id = cp.campaign_id and c.status = 'active'
  join public.products p on p.id = cp.product_id and p.active
  left join public.donations d on d.campaign_id = c.id and d.product_id = p.id
  where (p_categories is null or c.category = any(p_categories))
    and c.id not in ('c1111111-1111-1111-1111-111111111111'::uuid, 'c2222222-2222-2222-2222-222222222222'::uuid, 'c3333333-3333-3333-3333-333333333333'::uuid, 'c4444444-4444-4444-4444-444444444444'::uuid, 'c5555555-5555-5555-5555-555555555555'::uuid, 'c6666666-6666-6666-6666-666666666666'::uuid)
  group by p.id, c.id, c.category
  order by coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0) desc, max(p.created_at) desc;
$$;

create or replace function public.get_discoverable_products_for_audience(p_audience text)
returns table (
  product_id uuid, campaign_id uuid, category text, name text, name_en text,
  description text, description_en text, price numeric, emoji text,
  image_url text, video_url text, donation_count bigint
)
language sql stable security definer set search_path = public as $$
  select p.id, c.id, c.category, p.name, p.name_en, p.description, p.description_en,
    p.price, p.emoji, p.image_url, p.video_url,
    coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0)::bigint
  from public.product_home_audiences pha
  join public.products p on p.id = pha.product_id and p.active
  join public.campaign_products cp on cp.product_id = p.id
  join public.campaigns c on c.id = cp.campaign_id and c.status = 'active'
  left join public.donations d on d.campaign_id = c.id and d.product_id = p.id
  where pha.audience = p_audience
    and c.id not in ('c1111111-1111-1111-1111-111111111111'::uuid, 'c2222222-2222-2222-2222-222222222222'::uuid, 'c3333333-3333-3333-3333-333333333333'::uuid, 'c4444444-4444-4444-4444-444444444444'::uuid, 'c5555555-5555-5555-5555-555555555555'::uuid, 'c6666666-6666-6666-6666-666666666666'::uuid)
  group by p.id, c.id, c.category
  order by coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0) desc, max(p.created_at) desc;
$$;

revoke all on function public.get_discoverable_products(text[]) from public, anon, authenticated;
grant execute on function public.get_discoverable_products(text[]) to anon, authenticated;
revoke all on function public.get_discoverable_products_for_audience(text) from public, anon, authenticated;
grant execute on function public.get_discoverable_products_for_audience(text) to anon, authenticated;
