import { createClient } from "@/lib/supabase/client";
import { toUICampaign, toUIProduct, attachProductIds } from "@/lib/supabase/query-helpers";
import type { CampaignWithOrg } from "@/lib/supabase/types";

const CAMPAIGN_WITH_ORG = "*, organizations(id,name,name_en,initials,color,description,description_en,goals,logo_url,registration_number,verified,founded,founded_en,ceo,ceo_en,volunteers,address,address_en,phone,video_gradient,created_at)";

export async function getCampaigns(category?: string) {
  try {
    const sb = createClient();
    let query = sb
      .from("campaigns")
      .select(CAMPAIGN_WITH_ORG)
      .eq("status", "active")
      .order("donors_count", { ascending: false });

    if (category && category !== "all") query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw error;

    const productMap = await attachProductIds(sb, data.map((c) => c.id));
    return data.map((row) => {
      const c = toUICampaign(row as CampaignWithOrg);
      c.productIds = productMap[row.id] ?? [];
      return c;
    });
  } catch (error) {
    console.error("Unable to load campaigns", error);
    return [];
  }
}

export async function getCampaignById(id: string) {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from("campaigns")
      .select(CAMPAIGN_WITH_ORG)
      .eq("id", id)
      .single();

    if (error || !data) return null;

    const productMap = await attachProductIds(sb, [id]);
    const c = toUICampaign(data as CampaignWithOrg);
    c.productIds = productMap[id] ?? [];
    return c;
  } catch (error) {
    console.error("Unable to load campaign", error);
    return null;
  }
}

export async function searchCampaigns(query: string, category?: string) {
  try {
    const sb = createClient();
    let q = sb
      .from("campaigns")
      .select(CAMPAIGN_WITH_ORG)
      .eq("status", "active");

    if (query.trim()) {
      q = q.or(`title.ilike.%${query}%,title_en.ilike.%${query}%,short_desc.ilike.%${query}%`);
    }
    if (category && category !== "all") q = q.eq("category", category);

    const { data, error } = await q.order("donors_count", { ascending: false });
    if (error) throw error;

    const productMap = await attachProductIds(sb, data.map((c) => c.id));
    return data.map((row) => {
      const c = toUICampaign(row as CampaignWithOrg);
      c.productIds = productMap[row.id] ?? [];
      return c;
    });
  } catch (error) {
    console.error("Unable to search campaigns", error);
    return [];
  }
}

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  try {
    const sb = createClient();
    const { data, error } = await sb.from("products").select("*").in("id", ids);
    if (error) throw error;
    return data.map(toUIProduct);
  } catch (error) {
    console.error("Unable to load products", error);
    return [];
  }
}

export async function getCampaignsByOrg(orgId: string) {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from("campaigns")
      .select(CAMPAIGN_WITH_ORG)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!data) return [];

    const productMap = await attachProductIds(sb, data.map((campaign) => campaign.id));
    return data.map((row) => {
      const campaign = toUICampaign(row as CampaignWithOrg);
      campaign.productIds = productMap[row.id] ?? [];
      return campaign;
    });
  } catch (error) {
    console.error("Unable to load organization campaigns", error);
    return [];
  }
}

export async function getProducts() {
  try {
    const sb = createClient();
    const { data, error } = await sb.from("products").select("*").eq("active", true).order("created_at");
    if (error) throw error;
    return (data ?? []).map(toUIProduct);
  } catch (error) {
    console.error("Unable to load products", error);
    return [];
  }
}
