import { createClient } from "@/lib/supabase/client";
import { campaigns as mockCampaigns, products as mockProducts } from "@/lib/mock-data";
import { toUICampaign, toUIProduct, attachProductIds } from "@/lib/supabase/query-helpers";
import type { CampaignWithOrg } from "@/lib/supabase/types";

export async function getCampaigns(category?: string) {
  try {
    const sb = createClient();
    let query = sb
      .from("campaigns")
      .select("*, organizations(*)")
      .eq("status", "active")
      .order("donors_count", { ascending: false });

    if (category && category !== "all") query = query.eq("category", category);

    const { data, error } = await query;
    if (error || !data || data.length === 0) return mockCampaigns;

    const productMap = await attachProductIds(sb, data.map((c) => c.id));
    return data.map((row) => {
      const c = toUICampaign(row as CampaignWithOrg);
      c.productIds = productMap[row.id] ?? [];
      return c;
    });
  } catch {
    return mockCampaigns;
  }
}

export async function getCampaignById(id: string) {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from("campaigns")
      .select("*, organizations(*)")
      .eq("id", id)
      .single();

    if (error || !data) return mockCampaigns.find((c) => c.id === id) ?? null;

    const productMap = await attachProductIds(sb, [id]);
    const c = toUICampaign(data as CampaignWithOrg);
    c.productIds = productMap[id] ?? [];
    return c;
  } catch {
    return mockCampaigns.find((c) => c.id === id) ?? null;
  }
}

export async function searchCampaigns(query: string, category?: string) {
  try {
    const sb = createClient();
    let q = sb
      .from("campaigns")
      .select("*, organizations(*)")
      .eq("status", "active");

    if (query.trim()) {
      q = q.or(`title.ilike.%${query}%,title_en.ilike.%${query}%,short_desc.ilike.%${query}%`);
    }
    if (category && category !== "all") q = q.eq("category", category);

    const { data, error } = await q.order("donors_count", { ascending: false });
    if (error || !data) return mockCampaigns;

    const productMap = await attachProductIds(sb, data.map((c) => c.id));
    return data.map((row) => {
      const c = toUICampaign(row as CampaignWithOrg);
      c.productIds = productMap[row.id] ?? [];
      return c;
    });
  } catch {
    return mockCampaigns;
  }
}

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  try {
    const sb = createClient();
    const { data, error } = await sb.from("products").select("*").in("id", ids);
    if (error || !data || data.length === 0) return mockProducts.filter((p) => ids.includes(p.id));
    return data.map(toUIProduct);
  } catch {
    return mockProducts.filter((p) => ids.includes(p.id));
  }
}
