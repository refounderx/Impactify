-- Keep standalone-product discovery compatible with the public product-card media contract.
-- DROP is required because PostgreSQL does not allow changing a function's OUT row type in place.
drop function if exists public.get_discoverable_products(text[]);
drop function if exists public.get_discoverable_products_for_audience(text);

create function public.get_discoverable_products(p_categories text[] default null)
returns table (
  product_id uuid, campaign_id uuid, category text, name text, name_en text,
  description text, description_en text, price numeric, emoji text,
  image_url text, video_url text, donation_count bigint
)
language sql stable security definer set search_path = public as $$
  select
    p.id, null::uuid,
    coalesce((select pha.audience from public.product_home_audiences pha where pha.product_id = p.id limit 1), 'general'),
    p.name, p.name_en, p.description, p.description_en, p.price, p.emoji,
    p.image_url, p.video_url,
    coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0)::bigint
  from public.products p
  left join public.donations d on d.product_id = p.id
  where p.active
    and (p_categories is null or exists (
      select 1 from public.product_home_audiences pha
      where pha.product_id = p.id and pha.audience = any(p_categories)
    ))
  group by p.id
  order by coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0) desc, p.created_at desc;
$$;

create function public.get_discoverable_products_for_audience(p_audience text)
returns table (
  product_id uuid, campaign_id uuid, category text, name text, name_en text,
  description text, description_en text, price numeric, emoji text,
  image_url text, video_url text, donation_count bigint
)
language sql stable security definer set search_path = public as $$
  select
    p.id, null::uuid, pha.audience,
    p.name, p.name_en, p.description, p.description_en, p.price, p.emoji,
    p.image_url, p.video_url,
    coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0)::bigint
  from public.product_home_audiences pha
  join public.products p on p.id = pha.product_id and p.active
  left join public.donations d on d.product_id = p.id
  where pha.audience = p_audience
  group by p.id, pha.audience
  order by coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0) desc, max(p.created_at) desc;
$$;

revoke all on function public.get_discoverable_products(text[]) from public, anon, authenticated;
grant execute on function public.get_discoverable_products(text[]) to anon, authenticated;
revoke all on function public.get_discoverable_products_for_audience(text) from public, anon, authenticated;
grant execute on function public.get_discoverable_products_for_audience(text) to anon, authenticated;
