import { createClient } from "@/lib/supabase/client";
import type { NgoUpdate, NgoUpdateDraft } from "@/lib/supabase/queries-updates";

export type CommunityUpdate = Omit<NgoUpdate, "org_id" | "audience"> & { community_id: string; audience: "all" | "campaigns" };
export type CommunityUpdateDraft = Omit<NgoUpdateDraft, "audience"> & { audience: "all" | "campaigns" };

export async function getCommunityUpdates(): Promise<CommunityUpdate[]> {
  const { data, error } = await createClient().from("community_updates").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as CommunityUpdate[];
}

export async function saveCommunityUpdate(draft: CommunityUpdateDraft, updateId: string | null) {
  const channels = (Object.entries(draft.channels) as Array<[keyof CommunityUpdateDraft["channels"], boolean]>).filter(([, enabled]) => enabled).map(([channel]) => channel);
  const { data, error } = await createClient().rpc("save_community_update", { p_update_id: updateId, p_audience: draft.audience, p_target_ids: draft.targetIds, p_channels: channels, p_timing: draft.timing, p_scheduled_at: draft.scheduledAt || null, p_trigger_type: draft.trigger, p_title: draft.title, p_body: draft.body, p_cta: draft.cta, p_image_name: draft.imageName });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function manageCommunityUpdate(updateId: string, action: "duplicate" | "pause" | "resume" | "delete") {
  const { data, error } = await createClient().rpc("manage_community_update", { p_update_id: updateId, p_action: action });
  if (error) throw new Error(error.message);
  return data as string;
}
