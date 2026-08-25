import { createClient } from "@/lib/supabase/client";
import { toUIOrg } from "@/lib/supabase/query-helpers";

const PUBLIC_ORG_COLUMNS = "id,name,name_en,initials,color,description,description_en,goals,logo_url,registration_number,verified,founded,founded_en,ceo,ceo_en,volunteers,address,address_en,phone,video_gradient,created_at";

export async function getOrganizations() {
  try {
    const sb = createClient();
    const { data, error } = await sb.from("organizations").select(PUBLIC_ORG_COLUMNS);
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
    const { data, error } = await sb.from("organizations").select(PUBLIC_ORG_COLUMNS).eq("id", id).single();
    if (error || !data) return null;
    return toUIOrg(data);
  } catch (error) {
    console.error("Unable to load organization", error);
    return null;
  }
}

export async function getNpDashboardData() {
  try {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { org: null, campaigns: [] };
    const { data: profile } = await sb.from("profiles").select("org_id, app_role").eq("id", user.id).single();
    if (profile?.app_role !== "ngo_owner" || !profile.org_id) return { org: null, campaigns: [] };
    const { data: org } = await sb.from("organizations").select(PUBLIC_ORG_COLUMNS).eq("id", profile.org_id).single();
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
