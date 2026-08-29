"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import NgoGoalsEditor from "@/components/profile/NgoGoalsEditor";
import NonprofitOrganizationProfile from "@/components/profile/NonprofitOrganizationProfile";

export default function NonprofitProfilePage() {
  const { profile, loading } = useAuth();
  const { lang } = useLang();

  if (loading) return <div className="min-h-96 animate-pulse rounded-3xl bg-white/60" />;
  if (profile?.app_role !== "ngo_owner" || !profile.org_id) return <p className="rounded-2xl bg-white p-8 text-center text-gray-600">{lang === "en" ? "An NGO-owner profile is required." : "נדרש פרופיל מנהל עמותה."}</p>;

  return <main className="mx-auto max-w-6xl space-y-12 pb-10"><NonprofitOrganizationProfile /><NgoGoalsEditor orgId={profile.org_id} /></main>;
}
