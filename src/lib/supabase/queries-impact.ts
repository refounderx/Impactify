import { createClient } from "@/lib/supabase/client";

export type PublicImpactStats = {
  completedDonations: number;
  completedAmount: number;
  knownDonors: number;
  activeCampaigns: number;
  partnerOrganizations: number;
  communities: number;
  activeRecurringDonations: number;
  organizationNames: string[];
};

type ImpactRow = {
  completed_donations: number | string;
  completed_amount: number | string;
  known_donors: number | string;
  active_campaigns: number | string;
  partner_organizations: number | string;
  communities_count: number | string;
  active_recurring_donations: number | string;
};

export async function getPublicImpactStats(): Promise<PublicImpactStats> {
  const sb = createClient();
  const [{ data: statsData, error: statsError }, { data: organizations, error: organizationsError }] = await Promise.all([
    sb.rpc("get_public_impact_stats"),
    sb.from("organizations").select("name").order("created_at", { ascending: false }).limit(6),
  ]);
  if (statsError) throw new Error(`Unable to load public impact statistics: ${statsError.message}`);
  if (organizationsError) throw new Error(`Unable to load partner organizations: ${organizationsError.message}`);

  const row = (statsData as unknown as ImpactRow[] | null)?.[0];
  if (!row) throw new Error("Public impact statistics are unavailable");
  return {
    completedDonations: Number(row.completed_donations),
    completedAmount: Number(row.completed_amount),
    knownDonors: Number(row.known_donors),
    activeCampaigns: Number(row.active_campaigns),
    partnerOrganizations: Number(row.partner_organizations),
    communities: Number(row.communities_count),
    activeRecurringDonations: Number(row.active_recurring_donations),
    organizationNames: (organizations ?? []).map((organization) => organization.name),
  };
}
