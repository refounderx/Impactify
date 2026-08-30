import { createClient } from "@/lib/supabase/client";
import type { ProductDonation } from "@/lib/mock-data";
import type { SharedSiteData } from "@/lib/site-dataset-types";
import type { TaxDonationRecord } from "@/lib/donation-documents";

type DonorUpdate = SharedSiteData["donorUpdates"][number];
type QuarterlyDonationData = SharedSiteData["quarterlyDonationData"];

// Explicit row types — campaign_updates and new donation columns aren't in
// the generated types.ts yet (requires supabase gen types after migration runs).
type DonRow = {
  id: string;
  campaign_id: string;
  amount: number;
  created_at: string;
  donation_type: string | null;
  quantity: number | null;
  last_four: string | null;
  card_brand: string | null;
  receipt_id: string | null;
  products: { id: string; name: string; name_en: string; description: string; description_en: string; emoji: string } | null;
  organizations: { name: string; initials: string } | null;
  campaigns: { donors_count: number } | null;
};

type UpdateRow = {
  id: string;
  description: string;
  description_en: string | null;
  has_video: boolean;
  gradient: string;
  created_at: string;
  campaigns: { title: string; title_en: string | null } | null;
};

type QuarterRow = {
  amount: number;
  donation_type: string | null;
  created_at: string;
};

type TaxDonationRow = {
  id: string;
  amount: number;
  created_at: string;
  receipt_id: string | null;
  organizations: { name: string } | null;
};

// ── Product-grouped donations ────────────────────────────────

export async function getMyProductDonations(userId: string): Promise<ProductDonation[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("donations")
    .select(`
      id, campaign_id, amount, created_at, donation_type, quantity, last_four, card_brand, receipt_id,
      products ( id, name, name_en, description, description_en, emoji ),
      organizations ( name, initials ),
      campaigns ( donors_count )
    `)
    .eq("donor_id", userId)
    .eq("status", "completed")
    .not("product_id", "is", null)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as DonRow[];
  if (error) throw new Error(`Unable to load product donations: ${error.message}`);
  if (rows.length === 0) return [];

  // Group by product id
  const groups = new Map<string, DonRow[]>();
  for (const d of rows) {
    const pid = d.products?.id ?? "unknown";
    if (!groups.has(pid)) groups.set(pid, []);
    groups.get(pid)!.push(d);
  }

  return Array.from(groups.entries()).map(([pid, group]): ProductDonation => {
    const latest = group[0];
    return {
      id: pid,
      productId: pid,
      campaignId: latest.campaign_id,
      productName:    latest.products?.name        ?? "",
      productNameEn:  latest.products?.name_en     ?? "",
      productDetail:  latest.products?.description ?? "",
      productDetailEn: latest.products?.description_en ?? "",
      quantity: group.reduce((s, r) => s + (r.quantity ?? 1), 0),
      orgName:  latest.organizations?.name     ?? "",
      orgCode:  latest.organizations?.initials ?? "",
      lastDonationDate: new Date(latest.created_at).toLocaleDateString("he-IL"),
      lastDonationTime: new Date(latest.created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      lastDonationAmount: Number(latest.amount),
      donorCount: latest.campaigns?.donors_count ?? 0,
      paymentLast4: latest.last_four ?? "0000",
      donationType: latest.donation_type ?? 'הו"ק',
      emoji: latest.products?.emoji ?? "📦",
      receipts: group.map((r) => ({
        id: r.id,
        date: new Date(r.created_at).toLocaleDateString("he-IL"),
        amount: Number(r.amount),
        type: r.donation_type ?? 'הו"ק',
        paymentLast4: r.last_four ?? "0000",
      })),
    };
  });
}

export async function getMyTaxDonationRecords(userId: string): Promise<TaxDonationRecord[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("donations")
    .select("id, amount, created_at, receipt_id, organizations ( name )")
    .eq("donor_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Unable to load tax donation records: ${error.message}`);
  return ((data ?? []) as unknown as TaxDonationRow[]).map((donation) => ({
    id: donation.id,
    date: new Date(donation.created_at).toLocaleDateString("he-IL"),
    amount: Number(donation.amount),
    receiptId: donation.receipt_id ?? donation.id,
    organization: donation.organizations?.name ?? "",
  }));
}

// ── Campaign update posts ────────────────────────────────────

export async function getDonorUpdates(userId: string | null): Promise<DonorUpdate[]> {
  const sb = createClient();

  // When logged in, prefer updates for campaigns the donor donated to
  let campaignIds: string[] = [];
  if (userId) {
    const { data: donated } = await sb
      .from("donations")
      .select("campaign_id")
      .eq("donor_id", userId)
      .eq("status", "completed");
    campaignIds = [...new Set((donated ?? []).map((d) => (d as { campaign_id: string }).campaign_id))];
  }

  let q = sb
    .from("campaign_updates")
    .select("id, description, description_en, has_video, gradient, created_at, campaigns ( title, title_en )")
    .order("created_at", { ascending: false })
    .limit(6);

  if (campaignIds.length > 0) q = (q as typeof q).in("campaign_id", campaignIds);

  const { data, error } = await q;
  if (error) throw new Error(`Unable to load donor updates: ${error.message}`);
  if (!data || data.length === 0) return [];
  const updates = data as unknown as UpdateRow[];

  return updates.map((u) => ({
    id: u.id,
    date: new Date(u.created_at).toLocaleDateString("he-IL"),
    hasVideo: u.has_video,
    productName:   u.campaigns?.title    ?? "",
    productNameEn: u.campaigns?.title_en ?? "",
    description:   u.description,
    descriptionEn: u.description_en ?? "",
    gradient: u.gradient,
  }));
}

// ── Quarterly aggregation ────────────────────────────────────

export async function getQuarterlyStats(userId: string): Promise<QuarterlyDonationData> {
  const sb = createClient();
  const now = new Date();
  const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const qEnd   = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0, 23, 59, 59);

  const { data, error } = await sb
    .from("donations")
    .select("amount, donation_type, created_at")
    .eq("donor_id", userId)
    .eq("status", "completed")
    .gte("created_at", qStart.toISOString())
    .lte("created_at", qEnd.toISOString());

  if (error) throw new Error(`Unable to load quarterly statistics: ${error.message}`);
  const rows = data as unknown as QuarterRow[];

  const MONTHS_HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
  const byMonth = new Map<number, QuarterRow[]>();
  for (const d of rows) {
    const m = new Date(d.created_at).getMonth();
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(d);
  }

  const total = rows.reduce((s, d) => s + Number(d.amount), 0);
  const months = Array.from(byMonth.entries())
    .sort(([a], [b]) => a - b)
    .map(([m, group]) => {
      const recurring = group.filter((r) => r.donation_type === 'הו"ק').reduce((s, r) => s + Number(r.amount), 0);
      const oneTime   = group.filter((r) => r.donation_type !== 'הו"ק').reduce((s, r) => s + Number(r.amount), 0);
      return {
        label: MONTHS_HE[m],
        bars: [
          { type: 'הו"ק', amount: recurring },
          { type: 'חד"פ', amount: oneTime },
          { type: 'סה"כ', amount: recurring + oneTime },
        ],
      };
    });

  const fmt = (d: Date) => d.toLocaleDateString("he-IL");
  return {
    total,
    period: `${fmt(qStart)}–${fmt(qEnd)}`,
    months,
  };
}
