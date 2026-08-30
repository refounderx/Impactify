"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import type { AppRole } from "@/lib/supabase/types";
import type { OrganizationGoal } from "@/lib/supabase/types";

type SignupRole = Exclude<AppRole, "admin">;
const roles: { key: SignupRole; he: string; en: string; descriptionHe: string; descriptionEn: string; emoji: string }[] = [
  { key: "donor", he: "תורם", en: "Donor", descriptionHe: "אני רוצה לתרום לקמפיינים", descriptionEn: "I want to support campaigns", emoji: "💙" },
  { key: "ngo_owner", he: "בעל עמותה", en: "NGO owner", descriptionHe: "אני מקים או מנהל עמותה", descriptionEn: "I own or manage an NGO", emoji: "🏛️" },
  { key: "community_owner", he: "בעל קהילה", en: "Community owner", descriptionHe: "אני מנהל קהילת גיוס", descriptionEn: "I manage a fundraising community", emoji: "👥" },
];

function homeForRole(role: AppRole) {
  if (role === "ngo_owner") return "/nonprofit";
  if (role === "community_owner") return "/community";
  if (role === "admin") return "/admin/users";
  return "/";
}

export default function SetupPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const { lang } = useLang();
  const [name, setName] = useState("");
  const [role, setRole] = useState<SignupRole>("donor");
  const [tenantName, setTenantName] = useState("");
  const [tenantNameEn, setTenantNameEn] = useState("");
  const [goals, setGoals] = useState<OrganizationGoal[]>([{ he: "", en: null }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
    if (profile?.onboarding_completed_at) router.replace(homeForRole(profile.app_role));
  }, [loading, profile, router, user]);

  async function completeSignup() {
    if (!user || !name.trim() || (role !== "donor" && !tenantName.trim())) return;
    setSaving(true);
    setError("");
    const sb = createClient();
    const result = role === "donor"
      ? await sb.rpc("complete_donor_signup", { p_full_name: name.trim() })
      : role === "ngo_owner"
        ? await sb.rpc("complete_ngo_signup", {
            p_full_name: name.trim(), p_org_name: tenantName.trim(), p_org_name_en: tenantNameEn.trim() || null,
            p_goals: goals.map((goal) => ({ he: goal.he.trim(), en: goal.en?.trim() || null })),
          })
        : await sb.rpc("complete_community_signup", {
            p_full_name: name.trim(), p_community_name: tenantName.trim(),
            p_community_name_en: tenantNameEn.trim() || null,
          });
    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }
    await refreshProfile();
    router.replace(homeForRole(role));
    router.refresh();
  }

  const tenantLabel = role === "ngo_owner"
    ? (lang === "en" ? "NGO name" : "שם העמותה")
    : (lang === "en" ? "Community name" : "שם הקהילה");

  return (
    <div className="min-h-screen bg-raz-dark flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-3xl font-bold text-raz-teal mb-1">Impactify</p>
          <p className="text-gray-400 text-sm">{lang === "en" ? "Create your profile" : "יצירת הפרופיל שלך"}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 space-y-5">
          <h1 className="font-bold text-gray-800 text-lg">{lang === "en" ? "Account setup" : "הגדרת חשבון"}</h1>
          <label className="block text-sm text-gray-500">
            {lang === "en" ? "Full name" : "שם מלא"}
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120}
              className="mt-1.5 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-raz-teal text-gray-800" />
          </label>
          <div className="space-y-2">
            {roles.map((option) => (
              <button key={option.key} type="button" onClick={() => { setRole(option.key); setTenantName(""); setTenantNameEn(""); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-start ${role === option.key ? "border-raz-teal bg-raz-teal/5" : "border-gray-100"}`}>
                <span className="text-2xl">{option.emoji}</span>
                <span><strong className="block text-sm text-gray-800">{lang === "en" ? option.en : option.he}</strong>
                  <span className="text-xs text-gray-400">{lang === "en" ? option.descriptionEn : option.descriptionHe}</span></span>
              </button>
            ))}
          </div>
          {role !== "donor" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-gray-500">{tenantLabel}
                <input value={tenantName} onChange={(event) => setTenantName(event.target.value)} maxLength={160}
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-raz-teal text-gray-800" />
              </label>
              <label className="text-sm text-gray-500">{tenantLabel} (English)
                <input value={tenantNameEn} onChange={(event) => setTenantNameEn(event.target.value)} maxLength={160} dir="ltr"
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-raz-teal text-gray-800" />
              </label>
            </div>
          )}
          {role === "ngo_owner" && (
            <div className="space-y-3">
              <div><p className="text-sm font-bold text-gray-700">{lang === "en" ? "Organization goals" : "מטרות העמותה"}</p>
                <p className="text-xs text-gray-400">{lang === "en" ? "Add 1–10 goals. Hebrew is required; English is optional." : "הוסיפו 1–10 מטרות. עברית חובה ואנגלית אופציונלית."}</p></div>
              {goals.map((goal, index) => <div key={index} className="rounded-xl border border-gray-100 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-gray-500">מטרה בעברית
                    <input value={goal.he} onChange={(event) => setGoals((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, he: event.target.value } : item))} maxLength={200} dir="rtl"
                      className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-800 outline-none focus:border-raz-teal" /></label>
                  <label className="text-sm text-gray-500">Goal in English
                    <input value={goal.en ?? ""} onChange={(event) => setGoals((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, en: event.target.value || null } : item))} maxLength={200} dir="ltr"
                      className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-800 outline-none focus:border-raz-teal" /></label>
                </div>
                {goals.length > 1 && <button type="button" onClick={() => setGoals((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="mt-2 text-xs text-red-600">{lang === "en" ? "Remove" : "הסר"}</button>}
              </div>)}
              {goals.length < 10 && <button type="button" onClick={() => setGoals((current) => [...current, { he: "", en: null }])} className="interactive-control inline-flex min-h-11 items-center rounded-xl border border-raz-teal/30 bg-raz-teal/5 px-4 py-2 text-sm font-bold text-raz-teal hover:!scale-[1.03]">+ {lang === "en" ? "Add goal" : "הוסף מטרה"}</button>}
            </div>
          )}
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button onClick={completeSignup} disabled={saving || !name.trim() || (role !== "donor" && !tenantName.trim()) || (role === "ngo_owner" && goals.some((goal) => !goal.he.trim()))}
            className="w-full bg-raz-teal text-white py-3.5 rounded-xl font-bold disabled:opacity-50">
            {saving ? (lang === "en" ? "Creating account…" : "יוצר חשבון…") : (lang === "en" ? "Continue" : "המשך")}
          </button>
        </div>
      </div>
    </div>
  );
}
