export const DONOR_NAME = "ישראל ישראלי";
export const DONOR_NAME_EN = "Israel Israelson";
export const DONOR_PHONE = "0501234567";
export const DONOR_EMAIL = "israel@example.com";
export const DONOR_ID_NUMBER = "203456789";
export const DONOR_JOIN_DATE = "13/05/2022";
export const ORG_NAME = "אוכל לכולם";
export const ORG_NAME_EN = "Food For All";
export const COMMUNITY_NAME = "קהילת רמת אביב";
export const COMMUNITY_NAME_EN = "Ramat Aviv Community";

// Landing hero: 3 image+bubble pairs, mirrors the `hero_cards` Supabase table
// (see supabase/schema.sql migration 2026-08-23). `imageUrl: null` renders the
// `placeholderClass` color block instead — swap in a real image URL later and
// it takes over automatically (see HeroImageCard in Hero.tsx).
export const heroCards: {
  id: string;
  imageUrl: string | null;
  placeholderClass: string;
  bubbleText: string;
  bubbleTextEn: string;
}[] = [
  {
    id: "hero-soldier",
    imageUrl: null,
    placeholderClass: "bg-gray-500",
    bubbleText: "20 אנשים העניקו כבר היום לחיילים בודדים",
    bubbleTextEn: "20 people already donated today to lone soldiers",
  },
  {
    id: "hero-elderly",
    imageUrl: null,
    placeholderClass: "bg-gray-200",
    bubbleText: "12 אנשים העניקו כבר היום לקשישים",
    bubbleTextEn: "12 people already donated today to the elderly",
  },
  {
    id: "hero-child",
    imageUrl: null,
    placeholderClass: "bg-gray-100",
    bubbleText: "35 אנשים העניקו כבר היום לילדים",
    bubbleTextEn: "35 people already donated today to children",
  },
];

export const categories = [
  { id: "all", label: "הכל", emoji: "✨" },
  { id: "food", label: "מזון", emoji: "🍽️" },
  { id: "education", label: "חינוך", emoji: "📚" },
  { id: "health", label: "בריאות", emoji: "❤️" },
  { id: "elderly", label: "קשישים", emoji: "👴" },
  { id: "children", label: "ילדים", emoji: "👶" },
  { id: "environment", label: "סביבה", emoji: "🌱" },
];

export const organizations = [
  {
    id: "1", name: "אוכל לכולם", nameEn: "Food For All", initials: "FF", color: "#FF6B6B", verified: true,
    bio: "אנו פועלים מאז 2002 כדי להבטיח שאף אדם בישראל לא ילך לישון רעב. מספקים ארוחות חמות וסלי מזון לקשישים, ניצולי שואה ומשפחות במצוקה בכל רחבי הארץ.",
    bioEn: "We've operated since 2002 to ensure no one in Israel goes to bed hungry — delivering hot meals and food baskets to the elderly, Holocaust survivors, and families in need nationwide.",
    founded: "אפריל 2002", foundedEn: "April 2002",
    ceo: "ארז קרלנשטיין", ceoEn: "Erez Karlenstein",
    volunteers: 61,
    address: "רחוב התמיד 8, תל אביב", addressEn: "8 HaTamid St, Tel Aviv",
    phone: "08-05080800",
    videoGradient: "from-slate-700 to-slate-900",
  },
  {
    id: "2", name: "חינוך ועתיד", nameEn: "Education & Future", initials: "EF", color: "#4ECDC4", verified: true,
    bio: "עמותה המספקת ציוד לימודי, ספרים וליווי חינוכי לילדים בשכונות מצוקה, כדי שלכל ילד תהיה הזדמנות שווה להצליח.",
    bioEn: "A nonprofit providing school supplies, books, and educational mentoring to children in underserved neighborhoods, so every child gets an equal shot at success.",
    founded: "ינואר 2010", foundedEn: "January 2010",
    ceo: "מיכל אבני", ceoEn: "Michal Avni",
    volunteers: 34,
    address: "שדרות רוטשילד 22, תל אביב", addressEn: "22 Rothschild Blvd, Tel Aviv",
    phone: "03-6120099",
    videoGradient: "from-blue-700 to-teal-800",
  },
  {
    id: "3", name: "בית חם", nameEn: "Warm Home", initials: "WH", color: "#45B7D1", verified: true,
    bio: "מספקים מקלט מוגן, ליווי משפטי וטיפול פסיכולוגי לנשים הנמלטות ממצבי אלימות, ועוזרים להן לבנות מחדש חיים עצמאיים.",
    bioEn: "We provide safe shelter, legal accompaniment, and psychological care to women fleeing violence, helping them rebuild independent lives.",
    founded: "מרץ 2005", foundedEn: "March 2005",
    ceo: "דנה שגיא", ceoEn: "Dana Sagi",
    volunteers: 48,
    address: "רחוב יפו 55, ירושלים", addressEn: "55 Jaffa St, Jerusalem",
    phone: "02-6234455",
    videoGradient: "from-rose-700 to-pink-900",
  },
  {
    id: "4", name: "עמותת ידידים", nameEn: "Friends Foundation", initials: "FF", color: "#96CEB4", verified: true,
    bio: "מחברים קהילות ומתנדבים סביב פרויקטים סביבתיים וחברתיים — מגינות קהילתיות ועד סיוע ישיר למשפחות.",
    bioEn: "We connect communities and volunteers around environmental and social projects — from community gardens to direct family support.",
    founded: "ספטמבר 2008", foundedEn: "September 2008",
    ceo: "יובל נחמן", ceoEn: "Yuval Nachman",
    volunteers: 27,
    address: "דרך השלום 3, באר שבע", addressEn: "3 HaShalom Rd, Beer Sheva",
    phone: "08-6440077",
    videoGradient: "from-green-700 to-teal-900",
  },
  {
    id: "5", name: "ילדים בסיכון", nameEn: "At-Risk Children", initials: "AC", color: "#F7DC6F", verified: true,
    bio: "מפעילים מרכזי יום לנוער בסיכון, המעניקים סביבה בטוחה, עזרה בשיעורים ומנחים מקצועיים, שישה ימים בשבוע.",
    bioEn: "We run day centers for at-risk youth, offering a safe environment, homework help, and professional mentors, six days a week.",
    founded: "יוני 2013", foundedEn: "June 2013",
    ceo: "אורית בכר", ceoEn: "Orit Bachar",
    volunteers: 42,
    address: "רחוב הרצל 90, חיפה", addressEn: "90 Herzl St, Haifa",
    phone: "04-8551122",
    videoGradient: "from-amber-700 to-orange-900",
  },
];

export const campaigns = [
  {
    id: "1",
    title: "ארוחות חמות לקשישים בחורף", titleEn: "Hot Meals for the Elderly",
    orgId: "1", category: "food", raised: 18500, goal: 25000, donors: 243, daysLeft: 14,
    gradient: "from-red-400 to-orange-400", emoji: "🍲",
    shortDesc: "בחורף הקשה, קשישים רבים מתקשים לממן ארוחות חמות. אנחנו מספקים שלוש ארוחות יומיות.",
    shortDescEn: "In the harsh winter, many elderly struggle to afford hot meals. We provide three daily meals to isolated seniors.",
    story: "בישראל, יותר מ-180,000 קשישים חיים מתחת לקו העוני. בחורף, הצורך בארוחה חמה הופך לקריטי. הפרויקט שלנו מאפשר לקשישים בודדים לקבל שלוש ארוחות חמות ומזינות בכל יום, ישירות לדלת ביתם.",
    storyEn: "In Israel, over 180,000 elderly people live below the poverty line. In winter, the need for a hot meal becomes critical. Our project delivers three warm, nutritious meals every day directly to isolated seniors' homes.",
    productIds: ["1", "2"],
  },
  {
    id: "2",
    title: "ספרים לילדי שכונות מצוקה", titleEn: "Books for Underprivileged Children",
    orgId: "2", category: "education", raised: 11250, goal: 25000, donors: 156, daysLeft: 21,
    gradient: "from-blue-400 to-teal-400", emoji: "📚",
    shortDesc: "ספרים הם המפתח לעתיד טוב יותר. אנחנו מחלקים ספרי לימוד לילדים בשכונות מצוקה.",
    shortDescEn: "Books are the key to a better future. We distribute textbooks to children in underserved neighborhoods.",
    story: "ילדים רבים נכנסים לשנת הלימודים ללא הציוד הבסיסי הדרוש להם. הפרויקט שלנו מבטיח שכל ילד יקבל את הספרים והציוד שהוא צריך.",
    storyEn: "Many children start the school year without basic supplies. Our project ensures every child, regardless of family income, receives the books and materials they need to succeed.",
    productIds: ["3", "4"],
  },
  {
    id: "3",
    title: "מרכז יום לנוער בסיכון", titleEn: "Day Center for At-Risk Youth",
    orgId: "5", category: "children", raised: 45600, goal: 50000, donors: 612, daysLeft: 5,
    gradient: "from-purple-400 to-pink-400", emoji: "🏠",
    shortDesc: "מרכז יום שמספק לנוער בסיכון מקום בטוח, עזרה בשיעורים ופעילויות העשרה.",
    shortDescEn: "A day center providing at-risk youth with a safe space, homework help, and enrichment activities.",
    story: "נוער בסיכון זקוק לסביבה מוגנת ומטפחת. המרכז שלנו פתוח 6 ימים בשבוע ומציע עזרה בשיעורים, פעילויות יצירה, מרחב קהילתי ומנחים מקצועיים.",
    storyEn: "At-risk youth need a safe, nurturing environment. Our center is open 6 days a week, offering homework assistance, creative activities, a community space, and professional mentors.",
    productIds: ["3"],
  },
  {
    id: "4",
    title: "עזרה לניצולי שואה קשישים", titleEn: "Support for Holocaust Survivors",
    orgId: "4", category: "elderly", raised: 8200, goal: 30000, donors: 98, daysLeft: 45,
    gradient: "from-yellow-400 to-amber-400", emoji: "✡️",
    shortDesc: "ניצולי שואה רבים חיים בעוני ובבדידות. אנחנו מספקים להם סיוע כלכלי וחברה.",
    shortDescEn: "Many Holocaust survivors live in poverty and isolation. We provide financial support and companionship.",
    story: "יותר מ-200,000 ניצולי שואה חיים בישראל, ורבים מהם מתמודדים עם קשיים כלכליים ובדידות. הפרויקט שלנו מספק לכל אחד מהם ביקורים שבועיים, סיוע כלכלי ומסגרת חברתית חמה.",
    storyEn: "Over 200,000 Holocaust survivors live in Israel, many facing financial hardship and loneliness. Our project provides each of them with weekly visits, financial aid, and a warm social community.",
    productIds: ["1", "2", "5"],
  },
  {
    id: "5",
    title: "גינה קהילתית בנגב", titleEn: "Community Garden in the Negev",
    orgId: "4", category: "environment", raised: 15500, goal: 25000, donors: 189, daysLeft: 30,
    gradient: "from-green-400 to-teal-500", emoji: "🌱",
    shortDesc: "הקמת גינה קהילתית שתספק ירקות טריים לתושבי הנגב ותחזק את הקהילה.",
    shortDescEn: "Building a community garden to provide fresh vegetables to Negev residents and strengthen community bonds.",
    story: "הגינה הקהילתית שלנו בנגב תשמש לא רק כמקור לירקות טריים, אלא גם כמרחב קהילתי שמחזק קשרים שכנים.",
    storyEn: "Our Negev community garden serves not just as a source of fresh vegetables, but also as a community space that strengthens neighborhood ties, with growing workshops and shared equipment.",
    productIds: ["5"],
  },
  {
    id: "6",
    title: "בית חם לנשים בסכנה", titleEn: "Safe House for Women in Danger",
    orgId: "3", category: "health", raised: 22000, goal: 40000, donors: 334, daysLeft: 18,
    gradient: "from-rose-400 to-pink-500", emoji: "🏡",
    shortDesc: "בית חם ומוגן לנשים שנמלטות ממצבי אלימות. אנחנו מספקים מקלט, ליווי ותמיכה.",
    shortDescEn: "A warm, protected home for women fleeing violence. We provide shelter, legal support, and psychological care.",
    story: "כל שנה פונות לארגון שלנו מאות נשים הנמלטות מאלימות ביתית. אנחנו מספקים להן מקלט חינם, ליווי משפטי, טיפול פסיכולוגי ועזרה בשיקום ועצמאות.",
    storyEn: "Every year hundreds of women fleeing domestic violence turn to our organization. We provide free shelter, legal accompaniment, psychological treatment, and help rebuilding independence.",
    productIds: ["2", "4"],
  },
];

export const products = [
  { id: "1", name: "ארוחה חמה", nameEn: "Hot Meal", price: 50, description: "ארוחה מזינה ומחממת לאדם אחד ליום", descriptionEn: "A warm, nutritious meal for one person per day", emoji: "🍲" },
  { id: "2", name: "סל מזון שבועי", nameEn: "Weekly Food Basket", price: 150, description: "סל מזון מלא לשבוע לאדם קשיש", descriptionEn: "A full week's food basket for one elderly person", emoji: "🛒" },
  { id: "3", name: "ציוד לימוד", nameEn: "School Supplies", price: 80, description: "מחברות, עטים וציוד לימוד לסטודנט", descriptionEn: "Notebooks, pens and school supplies for one student", emoji: "✏️" },
  { id: "4", name: "סל ספרים", nameEn: "Book Basket", price: 120, description: "ספרי לימוד לשנת לימודים שלמה", descriptionEn: "Textbooks for a full academic year", emoji: "📚" },
  { id: "5", name: "חבילת בגדים", nameEn: "Clothing Package", price: 200, description: "חבילת בגדים לחורף לאדם אחד", descriptionEn: "A winter clothing package for one person", emoji: "🧥" },
];

export const donations = [
  { id: "1", campaignId: "1", campaignTitle: "ארוחות חמות לקשישים בחורף", campaignTitleEn: "Hot Meals for the Elderly", amount: 100, date: "15.06.2026", receiptId: "R-2026-001" },
  { id: "2", campaignId: "3", campaignTitle: "מרכז יום לנוער בסיכון", campaignTitleEn: "Day Center for At-Risk Youth", amount: 50, date: "10.06.2026", receiptId: "R-2026-002" },
  { id: "3", campaignId: "6", campaignTitle: "בית חם לנשים בסכנה", campaignTitleEn: "Safe House for Women in Danger", amount: 200, date: "28.05.2026", receiptId: "R-2026-003" },
  { id: "4", campaignId: "2", campaignTitle: "ספרים לילדי שכונות מצוקה", campaignTitleEn: "Books for Underprivileged Children", amount: 120, date: "15.05.2026", receiptId: "R-2026-004" },
];

export const npCampaigns = [
  { id: "1", title: "ארוחות חמות לקשישים בחורף", raised: 18500, goal: 25000, donors: 243, daysLeft: 14, status: "active" as const },
  { id: "4", title: "עזרה לניצולי שואה קשישים", raised: 8200, goal: 30000, donors: 98, daysLeft: 45, status: "active" as const },
  { id: "7", title: "חנוכה לכולם 2025", raised: 32000, goal: 32000, donors: 410, daysLeft: 0, status: "completed" as const },
];

export const recurringDonations = [
  {
    id: "r1",
    campaignId: "1",
    campaignTitle: "ארוחות חמות לקשישים בחורף",
    campaignTitleEn: "Hot Meals for the Elderly",
    orgName: "אוכל לכולם",
    orgColor: "#FF6B6B",
    orgInitials: "אל",
    amount: 100,
    nextCharge: "01.07.2026",
    startDate: "01.03.2026",
    status: "active" as const,
    gradient: "from-red-400 to-orange-400",
    emoji: "🍲",
  },
  {
    id: "r2",
    campaignId: "3",
    campaignTitle: "מרכז יום לנוער בסיכון",
    campaignTitleEn: "Day Center for At-Risk Youth",
    orgName: "ילדים בסיכון",
    orgColor: "#F7DC6F",
    orgInitials: "יב",
    amount: 50,
    nextCharge: "01.07.2026",
    startDate: "01.05.2026",
    status: "active" as const,
    gradient: "from-purple-400 to-pink-400",
    emoji: "🏠",
  },
];

export const communityStats = {
  totalRaised: 14200,
  donorCount: 87,
  rank: 2,
  totalCommunities: 24,
  campaignTitle: "ארוחות חמות לקשישים בחורף",
  orgName: "אוכל לכולם",
  goal: 25000,
};

export type ProductDonation = {
  id: string;
  productId: string;
  campaignId?: string;
  productName: string;
  productNameEn: string;
  productDetail: string;
  productDetailEn: string;
  quantity: number;
  orgName: string;
  orgCode: string;
  lastDonationDate: string;
  lastDonationTime?: string;
  lastDonationAmount: number;
  donorCount: number;
  paymentLast4: string;
  donationType: string;
  variant?: "light" | "dark";
  hasStandingOrder?: boolean;
  emoji?: string;
  receipts: Array<{ id: string; date: string; amount: number; type: string; paymentLast4: string }>;
};

export const myProductDonations: ProductDonation[] = [
  {
    id: "pd1",
    productId: "2",
    productName: 'פק"ל קפה + פינוקים',
    productNameEn: "Coffee & Treats Package",
    productDetail: "לחייל/ת בגדות/ת",
    productDetailEn: "for IDF Soldiers",
    quantity: 2,
    orgName: 'שוסה"כ',
    orgCode: "635",
    lastDonationDate: "13/08/23",
    lastDonationTime: "21:23",
    lastDonationAmount: 150,
    donorCount: 257,
    paymentLast4: "9802",
    donationType: 'הו"ק',
    variant: "light",
    emoji: "🪖",
    receipts: [
      { id: "r1", date: "12.02.22", amount: 150, type: 'הו"ק', paymentLast4: "9802" },
      { id: "r2", date: "12.03.22", amount: 150, type: 'חד"פ', paymentLast4: "9802" },
      { id: "r3", date: "12.04.22", amount: 150, type: "חד3/6", paymentLast4: "9802" },
    ],
  },
  {
    id: "pd2",
    productId: "2",
    productName: 'פק"ל קפה + פינוקים',
    productNameEn: "Coffee & Treats Package",
    productDetail: "לחייל/ת בגדות/ת",
    productDetailEn: "for IDF Soldiers",
    quantity: 2,
    orgName: 'שוסה"כ',
    orgCode: "635",
    lastDonationDate: "13/08/23",
    lastDonationTime: "21:23",
    lastDonationAmount: 150,
    donorCount: 257,
    paymentLast4: "9802",
    donationType: 'הו"ק',
    variant: "light",
    emoji: "🪖",
    receipts: [
      { id: "r4", date: "13.08.23", amount: 150, type: 'הו"ק', paymentLast4: "9802" },
    ],
  },
  {
    id: "pd3",
    productId: "1",
    productName: "ארוחות חמות חודשי",
    productNameEn: "Monthly Hot Meals",
    productDetail: "לקשישים או ניצול/שואה",
    productDetailEn: "for Elderly / Holocaust Survivors",
    quantity: 30,
    orgName: "אוכל לכולם",
    orgCode: "635",
    lastDonationDate: "13/08/23",
    lastDonationTime: "21:23",
    lastDonationAmount: 50,
    donorCount: 257,
    paymentLast4: "9802",
    donationType: 'הו"ק',
    variant: "light",
    hasStandingOrder: true,
    emoji: "🍲",
    receipts: [
      { id: "r5", date: "13.08.23", amount: 50, type: 'הו"ק', paymentLast4: "9802" },
      { id: "r6", date: "13.07.23", amount: 50, type: 'הו"ק', paymentLast4: "9802" },
    ],
  },
];

export const quarterlyDonationData = {
  total: 2678,
  period: "27/02/23–27/05/23",
  months: [
    { label: "פברואר", bars: [{ type: 'הו"ק', amount: 1130 }, { type: 'חד"פ', amount: 150 }, { type: 'סה"כ', amount: 980 }] },
    { label: "מרץ",    bars: [{ type: 'הו"ק', amount: 1130 }, { type: 'חד"פ', amount: 150 }, { type: 'סה"כ', amount: 980 }] },
    { label: "אפריל",  bars: [{ type: 'הו"ק', amount: 1130 }, { type: 'חד"פ', amount: 150 }, { type: 'סה"כ', amount: 980 }] },
  ],
};

export const donationEmotions = [
  { id: "hungry-child", label: "תינוק רעב", labelEn: "Hungry Child", emoji: "👶", category: "children" },
  { id: "elderly-f", label: "קשיש/ה", labelEn: "Elderly", emoji: "👴", category: "elderly" },
  { id: "teen", label: "נער/ה", labelEn: "Teen", emoji: "🧑", category: "education" },
  { id: "baby", label: "תינוק/ת", labelEn: "Baby", emoji: "🍼", category: "children" },
  { id: "soldier", label: "חייל/ת", labelEn: "Soldier", emoji: "🪖", category: "food" },
  { id: "senior", label: "קשיש", labelEn: "Senior", emoji: "👵", category: "elderly" },
];

export const savedPaymentMethods = [
  { id: "pm1", last4: "2234", brand: "Visa" },
  { id: "pm2", last4: "4584", brand: "Mastercard" },
];

export const donorUpdates = [
  {
    id: "u1",
    date: "14/08/23",
    hasVideo: true,
    productName: 'פק"ל קפה + פינוקים',
    productNameEn: "Coffee & Treats Package",
    description: "מעניקים לגדוד לביא את הפינוקים שתרמתם",
    descriptionEn: "Delivering your treats to the Lavi Brigade soldiers",
    gradient: "from-gray-700 to-gray-900",
  },
  {
    id: "u2",
    date: "14/08/23",
    hasVideo: false,
    productName: 'פק"ל קפה + פינוקים',
    productNameEn: "Coffee & Treats Package",
    description: "מעניקים לגדוד לביא את הפינוקים שתרמתם",
    descriptionEn: "Delivering your treats to the Lavi Brigade soldiers",
    gradient: "from-gray-300 to-gray-400",
  },
  {
    id: "u3",
    date: "10/08/23",
    hasVideo: false,
    productName: "ארוחות חמות",
    productNameEn: "Hot Meals",
    description: "הוגשו ארוחות חמות לקשישים בשכונת שפירא",
    descriptionEn: "Hot meals served to elderly in Shapira neighborhood",
    gradient: "from-orange-400 to-red-400",
  },
  {
    id: "u4",
    date: "05/08/23",
    hasVideo: true,
    productName: 'פק"ל קפה + פינוקים',
    productNameEn: "Coffee & Treats Package",
    description: "מעניקים לגדוד לביא את הפינוקים שתרמתם",
    descriptionEn: "Delivering your treats to the Lavi Brigade soldiers",
    gradient: "from-gray-700 to-gray-900",
  },
];

export type SystemUpdate = {
  id: string;
  date: string;
  title: string;
  titleEn: string;
  detail: string;
  detailEn: string;
  status: "info" | "pending" | "action_required";
  actionLabel: string;
  actionLabelEn: string;
};

export const systemUpdates: SystemUpdate[] = [
  {
    id: "su1",
    date: "12.03.22",
    title: "התקבלה בקשה להוראת קבע",
    titleEn: "Standing order request received",
    detail: "בקשתך להפעלת הוראת קבע התקבלה ותיכנס לתוקף בחיוב הבא",
    detailEn: "Your standing order request was received and will take effect on the next charge",
    status: "pending" as const,
    actionLabel: "לצפייה",
    actionLabelEn: "View",
  },
  {
    id: "su2",
    date: "12.03.22",
    title: "הופקה תרומה חדשה עבור פעולת שיוך",
    titleEn: "A new donation was issued for an allocation action",
    detail: "",
    detailEn: "",
    status: "info" as const,
    actionLabel: "",
    actionLabelEn: "",
  },
  {
    id: "su3",
    date: "12.03.22",
    title: "חיוב הוראת קבע בוצע בהצלחה",
    titleEn: "Standing order charge completed successfully",
    detail: "",
    detailEn: "",
    status: "info" as const,
    actionLabel: "",
    actionLabelEn: "",
  },
];

export const campaignDonorNames = [
  "דוד חיימוביץ", "רחל כהן", "יוסי לוי", "מיכל אברהם", "אבי גולן",
  "שירה מזרחי", "עידן פרץ", "טל שמעוני", "נועה ברק", "אלון שגב",
];

export function getCampaignDonors(campaignId: string, count = 9) {
  const c = getCampaign(campaignId);
  const donorCount = c?.donors ?? count;
  return Array.from({ length: Math.min(count, Math.max(donorCount, count)) }).map((_, i) => ({
    id: `${campaignId}-donor-${i}`,
    name: campaignDonorNames[i % campaignDonorNames.length],
    amount: [180, 100, 50, 250, 126][i % 5],
    date: "לפני 2 שעות",
    dateEn: "2 hours ago",
    message: "זכות גדולה לתרום ולהיות שותפה עם הארגון",
    messageEn: "It's a privilege to give and partner with this organization",
    anonymous: i % 4 === 1,
  }));
}

export const campaignCommunitiesByCampaign: Record<string, Array<{ id: string; name: string; nameEn: string; members: number; emoji: string }>> = {
  "1": [
    { id: "c1", name: "קהילת רמת אביב", nameEn: "Ramat Aviv Community", members: 340, emoji: "🏘️" },
    { id: "c2", name: "עובדי הייטק נותנים", nameEn: "Tech Workers Give", members: 512, emoji: "💻" },
  ],
  "4": [
    { id: "c3", name: "בני עקיבא ירושלים", nameEn: "Bnei Akiva Jerusalem", members: 220, emoji: "🎗️" },
    { id: "c4", name: "קהילת גבעתיים", nameEn: "Givatayim Community", members: 175, emoji: "🏘️" },
  ],
};

export function getCampaignCommunities(campaignId: string) {
  return campaignCommunitiesByCampaign[campaignId] ?? [];
}

export function getCampaignsByOrg(orgId: string) {
  return campaigns.filter((c) => c.orgId === orgId);
}

export function getOrg(id: string) {
  return organizations.find((o) => o.id === id);
}
export function getCampaign(id: string) {
  return campaigns.find((c) => c.id === id);
}
export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}
export function percent(raised: number, goal: number) {
  return Math.min(100, Math.round((raised / goal) * 100));
}
export function formatNIS(n: number) {
  return "₪" + n.toLocaleString("he-IL");
}
