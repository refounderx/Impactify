import { createClient } from "@/lib/supabase/client";
import type { Campaign, Community, Donation, Organization } from "@/lib/supabase/types";

export type CommunityDonation = Donation & {
  campaigns: { title: string; title_en: string | null } | null;
  products: { name: string; name_en: string | null } | null;
};

export type CommunityAdminData = {
  community: Community;
  organization: Organization | null;
  organizations: Organization[];
  campaigns: Array<Campaign & { membershipStatus: "active" | "paused"; membershipSource: "created" | "linked" }>;
  donations: CommunityDonation[];
};

export type CommunityCampaignStatus = "pending" | "active" | "paused" | "rejected";
type CommunityCampaignMembership = {
  community_id: string;
  campaign_id: string;
  status: CommunityCampaignStatus;
  source: "created" | "linked";
};

const ORG_COLUMNS = "id,name,name_en,initials,color,description,description_en,goals,logo_url,registration_number,verified,founded,founded_en,ceo,ceo_en,volunteers,address,address_en,activity_area,phone,video_gradient,created_at";

export async function getCommunityAdminData(): Promise<CommunityAdminData> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Authentication required");
  const { data: profile, error: profileError } = await sb.from("profiles")
    .select("community_id, app_role").eq("id", user.id).single();
  if (profileError || profile?.app_role !== "community_owner" || !profile.community_id) {
    throw new Error("Community owner profile required");
  }
  const { data: community, error: communityError } = await sb.from("communities")
    .select("id,name,name_en,description,org_id,total_raised,donors_count,created_at").eq("id", profile.community_id).single();
  if (communityError || !community) throw new Error(communityError?.message ?? "Community not found");
  const [organization, memberships, donations] = await Promise.all([
    community.org_id ? sb.from("organizations").select(ORG_COLUMNS).eq("id", community.org_id).single() : Promise.resolve({ data: null, error: null }),
    sb.from("community_campaigns").select("community_id,campaign_id,status,source").eq("community_id", community.id),
    sb.from("donations").select("id,donor_id,campaign_id,org_id,amount,currency,status,is_recurring,dedication_name,dedication_message,donor_name,community_id,last_four,card_brand,receipt_id,receipt_url,created_at,product_id,donation_type,quantity,campaigns(title,title_en),products(name,name_en)")
      .eq("community_id", community.id).order("created_at", { ascending: false }),
  ]);
  const error = organization.error ?? memberships.error ?? donations.error;
  if (error) throw new Error(error.message);
  const membershipRows = (memberships.data ?? []) as CommunityCampaignMembership[];
  const managedMemberships = membershipRows.filter((item) => item.status === "active" || item.status === "paused");
  const campaignResult = managedMemberships.length
    ? await sb.from("campaigns").select("*").in("id", managedMemberships.map((item) => item.campaign_id)).order("created_at", { ascending: false })
    : { data: [], error: null };
  if (campaignResult.error) throw new Error(campaignResult.error.message);
  const campaignRows = campaignResult.data ?? [];
  const orgIds = [...new Set(campaignRows.map((campaign) => campaign.org_id))];
  const organizationsResult = orgIds.length
    ? await sb.from("organizations").select(ORG_COLUMNS).in("id", orgIds)
    : { data: [], error: null };
  if (organizationsResult.error) throw new Error(organizationsResult.error.message);
  const membershipByCampaign = new Map(managedMemberships.map((item) => [item.campaign_id, item]));
  return {
    community: { ...community, manager_id: null, referral_code: null } as Community,
    organization: organization.data as Organization | null,
    organizations: (organizationsResult.data ?? []) as Organization[],
    campaigns: campaignRows.map((campaign) => ({
      ...campaign,
      membershipStatus: membershipByCampaign.get(campaign.id)?.status as "active" | "paused",
      membershipSource: membershipByCampaign.get(campaign.id)?.source ?? "linked",
    })),
    donations: (donations.data ?? []) as CommunityDonation[],
  };
}

export async function getCommunityCampaignStatuses(): Promise<Record<string, CommunityCampaignStatus>> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Authentication required");
  const { data: profile, error: profileError } = await sb.from("profiles").select("community_id,app_role").eq("id", user.id).single();
  if (profileError || profile?.app_role !== "community_owner" || !profile.community_id) throw new Error("Community owner profile required");
  const { data, error } = await sb.from("community_campaigns").select("campaign_id,status").eq("community_id", profile.community_id);
  if (error) throw new Error(error.message);
  return Object.fromEntries((data ?? []).map((item) => [item.campaign_id, item.status as CommunityCampaignStatus]));
}

export async function setCommunityCampaign(campaignId: string, action: "request" | "cancel" | "pause" | "resume") {
  const { data, error } = await createClient().rpc("set_community_campaign", { p_campaign_id: campaignId, p_action: action });
  if (error) throw new Error(error.message);
  return data as string;
}
