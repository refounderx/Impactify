"use client";

import NgoGoalsEditor from "@/components/profile/NgoGoalsEditor";
import NgoProfileDetails from "@/components/profile/NgoProfileDetails";
import ProfileSpecialDays from "@/components/profile/ProfileSpecialDays";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";

export default function NonprofitProfilePage() {
  const { user, profile } = useAuth();
  const { lang } = useLang();

  if (!user) return null;

  return (
    <main className="mx-auto max-w-6xl space-y-12 pb-10" dir={lang === "en" ? "ltr" : "rtl"}>
      <header className="pt-2">
        <p className="text-sm font-bold text-raz-teal">{lang === "en" ? "Manage your personal and organization information" : "ניהול הפרטים האישיים ופרטי העמותה"}</p>
        <h1 className="mt-4 text-4xl font-bold text-raz-dark md:text-6xl">{lang === "en" ? "My details" : "הפרטים שלי"}</h1>
      </header>
      <NgoProfileDetails userId={user.id} />
      <ProfileSpecialDays userId={user.id} />
      {profile?.org_id && <NgoGoalsEditor orgId={profile.org_id} />}
    </main>
  );
}
