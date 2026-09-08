-- Products are independently fundable. Campaigns only attribute a product donation
-- when a donor arrives through a campaign link.
alter table public.donations alter column campaign_id drop not null;
alter table public.campaign_products add column if not exists required_quantity integer not null default 1 check (required_quantity > 0);
create index if not exists idx_donations_product_completed on public.donations(product_id, created_at) where status = 'completed';

create or replace function public.get_product_progress(p_product_ids uuid[])
returns table (product_id uuid, raised numeric, donated_quantity bigint, donors_count bigint)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(sum(d.amount), 0)::numeric, coalesce(sum(d.quantity), 0)::bigint,
    count(distinct d.donor_id) filter (where d.donor_id is not null)::bigint
  from public.products p
  left join public.donations d on d.product_id = p.id and d.status = 'completed'
  where p.id = any(p_product_ids)
  group by p.id;
$$;
revoke all on function public.get_product_progress(uuid[]) from public, anon, authenticated;
grant execute on function public.get_product_progress(uuid[]) to anon, authenticated;

-- The result shape intentionally changes: products no longer have one canonical campaign.
drop function if exists public.get_discoverable_products(text[]);
create function public.get_discoverable_products(p_categories text[] default null)
returns table (product_id uuid, campaign_id uuid, category text, name text, name_en text, description text, description_en text, price numeric, emoji text, donation_count bigint)
language sql stable security definer set search_path = public as $$
  select p.id, null::uuid, coalesce((select pha.audience from public.product_home_audiences pha where pha.product_id = p.id limit 1), 'general'),
    p.name, p.name_en, p.description, p.description_en, p.price, p.emoji,
    coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0)::bigint
  from public.products p left join public.donations d on d.product_id = p.id
  where p.active and (p_categories is null or exists (select 1 from public.product_home_audiences pha where pha.product_id = p.id and pha.audience = any(p_categories)))
  group by p.id order by coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0) desc, p.created_at desc;
$$;

drop function if exists public.get_discoverable_products_for_audience(text);
create function public.get_discoverable_products_for_audience(p_audience text)
returns table (product_id uuid, campaign_id uuid, category text, name text, name_en text, description text, description_en text, price numeric, emoji text, donation_count bigint)
language sql stable security definer set search_path = public as $$
  select p.id, null::uuid, pha.audience, p.name, p.name_en, p.description, p.description_en, p.price, p.emoji,
    coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0)::bigint
  from public.product_home_audiences pha join public.products p on p.id = pha.product_id and p.active
  left join public.donations d on d.product_id = p.id
  where pha.audience = p_audience group by p.id, pha.audience
  order by coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0) desc, max(p.created_at) desc;
$$;
