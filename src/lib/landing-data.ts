export type AudienceKind = "elderly" | "soldier" | "teen" | "baby" | "child";

export const audienceIcons: { id: string; kind: AudienceKind; labelKey: string; emoji: string }[] = [
  { id: "elderly-1", kind: "elderly", labelKey: "landing.aud.elderly", emoji: "👴" },
  { id: "soldier-1", kind: "soldier", labelKey: "landing.aud.soldier", emoji: "🪖" },
  { id: "teen", kind: "teen", labelKey: "landing.aud.teen", emoji: "🧑" },
  { id: "baby", kind: "baby", labelKey: "landing.aud.baby", emoji: "🍼" },
  { id: "child", kind: "child", labelKey: "landing.aud.child", emoji: "🧒" },
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
