export const AS_OF = "12/08/23";

export type CommunityCampaignSource = "created" | "linked";

export type CommunityCampaignRow = {
  id: string;
  name: string;
  nameEn: string;
  created: string;
  ended: string;
  productsCount: number;
  productsRaisedCount: number;
  amountRaised: number;
  joinedCount: number;
  donorCount: number;
  orgName: string;
  orgNameEn: string;
  orgId: string;
  campaignRaised: number;
  campaignGoal: number;
  campaignDonorCount: number;
  goalType: "deadline" | "monthly" | "annual";
  description: string;
  descriptionEn: string;
  products: { id: string; name: string; nameEn: string; quantity: number; amount: number }[];
  source: CommunityCampaignSource;
  paused?: boolean;
};

export const communityCampaignRows: CommunityCampaignRow[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `cc${i + 1}`,
  name: "יונית ושי",
  nameEn: "Yonit & Shai",
  created: "12.02.22",
  ended: "12.02.22",
  productsCount: 87,
  productsRaisedCount: 578,
  amountRaised: 12500,
  joinedCount: 15,
  donorCount: 87,
  orgName: "עושים חייל",
  orgNameEn: "Osim Hayil",
  orgId: "org-1",
  campaignRaised: 12500,
  campaignGoal: 25000,
  campaignDonorCount: 87,
  goalType: "deadline",
  description: "קמפיין לדוגמה",
  descriptionEn: "Example campaign",
  products: [],
  source: i < 4 ? "created" : "linked",
  paused: i === 5,
}));

export const communityCampaignsTotalRaised = 147912;
export const communityCampaignsActiveCount = 15;

export type CommunityCampaignCard = {
  id: string;
  title: string;
  titleEn: string;
  emoji: string;
  raised: number;
  goal: number;
  activityArea?: string;
  activityAreaEn?: string;
};

export const communityCampaignCards: CommunityCampaignCard[] = Array.from({ length: 5 }).map((_, i) => ({
  id: `ccc${i}`,
  title: "קמפיין חיילים בודדים",
  titleEn: "Lone Soldiers Campaign",
  emoji: "🎖️",
  raised: 75000,
  goal: 100000,
  activityArea: "מרכז",
  activityAreaEn: "Central",
}));

export type CommunityDonationRow = {
  id: string;
  date: string;
  donorName: string;
  campaign: string;
  product: string;
  quantity: number;
  amount: number;
  frequency: string;
  frequencyEn: string;
};

export const communityDonationRows: CommunityDonationRow[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `cd${i + 1}`,
  date: "12.02.22",
  donorName: "אביב שלום",
  campaign: "גיבורי שמשון",
  product: "ארוחה חמה",
  quantity: 2,
  amount: 25,
  frequency: "חד פעמי",
  frequencyEn: "One-time",
}));

export const communityDonationsTotal = 147912;
export const communityDonationsCount = 200000;

export type CommunityNonprofitRow = {
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

export const communityNonprofitRows: CommunityNonprofitRow[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `cn${i + 1}`,
  name: "עושים חייל",
  nameEn: "Osim Hayil",
  activityArea: "מרכז",
  activityAreaEn: "Central",
  joinedDate: "12.02.22",
  activeCampaigns: 4,
  productsSold: 120,
  totalRaised: 1500,
  contactName: "מתן כהן",
  contactPhone: "054747987",
}));

export const communityNonprofitsTotalRaised = 41800;
export const communityNonprofitsCount = 15;

export type CommunityUpdateRow = {
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

export const communityUpdateRows: CommunityUpdateRow[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `cu${i + 1}`,
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

export type CommunityUpdateScheduleRow = {
  id: string;
  category: string;
  categoryEn: string;
  quantity: number;
  schedule: string;
  scheduleEn: string;
  day: string;
  dayEn: string;
  time: string;
  date: string;
  sentSoFar: number;
};

export const communityUpdateScheduleRows: CommunityUpdateScheduleRow[] = Array.from({ length: 6 }).map((_, i) => ({
  id: `cus${i + 1}`,
  category: "קמפיינים",
  categoryEn: "Campaigns",
  quantity: 10,
  schedule: i === 0 ? "מתחדש" : "חד פעמי",
  scheduleEn: i === 0 ? "Recurring" : "One-time",
  day: i === 0 ? "יום שלישי" : "--/--/--",
  dayEn: i === 0 ? "Tuesday" : "--/--/--",
  time: i === 0 ? "13:00" : "1 עד 20 דק'",
  date: "--/--/--",
  sentSoFar: 15,
}));
