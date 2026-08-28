"use client";

import { useMemo } from "react";
import { useNgoAdminData } from "@/contexts/NgoAdminDataContext";

const date = (value: string | null) => value ? new Date(value).toLocaleDateString("he-IL") : "—";

export function useNgoAdminView() {
  const state = useNgoAdminData();
  const data = useMemo(() => {
    if (!state.data) return null;
    const { organization, campaigns, products, donations, communities, campaignProducts } = state.data;
    const productDonationTotals = new Map<string, { amount: number; quantity: number }>();
    for (const donation of donations) {
      if (!donation.product_id) continue;
      const current = productDonationTotals.get(donation.product_id) ?? { amount: 0, quantity: 0 };
      current.amount += Number(donation.amount);
      current.quantity += donation.quantity;
      productDonationTotals.set(donation.product_id, current);
    }
    const initials = organization.initials || organization.name.slice(0, 2);
    return {
      adminCampaignRows: campaigns.map((campaign) => ({
        id: campaign.id, name: campaign.title, nameEn: campaign.title_en ?? campaign.title,
        created: date(campaign.created_at), ended: date(campaign.end_date),
        productsCount: campaignProducts.filter((row) => row.campaign_id === campaign.id).length,
        productsRaisedCount: donations.filter((row) => row.campaign_id === campaign.id).reduce((sum, row) => sum + row.quantity, 0),
        amountRaised: Number(campaign.raised), communities: 0, ownerInitials: initials,
        ownerName: organization.name, paused: campaign.status === "paused",
      })),
      adminCampaignCards: campaigns.map((campaign) => ({
        id: campaign.id, title: campaign.title, titleEn: campaign.title_en ?? campaign.title,
        emoji: campaign.emoji, raised: Number(campaign.raised), goal: Number(campaign.goal),
        endDate: date(campaign.end_date), ended: ["completed", "archived"].includes(campaign.status),
      })),
      adminCampaignsTotalRaised: campaigns.reduce((sum, campaign) => sum + Number(campaign.raised), 0),
      adminCampaignsActiveCount: campaigns.filter((campaign) => campaign.status === "active").length,
      adminProductRows: products.map((product) => {
        const totals = productDonationTotals.get(product.id) ?? { amount: 0, quantity: 0 };
        return { id: product.id, name: product.name, nameEn: product.name_en ?? product.name,
          created: date(product.created_at), ended: product.active ? "—" : date(product.created_at),
          campaignsCount: campaignProducts.filter((row) => row.product_id === product.id).length,
          communities: 0, unitPrice: Number(product.price), totalRaised: totals.amount,
          unitsDonated: totals.quantity, ownerInitials: initials,
          description: product.description ?? "", descriptionEn: product.description_en ?? "",
          emoji: product.emoji ?? "💙", active: product.active };
      }),
      adminProductCards: products.map((product) => {
        const donated = productDonationTotals.get(product.id)?.quantity ?? 0;
        return { id: product.id, name: product.name, nameEn: product.name_en ?? product.name,
          emoji: product.emoji ?? "💙", campaignsCount: campaignProducts.filter((row) => row.product_id === product.id).length,
          donated, goal: Math.max(donated, 1) };
      }),
      adminProductsTotalUnits: donations.reduce((sum, donation) => sum + donation.quantity, 0),
      adminProductsActiveCount: products.filter((product) => product.active).length,
      adminDonationRows: donations.map((donation) => ({
        id: donation.id, date: date(donation.created_at), donorName: donation.dedication_name || "Anonymous donor",
        campaign: donation.campaigns?.title ?? "", product: donation.products?.name ?? "—",
        quantity: donation.quantity, amount: Number(donation.amount),
        frequency: donation.is_recurring ? "חודשי" : "חד פעמי",
        frequencyEn: donation.is_recurring ? "Monthly" : "One-time", paymentLast4: donation.last_four ?? "----",
      })),
      adminDonationsTotal: donations.reduce((sum, donation) => sum + Number(donation.amount), 0),
      adminDonationsCount: donations.length,
      adminCommunityRows: communities.map((community) => ({
        id: community.id, name: community.name, nameEn: community.name_en ?? community.name,
        activityArea: "—", activityAreaEn: "—", joinedDate: date(community.created_at),
        activeCampaigns: campaigns.filter((campaign) => campaign.status === "active").length,
        productsSold: 0, totalRaised: Number(community.total_raised), contactName: "—", contactPhone: "—",
      })),
      adminCommunitiesTotalRaised: communities.reduce((sum, community) => sum + Number(community.total_raised), 0),
      adminCommunitiesCount: communities.length,
    };
  }, [state.data]);
  return { ...state, data };
}
