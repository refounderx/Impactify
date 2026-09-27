import { createClient } from "@/lib/supabase/client";
import type { VolunteerOpportunity, VolunteerSignup, OpportunityDraft } from "@/components/volunteers/volunteer-types";

const rpcError = (error: { message: string } | null) => { if (error) throw new Error(error.message); };
const opportunityArgs = (draft: OpportunityDraft) => ({
  p_title: draft.title, p_description: draft.description, p_starts_at: draft.startsAt || null,
  p_location: draft.location || null, p_calendar_url: draft.calendarUrl || null,
  p_capacity: draft.capacity ? Number(draft.capacity) : null, p_campaign_id: draft.campaignId || null,
});

export async function getVolunteerDashboard(kind: "ngo" | "community") {
  const sb = createClient();
  const [opportunities, signups] = await Promise.all([
    sb.rpc(kind === "ngo" ? "get_ngo_volunteer_opportunities" : "get_community_volunteer_opportunities"),
    sb.rpc(kind === "ngo" ? "get_ngo_volunteer_signups" : "get_community_volunteer_signups"),
  ]);
  rpcError(opportunities.error); rpcError(signups.error);
  return { opportunities: (opportunities.data ?? []) as VolunteerOpportunity[], signups: (signups.data ?? []) as VolunteerSignup[] };
}

export async function saveVolunteerOpportunity(draft: OpportunityDraft, id?: string) {
  const sb = createClient();
  const result = id ? await sb.rpc("update_volunteer_opportunity", { p_opportunity_id: id, ...opportunityArgs(draft) }) : await sb.rpc("create_volunteer_opportunity", opportunityArgs(draft));
  rpcError(result.error); return result.data;
}
export async function setVolunteerOpportunityStatus(id: string, status: "active" | "full" | "closed") {
  const { error } = await createClient().rpc("set_volunteer_opportunity_status", { p_opportunity_id: id, p_status: status }); rpcError(error);
}
export async function setVolunteerSignupStatus(id: string, status: VolunteerSignup["status"]) {
  const { error } = await createClient().rpc("set_volunteer_signup_status", { p_signup_id: id, p_status: status }); rpcError(error);
}
export async function registerForVolunteerOpportunity(id: string) {
  const { data, error } = await createClient().rpc("register_for_volunteer_opportunity", { p_opportunity_id: id }); rpcError(error); return data?.[0] ?? null;
}
