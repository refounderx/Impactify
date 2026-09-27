-- Donor-facing product taxonomy: the person whose life the donor affects and
-- the specific type of support. Products without a clear fit remain uncategorized.
alter table public.products
  add column if not exists donor_persona text,
  add column if not exists donor_subcategory text,
  add column if not exists donor_subcategory_en text;

alter table public.products
  drop constraint if exists products_donor_persona_check;

alter table public.products
  add constraint products_donor_persona_check
  check (donor_persona is null or donor_persona in ('baby', 'child', 'teen', 'soldier', 'elderly'));

update public.products as product
set donor_persona = classified.persona,
    donor_subcategory = classified.subcategory,
    donor_subcategory_en = classified.subcategory_en
from (values
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'elderly', 'ארוחות חמות ותזונה מזינה', 'Hot meals and nutritious food'),
  ('b2222222-2222-2222-2222-222222222222'::uuid, 'elderly', 'סל מזון שבועי קבוע', 'Recurring weekly food basket'),
  ('b3333333-3333-3333-3333-333333333333'::uuid, 'teen', 'סדנאות הכשרה מקצועית וציוד לימודי', 'Skills training and study supplies'),
  ('b4444444-4444-4444-4444-444444444444'::uuid, 'child', 'ילקוט מלא וציוד חזרה לבית הספר', 'Schoolbag and back-to-school supplies'),
  ('b5555555-5555-5555-5555-555555555555'::uuid, 'elderly', 'ערכת חורף חם', 'Warm winter kit'),
  ('7d1440e6-2911-4036-ae73-abdd7cd0e67b'::uuid, 'baby', 'סל קניות ראשוני לתינוק ולאם', 'First essentials basket for baby and mother'),
  ('9ae567b7-1797-4d5e-a5d0-f450afbc2e09'::uuid, 'elderly', 'כבוד, חום ומניעת בדידות', 'Dignity, warmth and preventing loneliness')
) as classified(id, persona, subcategory, subcategory_en)
where product.id = classified.id;

delete from public.product_home_audiences
where product_id in (
  'b1111111-1111-1111-1111-111111111111'::uuid,
  'b2222222-2222-2222-2222-222222222222'::uuid,
  'b3333333-3333-3333-3333-333333333333'::uuid,
  'b4444444-4444-4444-4444-444444444444'::uuid,
  'b5555555-5555-5555-5555-555555555555'::uuid,
  '7d1440e6-2911-4036-ae73-abdd7cd0e67b'::uuid,
  '9ae567b7-1797-4d5e-a5d0-f450afbc2e09'::uuid
);

insert into public.product_home_audiences (product_id, audience)
select id, donor_persona from public.products
where donor_persona is not null
  and id in (
    'b1111111-1111-1111-1111-111111111111'::uuid,
    'b2222222-2222-2222-2222-222222222222'::uuid,
    'b3333333-3333-3333-3333-333333333333'::uuid,
    'b4444444-4444-4444-4444-444444444444'::uuid,
    'b5555555-5555-5555-5555-555555555555'::uuid,
    '7d1440e6-2911-4036-ae73-abdd7cd0e67b'::uuid,
    '9ae567b7-1797-4d5e-a5d0-f450afbc2e09'::uuid
  );

drop function if exists public.get_discoverable_products(text[]);
drop function if exists public.get_discoverable_products_for_audience(text);

create function public.get_discoverable_products(p_categories text[] default null)
returns table (
  product_id uuid, campaign_id uuid, category text, name text, name_en text,
  description text, description_en text, price numeric, emoji text,
  image_url text, video_url text, donation_count bigint, donor_persona text,
  donor_subcategory text, donor_subcategory_en text
)
language sql stable security definer set search_path = public as $$
  select p.id, null::uuid, coalesce(p.donor_persona, 'general'), p.name, p.name_en,
    p.description, p.description_en, p.price, p.emoji, p.image_url, p.video_url,
    coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0)::bigint,
    p.donor_persona, p.donor_subcategory, p.donor_subcategory_en
  from public.products p
  left join public.donations d on d.product_id = p.id
  where p.active and (p_categories is null or p.donor_persona = any(p_categories))
  group by p.id
  order by coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0) desc, p.created_at desc;
$$;

create function public.get_discoverable_products_for_audience(p_audience text)
returns table (
  product_id uuid, campaign_id uuid, category text, name text, name_en text,
  description text, description_en text, price numeric, emoji text,
  image_url text, video_url text, donation_count bigint, donor_persona text,
  donor_subcategory text, donor_subcategory_en text
)
language sql stable security definer set search_path = public as $$
  select p.id, null::uuid, p.donor_persona, p.name, p.name_en,
    p.description, p.description_en, p.price, p.emoji, p.image_url, p.video_url,
    coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0)::bigint,
    p.donor_persona, p.donor_subcategory, p.donor_subcategory_en
  from public.products p
  left join public.donations d on d.product_id = p.id
  where p.active and p.donor_persona = p_audience
  group by p.id
  order by coalesce(sum(d.quantity) filter (where d.status = 'completed'), 0) desc, p.created_at desc;
$$;

revoke all on function public.get_discoverable_products(text[]) from public, anon, authenticated;
grant execute on function public.get_discoverable_products(text[]) to anon, authenticated;
revoke all on function public.get_discoverable_products_for_audience(text) from public, anon, authenticated;
grant execute on function public.get_discoverable_products_for_audience(text) to anon, authenticated;
