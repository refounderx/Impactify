export const adminGreetingName = "שירה כהן";
export const adminGreetingNameEn = "Shira Cohen";
export const adminLastLogin = "13/08/23";
export const adminLastLoginTime = "18:36";

export type AdminCampaignRow = {
  id: string;
  name: string;
  nameEn: string;
  created: string;
  ended: string;
  productsCount: number;
  productsRaisedCount: number;
  amountRaised: number;
  communities: number;
  ownerInitials: string;
  ownerName: string;
  paused?: boolean;
};

export const adminCampaignRows: AdminCampaignRow[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `ac${i + 1}`,
  name: "יונית ושי",
  nameEn: "Yonit & Shai",
  created: "12.02.22",
  ended: "12.02.22",
  productsCount: 87,
  productsRaisedCount: 578,
  amountRaised: 12500,
  communities: 3,
  ownerInitials: "אמ",
  ownerName: "אורית מזרחי",
  paused: i === 5,
}));

export const adminCampaignsTotalRaised = 147912;
export const adminCampaignsActiveCount = 15;

export type AdminCampaignProductBreakdown = {
  name: string;
  nameEn: string;
  donated: number;
  total: number;
};

const DETAIL_PRODUCT_NAMES: [string, string][] = [
  ["ארוחה חמה", "Hot Meal"],
  ["סל מזון שבועי", "Weekly Food Basket"],
  ["ציוד לימוד", "School Supplies"],
  ["סל ספרים", "Book Basket"],
  ["חבילת בגדים", "Clothing Package"],
  ["חולצה ללוחם", "Shirt for a Fighter"],
  ["פק\"ל קפה ופינוקים", "Coffee & Treats Package"],
  ["סל מזון חודשי", "Monthly Food Basket"],
];

export type AdminCampaignDetail = {
  sku: string;
  monthLabel: string;
  monthLabelEn: string;
  monthlyTotal: number;
  raised: number;
  goal: number;
  productBreakdown: AdminCampaignProductBreakdown[];
  communities: string[];
};

export function getAdminCampaignDetail(rowIndex: number): AdminCampaignDetail {
  return {
    sku: `A${String(rowIndex + 1).padStart(4, "0")}`,
    monthLabel: "דצמבר",
    monthLabelEn: "December",
    monthlyTotal: 7950,
    raised: 75000,
    goal: 100000,
    productBreakdown: DETAIL_PRODUCT_NAMES.map(([name, nameEn]) => ({ name, nameEn, donated: 12, total: 24 })),
    communities: ["קהילה 1", "קהילה 2", "קהילה 3", "קהילה 4", "קהילה 5"],
  };
}

export type AdminCampaignCard = {
  id: string;
  title: string;
  titleEn: string;
  emoji: string;
  raised: number;
  goal: number;
  endDate: string;
  ended: boolean;
};

export const adminCampaignCards: AdminCampaignCard[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `acc${i + 1}`,
  title: "קמפיין חיילים בודדים",
  titleEn: "Lone Soldiers Campaign",
  emoji: "🎖️",
  raised: 75000,
  goal: 100000,
  endDate: "12.12.24",
  ended: i >= 4,
}));

export type AdminProductRow = {
  id: string;
  name: string;
  nameEn: string;
  created: string;
  ended: string;
  campaignsCount: number;
  communities: number;
  unitPrice: number;
  totalRaised: number;
  unitsDonated: number;
  ownerInitials: string;
};

export const adminProductRows: AdminProductRow[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `ap${i + 1}`,
  name: "חולצה ללוחם",
  nameEn: "Shirt for a Fighter",
  created: "12.02.22",
  ended: "12.02.22",
  campaignsCount: 12,
  communities: 3,
  unitPrice: 15,
  totalRaised: 9500,
  unitsDonated: 700,
  ownerInitials: "אמ",
}));

export const adminProductsTotalUnits = 12074;
export const adminProductsActiveCount = 27;

const MONTH_LABELS: [string, string][] = [
  ["ינואר", "January"], ["פברואר", "February"], ["מרץ", "March"], ["אפריל", "April"],
  ["מאי", "May"], ["יוני", "June"], ["יולי", "July"], ["אוגוסט", "August"],
  ["ספטמבר", "September"], ["אוקטובר", "October"], ["נובמבר", "November"], ["דצמבר", "December"],
];

export type AdminProductMonthly = {
  month: string;
  monthEn: string;
  donated: number;
  total: number;
};

export type AdminProductDetail = {
  sku: string;
  year: string;
  campaignOptions: string[];
  selectedCampaign: string;
  yearlyTotal: number;
  monthly: AdminProductMonthly[];
  donated: number;
  goal: number;
};

export function getAdminProductDetail(rowIndex: number): AdminProductDetail {
  return {
    sku: `F${String(rowIndex + 1).padStart(4, "0")}`,
    year: "2023",
    campaignOptions: ["חיילים בודדים - שמשון", "קמפיין חיילים 2", "קמפיין חיילים 3", "כל הקמפיינים"],
    selectedCampaign: "חיילים בודדים - שמשון",
    yearlyTotal: 500,
    monthly: MONTH_LABELS.map(([month, monthEn]) => ({ month, monthEn, donated: 12, total: 24 })),
    donated: 700,
    goal: 1000,
  };
}

export type AdminProductCard = {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  campaignsCount: number;
  donated: number;
  goal: number;
};

export const adminProductCards: AdminProductCard[] = Array.from({ length: 5 }).map((_, i) => ({
  id: `apc${i + 1}`,
  name: "ארוחה חמה",
  nameEn: "Hot Meal",
  emoji: "🍱",
  campaignsCount: 3,
  donated: 700,
  goal: 1000,
}));

export type AdminDonationRow = {
  id: string;
  date: string;
  donorName: string;
  campaign: string;
  product: string;
  quantity: number;
  amount: number;
  frequency: string;
  frequencyEn: string;
  paymentLast4: string;
};

export const adminDonationRows: AdminDonationRow[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `ad${i + 1}`,
  date: "12.02.22",
  donorName: "אביב שלום",
  campaign: "גיבורי שמשון",
  product: "ארוחה חמה",
  quantity: 2,
  amount: 25,
  frequency: "חד פעמי",
  frequencyEn: "One-time",
  paymentLast4: "4728",
}));

export const adminDonationsTotal = 147912;
export const adminDonationsCount = 200000;

export type AdminCommunityRow = {
  id: string;
  name: string;
  nameEn: string;
  activityArea: string;
  activityAreaEn: string;
  joinedDate: string;
  activeCampaigns: number;
  productsSold: number;
  totalRaised: number;
  contactName: string;
  contactPhone: string;
};

export const adminCommunityRows: AdminCommunityRow[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `acm${i + 1}`,
  name: "גיבורי שמשון",
  nameEn: "Samson's Heroes",
  activityArea: "מרכז",
  activityAreaEn: "Central",
  joinedDate: "12.02.22",
  activeCampaigns: 4,
  productsSold: 120,
  totalRaised: 1500,
  contactName: "אבי נחמני",
  contactPhone: "054747987",
}));

export const adminCommunitiesTotalRaised = 41800;
export const adminCommunitiesCount = 15;

export type AdminUpdateRow = {
  id: string;
  category: string;
  categoryEn: string;
  quantity: number;
  trigger: string;
  triggerEn: string;
  timeOffset: string;
  timeOffsetEn: string;
  date: string;
  sentSoFar: number;
};

export const adminUpdateRows: AdminUpdateRow[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `au${i + 1}`,
  category: "קמפיינים",
  categoryEn: "Campaigns",
  quantity: 10,
  trigger: "ביצוע תרומה",
  triggerEn: "Donation made",
  timeOffset: i === 0 ? "לאחר 1 ש' ו-20 דק'" : "1 ש' ו-20 דק'",
  timeOffsetEn: i === 0 ? "1h 20m after" : "1h 20m",
  date: "--/--/--",
  sentSoFar: 15,
}));
