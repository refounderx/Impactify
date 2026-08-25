import type { createClient } from "@/lib/supabase/client";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateCampaignVideoUrl(value: string) {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getCampaignVideoSource(value: string | null | undefined) {
  const safeUrl = value ? validateCampaignVideoUrl(value) : null;
  if (!safeUrl) return null;
  const url = new URL(safeUrl);
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? { kind: "embed" as const, url: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` } : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v") ?? (url.pathname.startsWith("/shorts/") ? url.pathname.split("/")[2] : null);
    return id ? { kind: "embed" as const, url: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).findLast((part) => /^\d+$/.test(part));
    return id ? { kind: "embed" as const, url: `https://player.vimeo.com/video/${id}` } : null;
  }
  return { kind: "video" as const, url: safeUrl };
}

export async function uploadCampaignImage(client: SupabaseBrowserClient, file: File, orgId: string) {
  const extension = EXTENSIONS[file.type];
  if (!extension) throw new Error("Unsupported campaign image format");
  const path = `${orgId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from("campaign-media").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = client.storage.from("campaign-media").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
