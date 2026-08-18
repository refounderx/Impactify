import { createClient } from "@/lib/supabase/client";
import { organizations as mockOrgs, npCampaigns as mockNpCampaigns } from "@/lib/mock-data";
import { toUIOrg } from "@/lib/supabase/query-helpers";

export async function getOrganizations() {
  try {
    const sb = createClient();
    const { data, error } = await sb.from("organizations").select("*");
    if (error || !data || data.length === 0) return mockOrgs;
    return data.map(toUIOrg);
  } catch {
    return mockOrgs;
  }
}

export async function getOrgById(id: string) {
  try {
    const sb = createClient();
    const { data, error } = await sb.from("organizations").select("*").eq("id", id).single();
    if (error || !data) return mockOrgs.find((o) => o.id === id) ?? null;
    return toUIOrg(data);
  } catch {
    return mockOrgs.find((o) => o.id === id) ?? null;
  }
}

// Demo: returns first org + its campaigns (no auth yet — replace org_id with auth'd user's org later)
export async function getNpDashboardData() {
  try {
    const sb = createClient();
    const { data: org } = await sb.from("organizations").select("*").limit(1).single();
    if (!org) return { org: null, campaigns: mockNpCampaigns };

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
      campaigns: npCampaigns.length > 0 ? npCampaigns : mockNpCampaigns,
    };
  } catch {
    return { org: null, campaigns: mockNpCampaigns };
  }
}
