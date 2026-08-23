-- ── Campaign updates (non-user-specific — visible to all) ─────
insert into public.campaign_updates (id, campaign_id, org_id, description, description_en, has_video, gradient) values
  ('a1111111-1111-1111-1111-111111111111',
   'c4444444-4444-4444-4444-444444444444',
   '44444444-4444-4444-4444-444444444444',
   'מעניקים לגדוד לביא את הפינוקים שתרמתם',
   'Delivering your treats to the Lavi Brigade soldiers',
   true, 'from-gray-700 to-gray-900'),

  ('a2222222-2222-2222-2222-222222222222',
   'c4444444-4444-4444-4444-444444444444',
   '44444444-4444-4444-4444-444444444444',
   'מעניקים לגדוד לביא את הפינוקים שתרמתם',
   'Delivering your treats to the Lavi Brigade soldiers',
   false, 'from-gray-300 to-gray-400'),

  ('a3333333-3333-3333-3333-333333333333',
   'c1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   'הוגשו ארוחות חמות לקשישים בשכונת שפירא',
   'Hot meals served to elderly in Shapira neighborhood',
   false, 'from-orange-400 to-red-400'),

  ('a4444444-4444-4444-4444-444444444444',
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
