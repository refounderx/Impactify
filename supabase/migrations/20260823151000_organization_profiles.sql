alter table public.organizations
  add column if not exists founded text,
  add column if not exists founded_en text,
  add column if not exists ceo text,
  add column if not exists ceo_en text,
  add column if not exists volunteers integer not null default 0,
  add column if not exists address text,
  add column if not exists address_en text,
  add column if not exists phone text,
  add column if not exists video_gradient text not null default 'from-gray-700 to-gray-900';

update public.organizations set
  description = 'אנו פועלים מאז 2002 כדי להבטיח שאף אדם בישראל לא ילך לישון רעב. מספקים ארוחות חמות וסלי מזון לקשישים, ניצולי שואה ומשפחות במצוקה בכל רחבי הארץ.',
  description_en = 'We''ve operated since 2002 to ensure no one in Israel goes to bed hungry — delivering hot meals and food baskets to the elderly, Holocaust survivors, and families in need nationwide.',
  founded = 'אפריל 2002', founded_en = 'April 2002', ceo = 'ארז קרלנשטיין', ceo_en = 'Erez Karlenstein',
  volunteers = 61, address = 'רחוב התמיד 8, תל אביב', address_en = '8 HaTamid St, Tel Aviv',
  phone = '08-05080800', video_gradient = 'from-slate-700 to-slate-900'
where id = '11111111-1111-1111-1111-111111111111';

update public.organizations set
  description = 'עמותה המספקת ציוד לימודי, ספרים וליווי חינוכי לילדים בשכונות מצוקה, כדי שלכל ילד תהיה הזדמנות שווה להצליח.',
  description_en = 'A nonprofit providing school supplies, books, and educational mentoring to children in underserved neighborhoods, so every child gets an equal shot at success.',
  founded = 'ינואר 2010', founded_en = 'January 2010', ceo = 'מיכל אבני', ceo_en = 'Michal Avni',
  volunteers = 34, address = 'שדרות רוטשילד 22, תל אביב', address_en = '22 Rothschild Blvd, Tel Aviv',
  phone = '03-6120099', video_gradient = 'from-blue-700 to-teal-800'
where id = '22222222-2222-2222-2222-222222222222';

update public.organizations set
  description = 'מספקים מקלט מוגן, ליווי משפטי וטיפול פסיכולוגי לנשים הנמלטות ממצבי אלימות, ועוזרים להן לבנות מחדש חיים עצמאיים.',
  description_en = 'We provide safe shelter, legal accompaniment, and psychological care to women fleeing violence, helping them rebuild independent lives.',
  founded = 'מרץ 2005', founded_en = 'March 2005', ceo = 'דנה שגיא', ceo_en = 'Dana Sagi',
  volunteers = 48, address = 'רחוב יפו 55, ירושלים', address_en = '55 Jaffa St, Jerusalem',
  phone = '02-6234455', video_gradient = 'from-rose-700 to-pink-900'
where id = '33333333-3333-3333-3333-333333333333';

update public.organizations set
  description = 'מחברים קהילות ומתנדבים סביב פרויקטים סביבתיים וחברתיים — מגינות קהילתיות ועד סיוע ישיר למשפחות.',
  description_en = 'We connect communities and volunteers around environmental and social projects — from community gardens to direct family support.',
  founded = 'ספטמבר 2008', founded_en = 'September 2008', ceo = 'יובל נחמן', ceo_en = 'Yuval Nachman',
  volunteers = 27, address = 'דרך השלום 3, באר שבע', address_en = '3 HaShalom Rd, Beer Sheva',
  phone = '08-6440077', video_gradient = 'from-green-700 to-teal-900'
where id = '44444444-4444-4444-4444-444444444444';

update public.organizations set
  description = 'מפעילים מרכזי יום לנוער בסיכון, המעניקים סביבה בטוחה, עזרה בשיעורים ומנחים מקצועיים, שישה ימים בשבוע.',
  description_en = 'We run day centers for at-risk youth, offering a safe environment, homework help, and professional mentors, six days a week.',
  founded = 'יוני 2013', founded_en = 'June 2013', ceo = 'אורית בכר', ceo_en = 'Orit Bachar',
  volunteers = 42, address = 'רחוב הרצל 90, חיפה', address_en = '90 Herzl St, Haifa',
  phone = '04-8551122', video_gradient = 'from-amber-700 to-orange-900'
where id = '55555555-5555-5555-5555-555555555555';
