"use client";

import { useMemo } from "react";
import { useCommunityAdminData } from "@/contexts/CommunityAdminDataContext";

const date = (value: string | null) => value ? new Date(value).toLocaleDateString("he-IL") : "—";

export function useCommunityAdminView() {
  const state = useCommunityAdminData();
  const data = useMemo(() => {
    if (!state.data) return null;
    const { community, organizations, campaigns, donations } = state.data;
    const campaignRows = campaigns.map((campaign) => {
      const campaignOrganization = organizations.find((item) => item.id === campaign.org_id);
      const orgName = campaignOrganization?.name ?? "";
      const orgNameEn = campaignOrganization?.name_en ?? orgName;
      return {
        id: campaign.id, name: campaign.title, nameEn: campaign.title_en ?? campaign.title,
        created: date(campaign.created_at), ended: date(campaign.end_date), productsCount: 0,
        productsRaisedCount: donations.filter((item) => item.campaign_id === campaign.id).reduce((sum, item) => sum + item.quantity, 0),
        amountRaised: donations.filter((item) => item.campaign_id === campaign.id).reduce((sum, item) => sum + Number(item.amount), 0),
        joinedCount: 1, donorCount: donations.filter((item) => item.campaign_id === campaign.id).length,
        orgName, orgNameEn, source: campaign.membershipSource, paused: campaign.membershipStatus === "paused",
      };
    });
    return {
      AS_OF: new Date().toLocaleDateString("he-IL"),
      communityId: community.id,
      communityCampaignRows: campaignRows,
      communityCampaignCards: campaigns.map((campaign) => ({ id: campaign.id, title: campaign.title,
        titleEn: campaign.title_en ?? campaign.title, emoji: campaign.emoji,
        raised: Number(campaign.raised), goal: Number(campaign.goal), activityArea: "—", activityAreaEn: "—",
        source: campaign.membershipSource, paused: campaign.membershipStatus === "paused" })),
      communityCampaignsTotalRaised: donations.reduce((sum, item) => sum + Number(item.amount), 0),
      communityCampaignsActiveCount: campaigns.filter((campaign) => campaign.membershipStatus === "active").length,
      communityDonationRows: donations.map((item) => ({ id: item.id, date: date(item.created_at),
        donorName: item.donor_name || item.dedication_name || "Anonymous donor", campaign: item.campaigns?.title ?? "",
        product: item.products?.name ?? "—", quantity: item.quantity, amount: Number(item.amount),
        frequency: item.is_recurring ? "חודשי" : "חד פעמי", frequencyEn: item.is_recurring ? "Monthly" : "One-time" })),
      communityDonationsTotal: donations.reduce((sum, item) => sum + Number(item.amount), 0),
      communityDonationsCount: donations.length,
      communityNonprofitRows: organizations.map((organization) => ({ id: organization.id, name: organization.name,
        nameEn: organization.name_en ?? organization.name, activityArea: "—", activityAreaEn: "—",
        joinedDate: date(community.created_at), activeCampaigns: campaigns.filter((campaign) => campaign.org_id === organization.id).length, productsSold: 0,
        totalRaised: donations.filter((donation) => donation.org_id === organization.id).reduce((sum, donation) => sum + Number(donation.amount), 0), contactName: organization.ceo ?? "—", contactPhone: organization.phone ?? "—" })),
      communityNonprofitsTotalRaised: Number(community.total_raised),
      communityNonprofitsCount: organizations.length,
    };
  }, [state.data]);
  return { ...state, data };
}
