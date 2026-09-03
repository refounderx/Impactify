-- Creates three public-content organizations and one charitable product for each.
-- This script is idempotent: running it again will not duplicate the products.

begin;

with requested_organizations(name, name_en, initials, description, description_en, goals, registration_number, color) as (
  values
    ('שולחן חם', 'Warm Table', 'שח', 'עמותה שמסייעת למשפחות באמצעות סל מזון מזין ומכבד.', 'Supporting families with dignified, nutritious food baskets.', '["ביטחון תזונתי","סיוע למשפחות"]'::jsonb, 'DEMO-WARM-TABLE-2026', '#E9833A'),
    ('לב של כבוד', 'Heart of Dignity', 'לכ', 'עמותה שמחזקת אזרחים ותיקים באמצעות ערכות נוחות, קשר וליווי.', 'Supporting older adults with comfort, connection, and practical care.', '["רווחת קשישים","מניעת בדידות"]'::jsonb, 'DEMO-HEART-OF-DIGNITY-2026', '#8167B8'),
    ('התחלה רכה', 'Gentle Start', 'הר', 'עמותה שמסייעת למשפחות בתחילת דרכן עם ערכות חיוניות לתינוקות.', 'Helping new families with essential newborn-care kits.', '["רווחת תינוקות","תמיכה במשפחות צעירות"]'::jsonb, 'DEMO-GENTLE-START-2026', '#4FA7A0')
), created_organizations as (
  insert into public.organizations (
    name, name_en, initials, description, description_en, goals,
    registration_number, color, verified
  ) select name, name_en, initials, description, description_en, goals, registration_number, color, false
    from requested_organizations requested
    where not exists (select 1 from public.organizations existing where existing.registration_number = requested.registration_number)
  returning id, registration_number
), organizations_by_key as (
  select id, registration_number from created_organizations
  union all
  select id, registration_number from public.organizations
  where registration_number in (
    'DEMO-WARM-TABLE-2026',
    'DEMO-HEART-OF-DIGNITY-2026',
    'DEMO-GENTLE-START-2026'
  )
)
insert into public.products (org_id, name, name_en, description, description_en, price, emoji, image_url, video_url, active)
select organization.id, product.name, product.name_en, product.description, product.description_en, product.price, product.emoji, product.image_url, product.video_url, true
from organizations_by_key organization
join (
  values
    ('DEMO-WARM-TABLE-2026', 'סל מזון מזין למשפחה', 'Nutritious Food Basket', 'סל אחד מספק למשפחה מצרכים בסיסיים ומזינים לשבוע: ירקות, אורז, קטניות, לחם ושמן.', 'One donation provides a family with a week of nutritious essentials: vegetables, rice, legumes, bread, and oil.', 180.00::numeric, '🥕', '/images/products/nutritious-food-basket.png', 'https://www.youtube.com/watch?v=idtvY5lN314'),
    ('DEMO-HEART-OF-DIGNITY-2026', 'ערכת חום ונוחות לקשיש', 'Comfort & Care Package', 'ערכת תמיכה אישית הכוללת שמיכה רכה, תה, מוצרי טיפוח ופריטים קטנים שמחזקים תחושת בית וקשר.', 'A personal care package with a soft blanket, tea, toiletries, and small comforts that foster warmth and connection.', 145.00::numeric, '🫶', '/images/products/elder-care-package.png', 'https://www.youtube.com/watch?v=_l_YdguQyUE'),
    ('DEMO-GENTLE-START-2026', 'ערכת התחלה לתינוק', 'Newborn Essentials Kit', 'ערכת בסיס למשפחה עם תינוק חדש: בגדי תינוק, חיתולים, מגבונים, שמיכה רכה וצעצוע קטן.', 'A practical newborn kit with baby clothes, diapers, wipes, a soft blanket, and a small toy.', 220.00::numeric, '🧸', '/images/products/newborn-care-kit.png', 'https://www.youtube.com/shorts/LKR4clfMD8Q')
) as product(registration_number, name, name_en, description, description_en, price, emoji, image_url, video_url)
  on product.registration_number = organization.registration_number
where not exists (
  select 1 from public.products existing
  where existing.org_id = organization.id and existing.name = product.name
);

update public.products product
set image_url = media.image_url, video_url = media.video_url
from public.organizations organization
join (values
  ('DEMO-WARM-TABLE-2026', 'סל מזון מזין למשפחה', '/images/products/nutritious-food-basket.png', 'https://www.youtube.com/watch?v=idtvY5lN314'),
  ('DEMO-HEART-OF-DIGNITY-2026', 'ערכת חום ונוחות לקשיש', '/images/products/elder-care-package.png', 'https://www.youtube.com/watch?v=_l_YdguQyUE'),
  ('DEMO-GENTLE-START-2026', 'ערכת התחלה לתינוק', '/images/products/newborn-care-kit.png', 'https://www.youtube.com/shorts/LKR4clfMD8Q')
) as media(registration_number, product_name, image_url, video_url)
  on media.registration_number = organization.registration_number
where product.org_id = organization.id and product.name = media.product_name;

insert into public.campaigns (title, title_en, short_desc, short_desc_en, story, story_en, org_id, category, goal, end_date, status, emoji)
select campaign.title, campaign.title_en, campaign.short_desc, campaign.short_desc_en, campaign.story, campaign.story_en,
  organization.id, campaign.category, campaign.goal, current_date + 90, 'active', campaign.emoji
from public.organizations organization
join (values
  ('DEMO-WARM-TABLE-2026', 'שבוע של ביטחון תזונתי', 'A Week of Food Security', 'ממלאים סל מזון למשפחה לשבוע.', 'A nourishing basket for a family for one week.', 'כל תרומה מספקת למשפחה מצרכים בסיסיים ומזינים.', 'Every donation provides a family with nutritious essentials.', 'food', 25000.00::numeric, '🥕'),
  ('DEMO-HEART-OF-DIGNITY-2026', 'חום, קשר וכבוד בגיל השלישי', 'Warmth and Dignity for Older Adults', 'מחזקים אזרחים ותיקים בערכות נוחות אישיות.', 'Comfort packages that support older adults.', 'כל ערכה מעניקה רגע של בית, נוחות וקשר אנושי.', 'Every package brings comfort, dignity, and connection.', 'elderly', 18000.00::numeric, '🫶'),
  ('DEMO-GENTLE-START-2026', 'התחלה רכה לכל תינוק', 'A Gentle Start for Every Newborn', 'ערכות חיוניות למשפחות עם תינוק חדש.', 'Essential newborn-care kits for new families.', 'כל תרומה מציידת משפחה צעירה בפריטים הראשונים שהיא צריכה.', 'Every donation equips a young family with essential newborn items.', 'babies', 30000.00::numeric, '🧸')
) as campaign(registration_number, title, title_en, short_desc, short_desc_en, story, story_en, category, goal, emoji)
  on campaign.registration_number = organization.registration_number
where not exists (select 1 from public.campaigns existing where existing.org_id = organization.id and existing.title = campaign.title);

insert into public.campaign_products (campaign_id, product_id)
select campaign.id, product.id
from public.campaigns campaign
join public.products product on product.org_id = campaign.org_id
where (campaign.title, product.name) in (
  ('שבוע של ביטחון תזונתי', 'סל מזון מזין למשפחה'),
  ('חום, קשר וכבוד בגיל השלישי', 'ערכת חום ונוחות לקשיש'),
  ('התחלה רכה לכל תינוק', 'ערכת התחלה לתינוק')
)
on conflict do nothing;

-- Make the elderly and newborn products available from their matching home-page audience cards.
insert into public.product_home_audiences (product_id, audience)
select product.id, audience.audience
from public.products product
join public.organizations organization on organization.id = product.org_id
join (values
  ('DEMO-HEART-OF-DIGNITY-2026', 'elderly'),
  ('DEMO-GENTLE-START-2026', 'baby')
) as audience(registration_number, audience)
  on audience.registration_number = organization.registration_number
on conflict do nothing;

commit;

select organization.name as organization_name, campaign.title as campaign_title, product.name as product_name, product.price, product.emoji
from public.products product
join public.organizations organization on organization.id = product.org_id
left join public.campaign_products campaign_product on campaign_product.product_id = product.id
left join public.campaigns campaign on campaign.id = campaign_product.campaign_id
where organization.registration_number like 'DEMO-%-2026'
order by organization.name, campaign.title;
