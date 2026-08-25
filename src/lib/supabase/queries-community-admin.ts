import { createClient } from "@/lib/supabase/client";
import type { Campaign, Community, Donation, Organization } from "@/lib/supabase/types";

export type CommunityDonation = Donation & {
  campaigns: { title: string; title_en: string | null } | null;
  products: { name: string; name_en: string | null } | null;
};

export type CommunityAdminData = {
  community: Community;
  organization: Organization | null;
  campaigns: Campaign[];
  donations: CommunityDonation[];
};

const ORG_COLUMNS = "id,name,name_en,initials,color,description,description_en,goals,logo_url,registration_number,verified,founded,founded_en,ceo,ceo_en,volunteers,address,address_en,phone,video_gradient,created_at";

export async function getCommunityAdminData(): Promise<CommunityAdminData> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Authentication required");
  const { data: profile, error: profileError } = await sb.from("profiles")
    .select("community_id, app_role").eq("id", user.id).single();
  if (profileError || profile?.app_role !== "community_owner" || !profile.community_id) {
    throw new Error("Community owner profile required");
  }
  const { data: community, error: communityError } = await sb.from("communities")
    .select("*").eq("id", profile.community_id).single();
  if (communityError || !community) throw new Error(communityError?.message ?? "Community not found");
  const [organization, campaigns, donations] = await Promise.all([
    community.org_id ? sb.from("organizations").select(ORG_COLUMNS).eq("id", community.org_id).single() : Promise.resolve({ data: null, error: null }),
    community.org_id ? sb.from("campaigns").select("*").eq("org_id", community.org_id).eq("status", "active").order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    sb.from("donations").select("*, campaigns(title,title_en), products(name,name_en)")
      .eq("community_id", community.id).order("created_at", { ascending: false }),
  ]);
  const error = organization.error ?? campaigns.error ?? donations.error;
  if (error) throw new Error(error.message);
  return {
    community,
    organization: organization.data as Organization | null,
    campaigns: campaigns.data ?? [],
    donations: (donations.data ?? []) as CommunityDonation[],
  };
}
