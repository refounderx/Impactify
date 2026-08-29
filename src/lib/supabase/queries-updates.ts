import { createClient } from "@/lib/supabase/client";

export type NgoUpdate = {
  id: string;
  org_id: string;
  audience: "all" | "campaigns" | "products";
  target_ids: string[];
  channels: Array<"push" | "email" | "sms">;
  timing: "now" | "scheduled" | "trigger";
  scheduled_at: string | null;
  trigger_type: "donation" | "quantity" | "days" | null;
  title: string;
  body: string;
  cta: "none" | "addProduct" | "priceQty";
  image_name: string | null;
  status: "active" | "paused" | "sent";
  sent_so_far: number;
  created_at: string;
  updated_at: string;
};

export type NgoUpdateDraft = {
  audience: NgoUpdate["audience"];
  targetIds: string[];
  channels: { push: boolean; email: boolean; sms: boolean };
  timing: NgoUpdate["timing"];
  scheduledAt: string;
  trigger: NonNullable<NgoUpdate["trigger_type"]>;
  title: string;
  body: string;
  cta: NgoUpdate["cta"];
  imageName: string | null;
};

export async function getNgoUpdates(): Promise<NgoUpdate[]> {
  const { data, error } = await createClient().from("ngo_updates").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as NgoUpdate[];
}

export async function saveNgoUpdate(draft: NgoUpdateDraft, updateId: string | null) {
  const channels = (Object.entries(draft.channels) as Array<[keyof NgoUpdateDraft["channels"], boolean]>)
    .filter(([, enabled]) => enabled)
    .map(([channel]) => channel);
  const { data, error } = await createClient().rpc("save_ngo_update", {
    p_update_id: updateId,
    p_audience: draft.audience,
    p_target_ids: draft.targetIds,
    p_channels: channels,
    p_timing: draft.timing,
    p_scheduled_at: draft.scheduledAt || null,
    p_trigger_type: draft.trigger,
    p_title: draft.title,
    p_body: draft.body,
    p_cta: draft.cta,
    p_image_name: draft.imageName,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function manageNgoUpdate(updateId: string, action: "duplicate" | "pause" | "resume" | "delete") {
  const { data, error } = await createClient().rpc("manage_ngo_update", { p_update_id: updateId, p_action: action });
  if (error) throw new Error(error.message);
  return data as string;
}
