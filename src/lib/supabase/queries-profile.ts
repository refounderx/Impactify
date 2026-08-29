import { createClient } from "@/lib/supabase/client";
import type { SharedSiteData } from "@/lib/site-dataset-types";

// ── Personal details ─────────────────────────────────────────

export type DonorProfile = {
  fullName: string;
  phone: string;
  email: string;
  idNumber: string;
  joinDate: string;
};

const EMPTY_PROFILE: DonorProfile = { fullName: "", phone: "", email: "", idNumber: "", joinDate: "" };
export type PaymentMethod = SharedSiteData["savedPaymentMethods"][number];
type SystemUpdate = SharedSiteData["systemUpdates"][number];

type ProfileRow = {
  full_name: string | null;
  phone: string | null;
  email: string | null;
  id_number: string | null;
  created_at: string;
};

export async function getDonorProfile(userId: string): Promise<DonorProfile> {
  const sb = createClient();
  const { data, error } = await sb
    .from("profiles")
    .select("full_name, phone, email, id_number, created_at")
    .eq("id", userId)
    .single();

  if (error || !data) return EMPTY_PROFILE;
  const row = data as ProfileRow;
  return {
    fullName: row.full_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    idNumber: row.id_number ?? "",
    joinDate: new Date(row.created_at).toLocaleDateString("he-IL"),
  };
}

export async function updateDonorProfile(
  userId: string,
  patch: { fullName: string; phone: string; idNumber: string }
): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb
    .from("profiles")
    .update({ full_name: patch.fullName, phone: patch.phone, id_number: patch.idNumber })
    .eq("id", userId);
  return !error;
}

// ── Payment methods ──────────────────────────────────────────
// Stores only brand + last 4 digits — no raw card number ever passes through
// the app. Real tokenized storage depends on the still-open PSP choice
// (Tranzilla / Cardcom / PayMe — see project memory).

type PaymentMethodRow = { id: string; brand: string; last_four: string };

export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("payment_methods")
    .select("id, brand, last_four")
    .eq("donor_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as PaymentMethodRow[]).map((r) => ({ id: r.id, brand: r.brand, last4: r.last_four }));
}

export async function addPaymentMethod(
  userId: string,
  brand: string,
  last4: string
): Promise<{ id: string; brand: string; last4: string } | null> {
  const sb = createClient();
  const { data, error } = await sb
    .from("payment_methods")
    .insert({ donor_id: userId, brand, last_four: last4 })
    .select("id, brand, last_four")
    .single();

  if (error || !data) return null;
  const row = data as PaymentMethodRow;
  return { id: row.id, brand: row.brand, last4: row.last_four };
}

export async function removePaymentMethod(userId: string, id: string): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb
    .from("payment_methods")
    .delete()
    .eq("id", id)
    .eq("donor_id", userId);
  return !error;
}

// ── Profile special days ─────────────────────────────────────

export type ProfileSpecialDay = { id: string; title: string; eventDate: string; emoji: string };

export async function getProfileSpecialDays(userId: string): Promise<ProfileSpecialDay[]> {
  const sb = createClient();
  const { data, error } = await sb.from("profile_special_days")
    .select("id, title, event_date, emoji").eq("profile_id", userId).order("event_date");
  if (error || !data) return [];
  return data.map((row) => ({ id: row.id, title: row.title, eventDate: row.event_date, emoji: row.emoji }));
}

export async function addProfileSpecialDay(userId: string, title: string, eventDate: string, emoji: string) {
  const sb = createClient();
  const { data, error } = await sb.from("profile_special_days")
    .insert({ profile_id: userId, title: title.trim(), event_date: eventDate, emoji })
    .select("id, title, event_date, emoji").single();
  if (error || !data) return null;
  return { id: data.id, title: data.title, eventDate: data.event_date, emoji: data.emoji } satisfies ProfileSpecialDay;
}

export async function removeProfileSpecialDay(userId: string, id: string): Promise<boolean> {
  const sb = createClient();
  const { error } = await sb.from("profile_special_days").delete().eq("id", id).eq("profile_id", userId);
  return !error;
}

// ── System updates ───────────────────────────────────────────
// RLS on system_updates already scopes rows to the caller (own donor_id or
// broadcast rows with donor_id null), so no client-side filtering is needed.

type SystemUpdateRow = {
  id: string;
  title: string;
  title_en: string | null;
  detail: string | null;
  detail_en: string | null;
  status: string;
  action_label: string | null;
  action_label_en: string | null;
  created_at: string;
};

export async function getSystemUpdates(): Promise<SystemUpdate[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("system_updates")
    .select("id, title, title_en, detail, detail_en, status, action_label, action_label_en, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return (data as SystemUpdateRow[]).map((r) => ({
    id: r.id,
    date: new Date(r.created_at).toLocaleDateString("he-IL"),
    title: r.title,
    titleEn: r.title_en ?? "",
    detail: r.detail ?? "",
    detailEn: r.detail_en ?? "",
    status: (r.status as "info" | "pending" | "action_required") ?? "info",
    actionLabel: r.action_label ?? "",
    actionLabelEn: r.action_label_en ?? "",
  }));
}
