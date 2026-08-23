import { createClient } from "@/lib/supabase/client";

type OrgRef = { name: string; name_en: string | null } | null;

export async function getCommunityDashboardData() {
  try {
    const sb = createClient();

    // Get top community (demo — no auth yet)
    const { data, error } = await sb
      .from("communities")
      .select("*, organizations(name, name_en)")
      .order("total_raised", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    // All communities for leaderboard
    const { data: all } = await sb
      .from("communities")
      .select("id, name, name_en, total_raised, donors_count")
      .order("total_raised", { ascending: false });

    const org = data.organizations as OrgRef;

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
