import type { Organization, Product, CampaignWithOrg } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

type PublicOrganization = Omit<Organization, "bank_name" | "bank_branch" | "bank_account">;

export function toUICampaign(row: CampaignWithOrg) {
  return {
    id: row.id,
    title: row.title,
    titleEn: row.title_en ?? undefined,
    orgId: row.org_id,
    category: row.category,
    raised: Number(row.raised),
    goal: Number(row.goal),
    donors: row.donors_count,
    daysLeft: row.end_date
      ? Math.max(0, Math.ceil((new Date(row.end_date).getTime() - Date.now()) / 86400000))
      : 0,
    gradient: row.gradient,
    emoji: row.emoji,
    shortDesc: row.short_desc ?? "",
    shortDescEn: row.short_desc_en ?? undefined,
    story: row.story ?? "",
    storyEn: row.story_en ?? undefined,
    heroImageUrl: row.hero_image_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    productIds: [] as string[],
    _org: row.organizations,
  };
}

export function toUIOrg(row: PublicOrganization) {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en ?? undefined,
    initials: row.initials ?? row.name.slice(0, 2),
    color: row.color,
    verified: row.verified,
    bio: row.description ?? undefined,
    bioEn: row.description_en ?? undefined,
    goals: row.goals,
    founded: row.founded ?? undefined,
    foundedEn: row.founded_en ?? undefined,
    ceo: row.ceo ?? undefined,
    ceoEn: row.ceo_en ?? undefined,
    volunteers: row.volunteers,
    address: row.address ?? undefined,
    addressEn: row.address_en ?? undefined,
    phone: row.phone ?? undefined,
    videoGradient: row.video_gradient,
  };
}

export function toUIProduct(row: Product) {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en ?? undefined,
    price: Number(row.price),
    description: row.description ?? "",
    descriptionEn: row.description_en ?? undefined,
    emoji: row.emoji ?? "💙",
  };
}

export async function attachProductIds(
  sb: ReturnType<typeof createClient>,
  campaignIds: string[]
): Promise<Record<string, string[]>> {
  if (campaignIds.length === 0) return {};
  const { data } = await sb
    .from("campaign_products")
    .select("campaign_id, product_id")
    .in("campaign_id", campaignIds);
  const map: Record<string, string[]> = {};
  data?.forEach(({ campaign_id, product_id }) => {
    if (!map[campaign_id]) map[campaign_id] = [];
    map[campaign_id].push(product_id);
  });
  return map;
}
