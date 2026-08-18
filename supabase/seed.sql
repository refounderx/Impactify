-- ============================================================
-- Impactify — Seed Data (from mock-data.ts)
-- Run AFTER schema.sql
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── Organizations ────────────────────────────────────────────
insert into public.organizations (id, name, name_en, initials, color, verified) values
  ('11111111-1111-1111-1111-111111111111', 'אוכל לכולם',    'Food For All',        'FF', '#FF6B6B', true),
  ('22222222-2222-2222-2222-222222222222', 'חינוך ועתיד',   'Education & Future',  'EF', '#4ECDC4', true),
  ('33333333-3333-3333-3333-333333333333', 'בית חם',        'Warm Home',           'WH', '#45B7D1', true),
  ('44444444-4444-4444-4444-444444444444', 'עמותת ידידים',  'Friends Foundation',  'FF', '#96CEB4', true),
  ('55555555-5555-5555-5555-555555555555', 'ילדים בסיכון',  'At-Risk Children',    'AC', '#F7DC6F', true);

-- ── Products ─────────────────────────────────────────────────
-- Note: UUIDs use only valid hex chars (0-9, a-f)
insert into public.products (id, org_id, name, name_en, description, description_en, price, emoji) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'ארוחה חמה', 'Hot Meal',
   'ארוחה מזינה ומחממת לאדם אחד ליום', 'A warm, nutritious meal for one person per day',
   50, '🍲'),
  ('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'סל מזון שבועי', 'Weekly Food Basket',
   'סל מזון מלא לשבוע לאדם קשיש', 'A full week''s food basket for one elderly person',
   150, '🛒'),
  ('b3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'ציוד לימוד', 'School Supplies',
   'מחברות, עטים וציוד לימוד לסטודנט', 'Notebooks, pens and school supplies for one student',
   80, '✏️'),
  ('b4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222',
   'סל ספרים', 'Book Basket',
   'ספרי לימוד לשנת לימודים שלמה', 'Textbooks for a full academic year',
   120, '📚'),
  ('b5555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444',
   'חבילת בגדים', 'Clothing Package',
   'חבילת בגדים לחורף לאדם אחד', 'A winter clothing package for one person',
   200, '🧥');

-- ── Campaigns ────────────────────────────────────────────────
insert into public.campaigns
  (id, title, title_en, short_desc, short_desc_en, story, story_en,
   org_id, category, goal, raised, donors_count, gradient, emoji, status, end_date)
values
  ('c1111111-1111-1111-1111-111111111111',
   'ארוחות חמות לקשישים בחורף', 'Hot Meals for the Elderly',
   'בחורף הקשה, קשישים רבים מתקשים לממן ארוחות חמות. אנחנו מספקים שלוש ארוחות יומיות.',
   'In the harsh winter, many elderly struggle to afford hot meals. We provide three daily meals to isolated seniors.',
   'בישראל, יותר מ-180,000 קשישים חיים מתחת לקו העוני. בחורף, הצורך בארוחה חמה הופך לקריטי. הפרויקט שלנו מאפשר לקשישים בודדים לקבל שלוש ארוחות חמות ומזינות בכל יום, ישירות לדלת ביתם.',
   'In Israel, over 180,000 elderly people live below the poverty line. In winter, the need for a hot meal becomes critical. Our project delivers three warm, nutritious meals every day directly to isolated seniors'' homes.',
   '11111111-1111-1111-1111-111111111111',
   'food', 25000, 18500, 243,
   'from-red-400 to-orange-400', '🍲', 'active', current_date + 14),

  ('c2222222-2222-2222-2222-222222222222',
   'ספרים לילדי שכונות מצוקה', 'Books for Underprivileged Children',
   'ספרים הם המפתח לעתיד טוב יותר. אנחנו מחלקים ספרי לימוד לילדים בשכונות מצוקה.',
   'Books are the key to a better future. We distribute textbooks to children in underserved neighborhoods.',
   'ילדים רבים נכנסים לשנת הלימודים ללא הציוד הבסיסי הדרוש להם. הפרויקט שלנו מבטיח שכל ילד יקבל את הספרים והציוד שהוא צריך.',
   'Many children start the school year without basic supplies. Our project ensures every child, regardless of family income, receives the books and materials they need to succeed.',
   '22222222-2222-2222-2222-222222222222',
   'education', 25000, 11250, 156,
   'from-blue-400 to-teal-400', '📚', 'active', current_date + 21),

  ('c3333333-3333-3333-3333-333333333333',
   'מרכז יום לנוער בסיכון', 'Day Center for At-Risk Youth',
   'מרכז יום שמספק לנוער בסיכון מקום בטוח, עזרה בשיעורים ופעילויות העשרה.',
   'A day center providing at-risk youth with a safe space, homework help, and enrichment activities.',
   'נוער בסיכון זקוק לסביבה מוגנת ומטפחת. המרכז שלנו פתוח 6 ימים בשבוע ומציע עזרה בשיעורים, פעילויות יצירה, מרחב קהילתי ומנחים מקצועיים.',
   'At-risk youth need a safe, nurturing environment. Our center is open 6 days a week, offering homework assistance, creative activities, a community space, and professional mentors.',
   '55555555-5555-5555-5555-555555555555',
   'children', 50000, 45600, 612,
   'from-purple-400 to-pink-400', '🏠', 'active', current_date + 5),

  ('c4444444-4444-4444-4444-444444444444',
   'עזרה לניצולי שואה קשישים', 'Support for Holocaust Survivors',
   'ניצולי שואה רבים חיים בעוני ובבדידות. אנחנו מספקים להם סיוע כלכלי וחברה.',
   'Many Holocaust survivors live in poverty and isolation. We provide financial support and companionship.',
   'יותר מ-200,000 ניצולי שואה חיים בישראל, ורבים מהם מתמודדים עם קשיים כלכליים ובדידות. הפרויקט שלנו מספק לכל אחד מהם ביקורים שבועיים, סיוע כלכלי ומסגרת חברתית חמה.',
   'Over 200,000 Holocaust survivors live in Israel, many facing financial hardship and loneliness. Our project provides each of them with weekly visits, financial aid, and a warm social community.',
   '44444444-4444-4444-4444-444444444444',
   'elderly', 30000, 8200, 98,
   'from-yellow-400 to-amber-400', '✡️', 'active', current_date + 45),

  ('c5555555-5555-5555-5555-555555555555',
   'גינה קהילתית בנגב', 'Community Garden in the Negev',
   'הקמת גינה קהילתית שתספק ירקות טריים לתושבי הנגב ותחזק את הקהילה.',
   'Building a community garden to provide fresh vegetables to Negev residents and strengthen community bonds.',
   'הגינה הקהילתית שלנו בנגב תשמש לא רק כמקור לירקות טריים, אלא גם כמרחב קהילתי שמחזק קשרים שכנים.',
   'Our Negev community garden serves not just as a source of fresh vegetables, but also as a community space that strengthens neighborhood ties.',
   '44444444-4444-4444-4444-444444444444',
   'environment', 25000, 15500, 189,
   'from-green-400 to-teal-500', '🌱', 'active', current_date + 30),

  ('c6666666-6666-6666-6666-666666666666',
   'בית חם לנשים בסכנה', 'Safe House for Women in Danger',
   'בית חם ומוגן לנשים שנמלטות ממצבי אלימות. אנחנו מספקים מקלט, ליווי ותמיכה.',
   'A warm, protected home for women fleeing violence. We provide shelter, legal support, and psychological care.',
   'כל שנה פונות לארגון שלנו מאות נשים הנמלטות מאלימות ביתית. אנחנו מספקים להן מקלט חינם, ליווי משפטי, טיפול פסיכולוגי ועזרה בשיקום ועצמאות.',
   'Every year hundreds of women fleeing domestic violence turn to our organization. We provide free shelter, legal accompaniment, psychological treatment, and help rebuilding independence.',
   '33333333-3333-3333-3333-333333333333',
   'health', 40000, 22000, 334,
   'from-rose-400 to-pink-500', '🏡', 'active', current_date + 18);

-- ── Campaign ↔ Product links ─────────────────────────────────
insert into public.campaign_products (campaign_id, product_id) values
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111'),
  ('c1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222'),
  ('c2222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333'),
  ('c2222222-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444'),
  ('c3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333'),
  ('c4444444-4444-4444-4444-444444444444', 'b1111111-1111-1111-1111-111111111111'),
  ('c4444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222'),
  ('c4444444-4444-4444-4444-444444444444', 'b5555555-5555-5555-5555-555555555555'),
  ('c5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555'),
  ('c6666666-6666-6666-6666-666666666666', 'b2222222-2222-2222-2222-222222222222'),
  ('c6666666-6666-6666-6666-666666666666', 'b4444444-4444-4444-4444-444444444444');

-- ── Communities ──────────────────────────────────────────────
insert into public.communities (id, name, name_en, org_id, total_raised, donors_count) values
  ('cc111111-1111-1111-1111-111111111111',
   'קהילת רמת אביב', 'Ramat Aviv Community',
   '11111111-1111-1111-1111-111111111111', 14200, 87),
  ('cc222222-2222-2222-2222-222222222222',
   'קהילת הצפון ת״א', 'North Tel Aviv Community',
   '11111111-1111-1111-1111-111111111111', 21400, 134),
  ('cc333333-3333-3333-3333-333333333333',
   'קהילת גבעתיים', 'Givatayim Community',
   '22222222-2222-2222-2222-222222222222', 9800, 61);

-- ── Campaign updates (non-user-specific — visible to all) ─────
insert into public.campaign_updates (id, campaign_id, org_id, description, description_en, has_video, gradient) values
  ('u1111111-1111-1111-1111-111111111111',
   'c4444444-4444-4444-4444-444444444444',
   '44444444-4444-4444-4444-444444444444',
   'מעניקים לגדוד לביא את הפינוקים שתרמתם',
   'Delivering your treats to the Lavi Brigade soldiers',
   true, 'from-gray-700 to-gray-900'),

  ('u2222222-2222-2222-2222-222222222222',
   'c4444444-4444-4444-4444-444444444444',
   '44444444-4444-4444-4444-444444444444',
   'מעניקים לגדוד לביא את הפינוקים שתרמתם',
   'Delivering your treats to the Lavi Brigade soldiers',
   false, 'from-gray-300 to-gray-400'),

  ('u3333333-3333-3333-3333-333333333333',
   'c1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   'הוגשו ארוחות חמות לקשישים בשכונת שפירא',
   'Hot meals served to elderly in Shapira neighborhood',
   false, 'from-orange-400 to-red-400'),

  ('u4444444-4444-4444-4444-444444444444',
   'c4444444-4444-4444-4444-444444444444',
   '44444444-4444-4444-4444-444444444444',
   'מעניקים לגדוד לביא את הפינוקים שתרמתם',
   'Delivering your treats to the Lavi Brigade soldiers',
   true, 'from-gray-700 to-gray-900');

-- ── Demo donations (donor_id = null — replace with real auth.uid() in production)
-- These represent the mock ProductDonations data seeded for structure reference.
-- To activate for a specific user: UPDATE donations SET donor_id = '<user-uuid>' WHERE donor_id IS NULL;
insert into public.donations
  (campaign_id, org_id, product_id, amount, donation_type, quantity,
   status, last_four, card_brand, receipt_id, created_at)
values
  -- pd1: פק"ל קפה + פינוקים, 2 units, הו"ק, ₪150
  ('c4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
   'b2222222-2222-2222-2222-222222222222',
   150, 'הו"ק', 2, 'completed', '9802', 'Mastercard', 'R-2022-001',
   '2022-02-12 10:00:00+00'),

  ('c4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
   'b2222222-2222-2222-2222-222222222222',
   150, 'חד"פ', 2, 'completed', '9802', 'Mastercard', 'R-2022-002',
   '2022-03-12 10:00:00+00'),

  ('c4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
   'b2222222-2222-2222-2222-222222222222',
   150, 'חד3/6', 2, 'completed', '9802', 'Mastercard', 'R-2022-003',
   '2022-04-12 10:00:00+00'),

  ('c4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
   'b2222222-2222-2222-2222-222222222222',
   150, 'הו"ק', 2, 'completed', '9802', 'Mastercard', 'R-2023-001',
   '2023-08-13 21:23:00+00'),

  -- pd3: ארוחות חמות חודשי, 30 units, הו"ק, ₪50 (recurring)
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'b1111111-1111-1111-1111-111111111111',
   50, 'הו"ק', 30, 'completed', '9802', 'Mastercard', 'R-2023-002',
   '2023-08-13 21:23:00+00'),

  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'b1111111-1111-1111-1111-111111111111',
   50, 'הו"ק', 30, 'completed', '9802', 'Mastercard', 'R-2023-003',
   '2023-07-13 21:23:00+00');
