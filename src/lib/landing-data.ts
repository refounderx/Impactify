export type AudienceKind = "elderly" | "soldier" | "teen" | "baby" | "child";

export const audienceIcons: { id: string; kind: AudienceKind; labelKey: string; emoji: string }[] = [
  { id: "elderly-1", kind: "elderly", labelKey: "landing.aud.elderly", emoji: "👴" },
  { id: "soldier-1", kind: "soldier", labelKey: "landing.aud.soldier", emoji: "🪖" },
  { id: "teen", kind: "teen", labelKey: "landing.aud.teen", emoji: "🧑" },
  { id: "baby", kind: "baby", labelKey: "landing.aud.baby", emoji: "🍼" },
  { id: "child", kind: "child", labelKey: "landing.aud.child", emoji: "🧒" },
];

export type AudienceProduct = { id: string; title: string; titleEn: string; price: number; emoji: string; imageUrl?: string; videoUrl?: string };

export const audienceProducts: Record<AudienceKind, AudienceProduct[]> = {
  elderly: [
    { id: "eld1", title: "ארוחה חמה יומית לקשיש", titleEn: "Daily Hot Meal for the Elderly", price: 50, emoji: "🍲" },
    { id: "eld2", title: "סל מזון שבועי לקשיש", titleEn: "Weekly Food Basket for the Elderly", price: 150, emoji: "🛒" },
    { id: "eld3", title: "חבילת חימום לחורף לקשיש", titleEn: "Winter Warmth Package for the Elderly", price: 200, emoji: "🧥" },
  ],
  soldier: [
    { id: "sol1", title: 'פק"ל קפה + פינוקים לחייל/ת', titleEn: "Coffee & Treats Package for Soldiers", price: 150, emoji: "☕" },
    { id: "sol2", title: "ציוד חורף לחייל/ת בשטח", titleEn: "Winter Gear for Soldiers in the Field", price: 180, emoji: "🧤" },
    { id: "sol3", title: "מארז פינוק לחיילים בודדים", titleEn: "Treat Package for Lone Soldiers", price: 120, emoji: "🎁" },
  ],
  teen: [
    { id: "teen1", title: "ציוד לימודים לנוער בסיכון", titleEn: "School Supplies for At-Risk Youth", price: 80, emoji: "✏️" },
    { id: "teen2", title: "חוג העשרה שבועי לנער/ה", titleEn: "Weekly Enrichment Class for Teens", price: 100, emoji: "🎨" },
    { id: "teen3", title: "יום כיף במרכז נוער", titleEn: "Fun Day at the Youth Center", price: 60, emoji: "⚽" },
  ],
  baby: [
    { id: "baby1", title: "חבילת חיתולים ומזון לתינוק", titleEn: "Diapers & Formula Package for a Baby", price: 90, emoji: "🍼" },
    { id: "baby2", title: "סל בגדי חורף לתינוק", titleEn: "Winter Clothing Basket for a Baby", price: 130, emoji: "🧸" },
    { id: "baby3", title: "מארז מוצרי היגיינה לתינוק", titleEn: "Hygiene Products Package for a Baby", price: 70, emoji: "🛁" },
  ],
  child: [
    { id: "child1", title: "סל ספרים לשנת הלימודים", titleEn: "Book Basket for the School Year", price: 120, emoji: "📚" },
    { id: "child2", title: "ציוד לימודים לילד/ה", titleEn: "School Supplies for a Child", price: 80, emoji: "🎒" },
    { id: "child3", title: "כרטיס לחוג קיץ לילד/ה", titleEn: "Summer Camp Pass for a Child", price: 150, emoji: "🏕️" },
  ],
};

export const checkoutProgress = { goal: 5000, raised: 4500 };

export const landingProducts = [
  { id: "lp1", titleKey: "landing.products.item1", price: 126, emoji: "☕", cta: "buy" as const },
  { id: "lp2", titleKey: "landing.products.item1", price: 126, emoji: "🍱", cta: "buy" as const },
  { id: "lp3", titleKey: "landing.products.item2", priceRange: "50-100", emoji: "▶", cta: "campaign" as const },
  { id: "lp4", titleKey: "landing.products.item1", price: 126, emoji: "🍱", cta: "buy" as const },
];

export const impactTiles = [
  { id: 1, value: "1,085", captionKey: "landing.impact.tile1", color: "teal" as const, live: false },
  { id: 2, value: "8,124", captionKey: "landing.impact.tile2", color: "teal" as const, live: true },
  { id: 3, value: "1,085", captionKey: "landing.impact.tile1", color: "pink" as const, live: false },
  { id: 4, value: "78", captionKey: "landing.impact.tile4", color: "yellow" as const, live: false },
  { id: 5, value: "12,268", captionKey: "landing.impact.tile5", color: "dark" as const, live: false },
  { id: 6, value: "86", captionKey: "landing.impact.tile6", color: "teal-sm" as const, live: false },
];

export const qualityBadgeCount = 6;

export const socialLinks = [
  { id: "whatsapp", label: "W", href: "#" },
  { id: "instagram", label: "IG", href: "#" },
  { id: "facebook", label: "f", href: "#" },
  { id: "linkedin", label: "in", href: "#" },
];

export const authProviders = [
  { id: "facebook", label: "f" },
  { id: "google", label: "G" },
  { id: "apple", label: "" },
];
