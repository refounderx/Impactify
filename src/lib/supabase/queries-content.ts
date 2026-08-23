import { createClient } from "@/lib/supabase/client";

// ── Site content overrides (admin-editable static text) ─────────
// Keyed by the same string keys used in translations.ts. A row here
// overrides the static value for that key; missing row = static fallback.
// See supabase/schema.sql migration 2026-08-23 for the RLS/trust note.

export type ContentOverrides = Record<string, { he: string; en: string }>;

type SiteContentRow = { key: string; text_he: string | null; text_en: string | null };

export async function getSiteContentOverrides(): Promise<ContentOverrides> {
  try {
    const sb = createClient();
    const { data, error } = await sb.from("site_content").select("key, text_he, text_en");
    if (error || !data) return {};

    const overrides: ContentOverrides = {};
    for (const row of data as SiteContentRow[]) {
      overrides[row.key] = { he: row.text_he ?? "", en: row.text_en ?? "" };
    }
    return overrides;
  } catch {
    return {};
  }
}

export async function upsertSiteContent(key: string, he: string, en: string): Promise<boolean> {
  try {
    const sb = createClient();
    const { error } = await sb
      .from("site_content")
      .upsert({ key, text_he: he, text_en: en, updated_at: new Date().toISOString() });
    return !error;
  } catch {
    return false;
  }
}
