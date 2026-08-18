import { createClient } from "@/lib/supabase/client";

export async function getMyDonations(userId: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from("donations")
    .select(`
      id, amount, created_at, receipt_id, status, is_recurring,
      campaigns ( id, title, title_en, emoji ),
      organizations ( name, name_en )
    `)
    .eq("donor_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((d) => ({
    id: d.id,
    campaignId: (d.campaigns as {id:string}|null)?.id ?? "",
    campaignTitle: (d.campaigns as {title:string}|null)?.title ?? "",
    campaignTitleEn: (d.campaigns as {title_en:string|null}|null)?.title_en ?? undefined,
    campaignEmoji: (d.campaigns as {emoji:string}|null)?.emoji ?? "💙",
    orgName: (d.organizations as {name:string}|null)?.name ?? "",
    amount: Number(d.amount),
    date: new Date(d.created_at).toLocaleDateString("he-IL"),
    receiptId: d.receipt_id ?? "",
  }));
}

export async function getMyRecurring(userId: string) {
  const sb = createClient();
  const { data, error } = await sb
    .from("recurring_donations")
    .select(`
      id, amount, status, start_date, next_charge_date,
      campaigns ( id, title, title_en, emoji, gradient ),
      organizations ( name, name_en, color, initials )
    `)
    .eq("donor_id", userId)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    campaignId: (r.campaigns as {id:string}|null)?.id ?? "",
    campaignTitle: (r.campaigns as {title:string}|null)?.title ?? "",
    campaignTitleEn: (r.campaigns as {title_en:string|null}|null)?.title_en ?? undefined,
    emoji: (r.campaigns as {emoji:string}|null)?.emoji ?? "💙",
    gradient: (r.campaigns as {gradient:string}|null)?.gradient ?? "from-teal-400 to-blue-400",
    orgName: (r.organizations as {name:string}|null)?.name ?? "",
    orgColor: (r.organizations as {color:string}|null)?.color ?? "#00B5AD",
    orgInitials: (r.organizations as {initials:string|null}|null)?.initials ?? "??",
    amount: Number(r.amount),
    status: r.status as "active" | "paused" | "cancelled",
    startDate: new Date(r.start_date).toLocaleDateString("he-IL"),
    nextCharge: r.next_charge_date
      ? new Date(r.next_charge_date).toLocaleDateString("he-IL")
      : "",
  }));
}

export async function updateRecurringStatus(id: string, status: "active" | "paused") {
  const sb = createClient();
  const { error } = await sb
    .from("recurring_donations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function cancelRecurring(id: string) {
  const sb = createClient();
  const { error } = await sb
    .from("recurring_donations")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}
