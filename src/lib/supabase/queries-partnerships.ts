import { createClient } from "@/lib/supabase/client";

export type PartnershipRequest = {
  id: string;
  community_id: string;
  community_name: string;
  campaign_id: string;
  campaign_title: string;
  org_id: string;
  org_name: string;
  initiator_type: "community" | "organization";
  status: "queued" | "active_review" | "approved" | "rejected" | "cancelled";
  requested_at: string;
  promoted_at: string | null;
  review_slot: number | null;
};

export type PartnershipNotification = {
  id: string;
  total_waiting: number;
  new_waiting: number;
  created_at: string;
  read_at: string | null;
};

export async function getPartnershipRequests(view: "inbox" | "backlog" | "sent") {
  const { data, error } = await createClient().rpc("get_partnership_requests", { p_view: view });
  if (error) throw new Error(error.message);
  return (data ?? []) as PartnershipRequest[];
}

export async function decidePartnershipRequest(id: string, action: "approve" | "reject") {
  const { data, error } = await createClient().rpc("decide_partnership_request", { p_request_id: id, p_action: action });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function cancelPartnershipRequest(id: string) {
  const { data, error } = await createClient().rpc("cancel_partnership_request", { p_request_id: id });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function getPartnershipNotifications() {
  const sb = createClient();
  const { data: profile, error: profileError } = await sb.from("profiles").select("app_role,org_id,community_id").single();
  if (profileError || !profile) throw new Error(profileError?.message ?? "Profile not found");
  const recipientType = profile.app_role === "ngo_owner" ? "organization" : "community";
  const recipientId = profile.app_role === "ngo_owner" ? profile.org_id : profile.community_id;
  if (!recipientId) return [];
  const { data, error } = await sb.from("partnership_notifications").select("id,total_waiting,new_waiting,created_at,read_at")
    .eq("recipient_type", recipientType).eq("recipient_id", recipientId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PartnershipNotification[];
}
