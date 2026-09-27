"use client";
import { useNgoAdminView } from "@/hooks/useNgoAdminView";
import VolunteerDashboard from "@/components/volunteers/VolunteerDashboard";
export default function NgoVolunteersPage() { const { data } = useNgoAdminView(); return <VolunteerDashboard kind="ngo" campaigns={(data?.adminCampaignRows ?? []).map((campaign) => ({ id: campaign.id, title: campaign.name }))} />; }
