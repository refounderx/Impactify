"use client";
import { useCommunityAdminView } from "@/hooks/useCommunityAdminView";
import VolunteerDashboard from "@/components/volunteers/VolunteerDashboard";
export default function CommunityVolunteersPage() { const { data } = useCommunityAdminView(); return <VolunteerDashboard kind="community" campaigns={(data?.communityCampaignRows ?? []).filter((campaign) => !campaign.paused).map((campaign) => ({ id: campaign.id, title: campaign.name }))} />; }
