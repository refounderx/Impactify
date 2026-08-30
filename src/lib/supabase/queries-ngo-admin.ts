import { createClient } from "@/lib/supabase/client";
import type { Campaign, Community, Donation, Organization, Product } from "@/lib/supabase/types";

export type NgoDonation = Donation & {
  campaigns: { title: string; title_en: string | null } | null;
  products: { name: string; name_en: string | null } | null;
};

export type NgoAdminData = {
  organization: Organization;
  campaigns: Campaign[];
  products: Product[];
  donations: NgoDonation[];
  communities: Community[];
  campaignProducts: { campaign_id: string; product_id: string }[];
  communityCampaigns: { community_id: string; campaign_id: string; status: "active" | "paused" }[];
};

export type NewNgoProduct = {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  emoji: string;
};

export type NgoProductUpdate = NewNgoProduct & { id: string; active: boolean };
export type NgoProfileDraft = {
  name: string;
  description: string;
  activityArea: string;
  address: string;
  phone: string;
  contact: string;
  founded: string;
  logoUrl: string;
};

const PUBLIC_ORG_COLUMNS = "id,name,name_en,initials,color,description,description_en,goals,logo_url,registration_number,verified,founded,founded_en,ceo,ceo_en,volunteers,address,address_en,activity_area,phone,video_gradient,created_at";

export async function getNgoProfile(): Promise<Organization> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Authentication required");
  const { data: profile, error: profileError } = await sb.from("profiles").select("org_id, app_role").eq("id", user.id).single();
  if (profileError || profile?.app_role !== "ngo_owner" || !profile.org_id) throw new Error("NGO owner profile required");
  const { data, error } = await sb.from("organizations").select(PUBLIC_ORG_COLUMNS).eq("id", profile.org_id).single();
  if (error || !data) throw new Error(error?.message ?? "Organization not found");
  return data as Organization;
}

export async function updateNgoProfile(profile: NgoProfileDraft) {
  const sb = createClient();
  const { error } = await sb.rpc("update_ngo_profile", {
    p_name: profile.name,
    p_description: profile.description || null,
    p_activity_area: profile.activityArea || null,
    p_address: profile.address || null,
    p_phone: profile.phone || null,
    p_ceo: profile.contact || null,
    p_founded: profile.founded || null,
    p_logo_url: profile.logoUrl || null,
  });
  if (error) throw new Error(error.message);
}

export async function getNgoAdminData(): Promise<NgoAdminData> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Authentication required");
  const { data: profile, error: profileError } = await sb.from("profiles")
    .select("org_id, app_role").eq("id", user.id).single();
  if (profileError || profile?.app_role !== "ngo_owner" || !profile.org_id) {
    throw new Error("NGO owner profile required");
  }
  const orgId = profile.org_id;
  const [organization, campaigns, products, donations, communities, campaignProducts, communityCampaigns] = await Promise.all([
    sb.from("organizations").select(PUBLIC_ORG_COLUMNS).eq("id", orgId).single(),
    sb.from("campaigns").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    sb.from("products").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    sb.from("donations").select("*, campaigns(title,title_en), products(name,name_en)")
      .eq("org_id", orgId).order("created_at", { ascending: false }),
    sb.from("communities").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    sb.from("campaign_products").select("campaign_id, product_id"),
    sb.from("community_campaigns").select("community_id,campaign_id,status").in("status", ["active", "paused"]),
  ]);
  const error = organization.error ?? campaigns.error ?? products.error ?? donations.error ?? communities.error ?? campaignProducts.error ?? communityCampaigns.error;
  if (error || !organization.data) throw new Error(error?.message ?? "Organization not found");
  return {
    organization: organization.data as Organization,
    campaigns: campaigns.data ?? [],
    products: products.data ?? [],
    donations: (donations.data ?? []) as NgoDonation[],
    communities: communities.data ?? [],
    campaignProducts: campaignProducts.data ?? [],
    communityCampaigns: (communityCampaigns.data ?? []) as NgoAdminData["communityCampaigns"],
  };
}

export async function createNgoProduct(product: NewNgoProduct): Promise<string> {
  const sb = createClient();
  const { data, error } = await sb.rpc("create_ngo_product", {
    p_name: product.name,
    p_name_en: product.nameEn || null,
    p_description: product.description || null,
    p_description_en: product.descriptionEn || null,
    p_price: product.price,
    p_emoji: product.emoji || null,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function updateNgoProduct(product: NgoProductUpdate): Promise<string> {
  const sb = createClient();
  const { data, error } = await sb.rpc("update_ngo_product", {
    p_product_id: product.id,
    p_name: product.name,
    p_name_en: product.nameEn || null,
    p_description: product.description || null,
    p_description_en: product.descriptionEn || null,
    p_price: product.price,
    p_emoji: product.emoji || null,
    p_active: product.active,
  });
  if (error) throw new Error(error.message);
  return data;
}
