import { createClient } from "@/lib/supabase/client";
import { getCommunityAdminData } from "@/lib/supabase/queries-community-admin";
import type { Campaign, Community } from "@/lib/supabase/types";

export async function getCommunityDashboardData() {
  try {
    const { community: data, organizations } = await getCommunityAdminData();
    const org = organizations[0] ?? null;
    const sb = createClient();

    // All communities for leaderboard
    const { data: all } = await sb
      .from("communities")
      .select("id, name, name_en, total_raised, donors_count")
      .order("total_raised", { ascending: false });

    return {
      communityId: data.id,
      communityName: data.name,
      communityNameEn: data.name_en ?? data.name,
      totalRaised: Number(data.total_raised),
      donorCount: data.donors_count,
      orgName: org?.name ?? "",
      orgNameEn: org?.name_en ?? org?.name ?? "",
      goal: 0,
      campaignTitle: "",
      leaderboard: (all ?? []).map((c, i) => ({
        rank: i + 1,
        name: c.name,
        nameEn: c.name_en ?? c.name,
        raised: Number(c.total_raised),
        donors: c.donors_count,
        isMe: c.id === data.id,
      })),
    };
  } catch (error) {
    console.error("Unable to load community dashboard", error);
    return null;
  }
}

export async function getCommunities() {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from("communities")
      .select("id, name, name_en, description, donors_count, total_raised")
      .order("created_at");
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("Unable to load communities", error);
    return [];
  }
}

/** Public community profile data only; never use the authenticated dashboard query here. */
export async function getPublicCommunityById(id: string): Promise<Community | null> {
  try {
    const { data, error } = await createClient().from("communities")
      .select("id,name,name_en,description,color,total_raised,donors_count,created_at")
      .eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? { ...data, manager_id: null, referral_code: null } as Community : null;
  } catch (error) {
    console.error("Unable to load public community", error);
    return null;
  }
}

export async function getPublicCommunityCampaigns(communityId: string): Promise<Campaign[]> {
  try {
    const sb = createClient();
    const { data: memberships, error: membershipError } = await sb.from("community_campaigns")
      .select("campaign_id").eq("community_id", communityId).eq("status", "active");
    if (membershipError) throw membershipError;
    const campaignIds = (memberships ?? []).map((item) => item.campaign_id);
    if (!campaignIds.length) return [];
    const { data, error } = await sb.from("campaigns").select("*").in("id", campaignIds)
      .eq("status", "active").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Campaign[];
  } catch (error) {
    console.error("Unable to load public community campaigns", error);
    return [];
  }
}
