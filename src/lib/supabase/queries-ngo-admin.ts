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
};

const PUBLIC_ORG_COLUMNS = "id,name,name_en,initials,color,description,description_en,logo_url,registration_number,verified,founded,founded_en,ceo,ceo_en,volunteers,address,address_en,phone,video_gradient,created_at";

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
  const [organization, campaigns, products, donations, communities, campaignProducts] = await Promise.all([
    sb.from("organizations").select(PUBLIC_ORG_COLUMNS).eq("id", orgId).single(),
    sb.from("campaigns").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    sb.from("products").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    sb.from("donations").select("*, campaigns(title,title_en), products(name,name_en)")
      .eq("org_id", orgId).order("created_at", { ascending: false }),
    sb.from("communities").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
    sb.from("campaign_products").select("campaign_id, product_id"),
  ]);
  const error = organization.error ?? campaigns.error ?? products.error ?? donations.error ?? communities.error ?? campaignProducts.error;
  if (error || !organization.data) throw new Error(error?.message ?? "Organization not found");
  return {
    organization: organization.data as Organization,
    campaigns: campaigns.data ?? [],
    products: products.data ?? [],
    donations: (donations.data ?? []) as NgoDonation[],
    communities: communities.data ?? [],
    campaignProducts: campaignProducts.data ?? [],
  };
}
