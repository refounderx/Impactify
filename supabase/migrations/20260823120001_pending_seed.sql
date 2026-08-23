-- ── Payment methods (donor_id = null — replace with real auth.uid() after user creation)
insert into public.payment_methods (donor_id, brand, last_four) values
  (null, 'Visa', '2234'),
  (null, 'Mastercard', '4584');

-- ── System updates (donor_id = null = demo/broadcast; replace with real auth.uid() as needed)
insert into public.system_updates
  (donor_id, org_id, title, title_en, detail, detail_en, status, action_label, action_label_en)
values
  (null, '44444444-4444-4444-4444-444444444444',
   'התקבלה בקשה להוראת קבע', 'Standing order request received',
   'בקשתך להפעלת הוראת קבע התקבלה ותיכנס לתוקף בחיוב הבא',
   'Your standing order request was received and will take effect on the next charge',
   'pending', 'לצפייה', 'View'),

  (null, '44444444-4444-4444-4444-444444444444',
   'הופקה תרומה חדשה עבור פעולת שיוך', 'A new donation was issued for an allocation action',
   null, null, 'info', null, null),

  (null, '11111111-1111-1111-1111-111111111111',
   'חיוב הוראת קבע בוצע בהצלחה', 'Standing order charge completed successfully',
   null, null, 'info', null, null);


-- ── Hero cards (image_url = null — swap in real uploaded image URLs later)
insert into public.hero_cards (image_url, bubble_text, bubble_text_en, display_order) values
  (null, '20 אנשים העניקו כבר היום לחיילים בודדים', '20 people already donated today to lone soldiers', 1),
  (null, '12 אנשים העניקו כבר היום לקשישים', '12 people already donated today to the elderly', 2),
  (null, '35 אנשים העניקו כבר היום לילדים', '35 people already donated today to children', 3);
