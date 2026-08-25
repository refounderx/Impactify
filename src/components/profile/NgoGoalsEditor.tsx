"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { getOrganizationGoals, updateOrganizationGoals } from "@/lib/supabase/queries-organization-goals";
import type { OrganizationGoal } from "@/lib/supabase/types";

const EMPTY_GOAL: OrganizationGoal = { he: "", en: null };

export default function NgoGoalsEditor({ orgId }: { orgId: string }) {
  const { lang } = useLang();
  const [goals, setGoals] = useState<OrganizationGoal[]>([EMPTY_GOAL]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getOrganizationGoals(orgId).then((stored) => {
      if (active) setGoals(stored.length ? stored : [EMPTY_GOAL]);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Unable to load goals");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orgId]);

  function patchGoal(index: number, patch: Partial<OrganizationGoal>) {
    setGoals((current) => current.map((goal, itemIndex) => itemIndex === index ? { ...goal, ...patch } : goal));
    setMessage("");
  }

  async function save() {
    const normalized = goals.map((goal) => ({ he: goal.he.trim(), en: goal.en?.trim() || null }));
    if (normalized.some((goal) => !goal.he)) {
      setError(lang === "en" ? "Every goal needs Hebrew text." : "לכל מטרה נדרש טקסט בעברית.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateOrganizationGoals(normalized);
      setGoals(normalized);
      setMessage(lang === "en" ? "Goals saved." : "המטרות נשמרו.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save goals");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="rounded-2xl bg-white p-5 text-sm text-gray-500">{lang === "en" ? "Loading goals…" : "טוען מטרות…"}</div>;

  return (
    <section className="rounded-2xl bg-white p-5">
      <h2 className="text-lg font-bold text-gray-800">{lang === "en" ? "Organization goals" : "מטרות העמותה"}</h2>
      <p className="mt-1 text-sm text-gray-500">{lang === "en" ? "Shown on your public organization profile." : "המטרות יוצגו בפרופיל הציבורי של העמותה."}</p>
      <div className="mt-4 space-y-4">
        {goals.map((goal, index) => (
          <div key={index} className="rounded-xl border border-gray-100 p-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-gray-500">מטרה בעברית
                <input value={goal.he} onChange={(event) => patchGoal(index, { he: event.target.value })} maxLength={200} dir="rtl"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-800 outline-none focus:border-raz-teal" />
              </label>
              <label className="text-sm text-gray-500">Goal in English
                <input value={goal.en ?? ""} onChange={(event) => patchGoal(index, { en: event.target.value || null })} maxLength={200} dir="ltr"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-800 outline-none focus:border-raz-teal" />
              </label>
            </div>
            {goals.length > 1 && <button type="button" onClick={() => setGoals((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              className="mt-2 text-xs font-medium text-red-600">{lang === "en" ? "Remove goal" : "הסר מטרה"}</button>}
          </div>
        ))}
      </div>
      {goals.length < 10 && <button type="button" onClick={() => setGoals((current) => [...current, { ...EMPTY_GOAL }])}
        className="mt-4 text-sm font-bold text-raz-teal">+ {lang === "en" ? "Add goal" : "הוסף מטרה"}</button>}
      {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
      {message && <p className="mt-3 text-sm text-green-700" role="status">{message}</p>}
      <button type="button" onClick={save} disabled={saving}
        className="mt-4 rounded-xl bg-raz-teal px-5 py-3 font-bold text-white disabled:opacity-50">
        {saving ? (lang === "en" ? "Saving…" : "שומר…") : (lang === "en" ? "Save goals" : "שמירת מטרות")}
      </button>
    </section>
  );
}
