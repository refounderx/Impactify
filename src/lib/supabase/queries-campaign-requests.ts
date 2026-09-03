import { decidePartnershipRequest, getPartnershipRequests, type PartnershipRequest } from "@/lib/supabase/queries-partnerships";
export type CampaignJoinRequest = PartnershipRequest;
export async function getNgoCampaignRequests(): Promise<CampaignJoinRequest[]> {
  return getPartnershipRequests("inbox");
}
export async function manageNgoCampaignRequest(requestId: string, action: "approve" | "reject") {
  return decidePartnershipRequest(requestId, action);
}
