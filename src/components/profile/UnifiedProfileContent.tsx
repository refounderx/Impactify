"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import NgoGoalsEditor from "@/components/profile/NgoGoalsEditor";
import NgoProfileDetails from "@/components/profile/NgoProfileDetails";
import ProfileSpecialDays from "@/components/profile/ProfileSpecialDays";
import DonorProfileActivity from "@/components/profile/DonorProfileActivity";

const ROLE_COPY = {
  donor: { he: "ניהול הפרטים האישיים והפעילות שלך", en: "Manage your details and giving activity" },
  ngo_owner: { he: "ניהול הפרטים האישיים ופרטי העמותה", en: "Manage your personal and organization information" },
  community_owner: { he: "ניהול הפרטים האישיים ופרטי הקהילה", en: "Manage your personal and community information" },
  admin: { he: "ניהול הפרטים האישיים והחשבון", en: "Manage your personal details and account" },
} as const;

export default function UnifiedProfileContent({ showSignOut = false }: { showSignOut?: boolean }) {
  const { user, profile, loading, signOut } = useAuth();
  const { lang } = useLang();

  if (loading) return <div className="min-h-72 animate-pulse rounded-2xl bg-white" aria-label={lang === "en" ? "Loading profile" : "טוען פרופיל"} />;
  if (!user) return (
    <section className="rounded-2xl bg-white p-10 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-raz-dark">{lang === "en" ? "Your profile is waiting" : "הפרופיל שלך מחכה לך"}</h1>
      <p className="mt-3 text-gray-500">{lang === "en" ? "Sign in to view and update your details." : "יש להתחבר כדי לצפות בפרטים ולעדכן אותם."}</p>
      <Link href="/auth" className="mt-6 inline-flex rounded-xl bg-raz-teal px-6 py-3 font-bold text-white">{lang === "en" ? "Sign in to profile" : "התחברות לפרופיל"}</Link>
    </section>
  );

  const role = profile?.app_role ?? "donor";
  const intro = ROLE_COPY[role];

  return (
    <main className="space-y-12" dir={lang === "en" ? "ltr" : "rtl"}>
      <header className="flex flex-wrap items-end justify-between gap-5 pt-2">
        <div><p className="text-sm font-bold text-raz-teal">{lang === "en" ? intro.en : intro.he}</p><h1 className="mt-4 text-4xl font-bold text-raz-dark md:text-6xl">{lang === "en" ? "My details" : "הפרטים שלי"}</h1></div>
        {showSignOut && <button type="button" onClick={signOut} className="micro-hint flex items-center gap-2 rounded-full bg-raz-dark px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800"><LogOut size={16} />{lang === "en" ? "Sign out" : "התנתקות"}</button>}
      </header>
      <NgoProfileDetails userId={user.id} />
      <ProfileSpecialDays userId={user.id} />
      {role === "donor" && <DonorProfileActivity userId={user.id} />}
      {role === "ngo_owner" && profile?.org_id && <NgoGoalsEditor orgId={profile.org_id} />}
    </main>
  );
}
