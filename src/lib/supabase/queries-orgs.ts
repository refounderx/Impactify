import { createClient } from "@/lib/supabase/client";
import { toUIOrg } from "@/lib/supabase/query-helpers";

export async function getOrganizations() {
  try {
    const sb = createClient();
    const { data, error } = await sb.from("organizations").select("*");
    if (error) throw error;
    return data.map(toUIOrg);
  } catch (error) {
    console.error("Unable to load organizations", error);
    return [];
  }
}

export async function getOrgById(id: string) {
  try {
    const sb = createClient();
    const { data, error } = await sb.from("organizations").select("*").eq("id", id).single();
    if (error || !data) return null;
    return toUIOrg(data);
  } catch (error) {
    console.error("Unable to load organization", error);
    return null;
  }
}

// Demo: returns first org + its campaigns (no auth yet — replace org_id with auth'd user's org later)
export async function getNpDashboardData() {
  try {
    const sb = createClient();
    const { data: org } = await sb.from("organizations").select("*").limit(1).single();
    if (!org) return { org: null, campaigns: [] };

    const { data: campaigns } = await sb
      .from("campaigns")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false });

    const npCampaigns = (campaigns ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      titleEn: c.title_en ?? undefined,
      raised: Number(c.raised),
      goal: Number(c.goal),
      donors: c.donors_count,
      daysLeft: c.end_date
        ? Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000))
        : 0,
      status: c.status as "active" | "completed",
    }));

    return {
      org: toUIOrg(org),
      campaigns: npCampaigns,
    };
  } catch (error) {
    console.error("Unable to load nonprofit dashboard", error);
    return { org: null, campaigns: [] };
  }
}
