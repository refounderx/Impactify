-- Campaign creation stores categories in Hebrew; map existing linked products to home audiences.
insert into public.product_home_audiences (product_id, audience)
select distinct cp.product_id, mapping.audience
from public.campaign_products cp
join public.campaigns c on c.id = cp.campaign_id
cross join lateral (values
  (case when c.category in ('elderly', 'קשישים') then 'elderly' end),
  (case when c.category in ('soldier', 'חיילים') then 'soldier' end),
  (case when c.category in ('education', 'children', 'חינוך', 'ילדים') then 'teen' end),
  (case when c.category in ('education', 'children', 'חינוך', 'ילדים') then 'child' end)
) as mapping(audience)
where mapping.audience is not null
on conflict do nothing;
