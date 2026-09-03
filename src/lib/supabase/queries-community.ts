import { createClient } from "@/lib/supabase/client";
import { getCommunityAdminData } from "@/lib/supabase/queries-community-admin";

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
