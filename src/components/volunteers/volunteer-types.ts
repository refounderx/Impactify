import type { VolunteerOpportunitySummary, VolunteerSignupSummary } from "@/lib/supabase/types";

export type VolunteerOpportunity = VolunteerOpportunitySummary;
export type VolunteerSignup = VolunteerSignupSummary;
export type VolunteerStatus = VolunteerSignup["status"];

export type OpportunityDraft = {
  title: string;
  description: string;
  startsAt: string;
  location: string;
  calendarUrl: string;
  capacity: string;
  campaignId: string;
};

export const emptyOpportunityDraft: OpportunityDraft = {
  title: "", description: "", startsAt: "", location: "", calendarUrl: "", capacity: "", campaignId: "",
};
