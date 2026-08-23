import { createClient } from "@/lib/supabase/client";
import { heroCards } from "@/lib/mock-data";

// ── Hero image+bubble cards ──────────────────────────────────
// Each row pairs one image with one caption bubble — they're stored together
// (not as separate image/text lists) so a future admin screen can edit or
// reorder a pair as a single unit. `image_url` is nullable: null keeps the
// existing color-block placeholder until a real image is uploaded.

type HeroCardRow = {
  id: string;
  image_url: string | null;
  bubble_text: string;
  bubble_text_en: string | null;
  display_order: number;
};

export async function getHeroCards(): Promise<typeof heroCards> {
  const sb = createClient();
  const { data, error } = await sb
    .from("hero_cards")
    .select("id, image_url, bubble_text, bubble_text_en, display_order")
    .order("display_order", { ascending: true });

  if (error || !data || data.length === 0) return heroCards;
  return (data as HeroCardRow[]).map((r, i) => ({
    id: r.id,
    imageUrl: r.image_url,
    placeholderClass: heroCards[i % heroCards.length]?.placeholderClass ?? "bg-gray-200",
    bubbleText: r.bubble_text,
    bubbleTextEn: r.bubble_text_en ?? r.bubble_text,
  }));
}
