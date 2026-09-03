import { createClient } from "@/lib/supabase/client";
import { toUICampaign, toUIProduct, attachProductIds } from "@/lib/supabase/query-helpers";
import type { CampaignWithOrg } from "@/lib/supabase/types";

export type DiscoverableProduct = {
  productId: string;
  campaignId: string;
  category: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  price: number;
  emoji: string;
  imageUrl?: string;
  videoUrl?: string;
  donationCount: number;
};

const CAMPAIGN_WITH_ORG = "*, organizations(id,name,name_en,initials,color,description,description_en,goals,logo_url,registration_number,verified,founded,founded_en,ceo,ceo_en,volunteers,address,address_en,activity_area,phone,video_gradient,created_at)";
const DEMO_CAMPAIGN_IDS = new Set([
  "c1111111-1111-1111-1111-111111111111",
  "c2222222-2222-2222-2222-222222222222",
  "c3333333-3333-3333-3333-333333333333",
  "c4444444-4444-4444-4444-444444444444",
  "c5555555-5555-5555-5555-555555555555",
  "c6666666-6666-6666-6666-666666666666",
]);

const withoutDemoCampaigns = <T extends { id: string }>(rows: T[] | null) => (rows ?? []).filter((row) => !DEMO_CAMPAIGN_IDS.has(row.id));

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

    const campaigns = withoutDemoCampaigns(data);
    const productMap = await attachProductIds(sb, campaigns.map((c) => c.id));
    return campaigns.map((row) => {
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
  if (DEMO_CAMPAIGN_IDS.has(id)) return null;
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

    const campaigns = withoutDemoCampaigns(data);
    const productMap = await attachProductIds(sb, campaigns.map((c) => c.id));
    return campaigns.map((row) => {
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

export async function getDiscoverableProducts(categories?: string[]) {
  try {
    const sb = createClient();
    const { data, error } = await sb.rpc("get_discoverable_products", { p_categories: categories ?? null });
    if (error) throw error;
    return (data ?? []).filter((product) => !DEMO_CAMPAIGN_IDS.has(product.campaign_id)).map((product) => ({
      productId: product.product_id,
      campaignId: product.campaign_id,
      category: product.category,
      name: product.name,
      nameEn: product.name_en ?? undefined,
      description: product.description ?? "",
      descriptionEn: product.description_en ?? undefined,
      price: Number(product.price),
      emoji: product.emoji ?? "💙",
      imageUrl: product.image_url ?? undefined,
      videoUrl: product.video_url ?? undefined,
      donationCount: Number(product.donation_count),
    } satisfies DiscoverableProduct));
  } catch (error) {
    console.error("Unable to load discoverable products", error);
    return [];
  }
}

export async function getDiscoverableProductsForAudience(audience: string) {
  try {
    const sb = createClient();
    const { data, error } = await sb.rpc("get_discoverable_products_for_audience", { p_audience: audience });
    if (error) throw error;
    return (data ?? []).filter((product) => !DEMO_CAMPAIGN_IDS.has(product.campaign_id)).map((product) => ({
      productId: product.product_id,
      campaignId: product.campaign_id,
      category: product.category,
      name: product.name,
      nameEn: product.name_en ?? undefined,
      description: product.description ?? "",
      descriptionEn: product.description_en ?? undefined,
      price: Number(product.price),
      emoji: product.emoji ?? "💙",
      imageUrl: product.image_url ?? undefined,
      videoUrl: product.video_url ?? undefined,
      donationCount: Number(product.donation_count),
    } satisfies DiscoverableProduct));
  } catch (error) {
    console.error("Unable to load audience products", error);
    return [];
  }
}
