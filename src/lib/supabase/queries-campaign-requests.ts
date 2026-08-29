import { createClient } from "@/lib/supabase/client";
export type CampaignJoinRequest = { community_campaign_id: string; campaign_id: string; community_id: string; community_name: string; campaign_title: string; requested_at: string };
export async function getNgoCampaignRequests(): Promise<CampaignJoinRequest[]> {
  const { data, error } = await createClient().rpc("get_ngo_campaign_requests");
  if (error) throw new Error(error.message);
  return data ?? [];
}
export async function manageNgoCampaignRequest(id: string, action: "approve" | "reject") {
  const { error } = await createClient().rpc("manage_ngo_campaign_request", { p_membership_id: id, p_action: action });
  if (error) throw new Error(error.message);
}
