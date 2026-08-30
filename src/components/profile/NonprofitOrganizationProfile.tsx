"use client";

import { useEffect, useState } from "react";
import { Bird, CirclePlay, Plus } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { getNgoProfile, updateNgoProfile, type NgoProfileDraft } from "@/lib/supabase/queries-ngo-admin";

const EMPTY: NgoProfileDraft = { name: "", description: "", activityArea: "", address: "", phone: "", contact: "", founded: "", logoUrl: "" };
const AREAS = ["ארצי", "צפון", "מרכז", "ירושלים", "דרום"];
const YEARS = Array.from({ length: new Date().getFullYear() - 1899 }, (_, index) => String(new Date().getFullYear() - index));

export default function NonprofitOrganizationProfile() {
  const { lang } = useLang();
  const [draft, setDraft] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoEditorOpen, setLogoEditorOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getNgoProfile().then((organization) => {
      if (!active) return;
      const next = {
        name: organization.name,
        description: organization.description ?? "",
        activityArea: organization.activity_area ?? "",
        address: organization.address ?? "",
        phone: organization.phone ?? "",
        contact: organization.ceo ?? "",
        founded: organization.founded ?? "",
        logoUrl: organization.logo_url ?? "",
      };
      setDraft(next);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Unable to load organization profile");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function patch(key: keyof NgoProfileDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage(""); setError("");
  }

  async function save() {
    if (!draft.name.trim()) {
      setError(lang === "en" ? "Organization name is required." : "יש להזין את שם העמותה.");
      return;
    }
    setSaving(true); setError("");
    try {
      await updateNgoProfile(draft);
      setMessage(lang === "en" ? "Organization details saved." : "פרטי העמותה נשמרו.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save organization profile");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-[34rem] animate-pulse rounded-3xl bg-white/60" aria-label={lang === "en" ? "Loading organization profile" : "טוען פרופיל עמותה"} />;

  const fieldClass = "mt-2 min-h-14 w-full rounded-2xl border border-transparent bg-white px-5 text-raz-dark outline-none transition-colors focus:border-raz-teal";
  return (
    <section dir={lang === "en" ? "ltr" : "rtl"}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
          <Field label={lang === "en" ? "Organization name" : "שם העמותה"}><input value={draft.name} onChange={(event) => patch("name", event.target.value)} maxLength={120} className={fieldClass} /></Field>
          <Field label={lang === "en" ? "Activity area" : "אזור פעילות"}><select value={draft.activityArea} onChange={(event) => patch("activityArea", event.target.value)} className={fieldClass}><option value="">{lang === "en" ? "Choose an area" : "בחירת אזור"}</option>{draft.activityArea && !AREAS.includes(draft.activityArea) && <option value={draft.activityArea}>{draft.activityArea}</option>}{AREAS.map((area) => <option key={area} value={area}>{area}</option>)}</select></Field>
          <Field label={lang === "en" ? "A few words about the organization" : "כמה מילים על העמותה"} wide>
            <textarea value={draft.description} onChange={(event) => patch("description", event.target.value)} maxLength={250} rows={6} className={`${fieldClass} resize-none py-4 leading-7`} />
            <span className="mt-2 block text-xs text-gray-400">{draft.description.length}/250</span>
          </Field>
          <Field label={lang === "en" ? "Address" : "כתובת"}><input value={draft.address} onChange={(event) => patch("address", event.target.value)} maxLength={240} className={fieldClass} /></Field>
          <Field label={lang === "en" ? "Phone number" : "מספר טלפון"}><input value={draft.phone} onChange={(event) => patch("phone", event.target.value)} inputMode="tel" dir="ltr" maxLength={30} className={fieldClass} /></Field>
          <Field label={lang === "en" ? "Manager / contact person" : "מנהל/ת או איש/ת קשר"}><input value={draft.contact} onChange={(event) => patch("contact", event.target.value)} maxLength={120} className={fieldClass} /></Field>
          <Field label={lang === "en" ? "Year founded" : "שנת יסוד"}><select value={draft.founded} onChange={(event) => patch("founded", event.target.value)} className={fieldClass}><option value="">—</option>{draft.founded && !YEARS.includes(draft.founded) && <option value={draft.founded}>{draft.founded}</option>}{YEARS.map((year) => <option key={year} value={year}>{year}</option>)}</select></Field>
        </div>

        <aside className="flex flex-col items-center pt-2">
          <div className="flex h-60 w-60 items-center justify-center overflow-hidden rounded-full bg-gray-300 text-5xl font-bold text-white">
            {draft.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.logoUrl} alt={draft.name} className="h-full w-full object-cover" />
            ) : <span aria-hidden="true">{draft.name.trim().slice(0, 2) || "ע"}</span>}
          </div>
          <div className="mt-8 flex items-center gap-4 text-white" aria-label={lang === "en" ? "Organization media" : "מדיה של העמותה"}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300" aria-hidden="true"><CirclePlay size={21} fill="currentColor" /></span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 text-lg font-black" aria-hidden="true">f</span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300" aria-hidden="true"><Bird size={20} fill="currentColor" /></span>
            <button type="button" onClick={() => setLogoEditorOpen((value) => !value)} className="micro-hint flex h-12 w-12 items-center justify-center rounded-full bg-raz-teal transition-transform hover:scale-110" aria-label={lang === "en" ? "Change organization logo" : "שינוי לוגו העמותה"}><Plus size={26} /></button>
          </div>
          {logoEditorOpen && <label className="mt-5 w-full text-sm font-bold text-raz-dark">{lang === "en" ? "Logo image URL" : "כתובת תמונת הלוגו"}<input value={draft.logoUrl} onChange={(event) => patch("logoUrl", event.target.value)} dir="ltr" placeholder="https://" className={`${fieldClass} text-sm font-normal`} /></label>}
        </aside>
      </div>

      {error && <p className="mt-7 text-sm font-medium text-red-600" role="alert">{error}</p>}
      {message && <p className="mt-7 text-sm font-medium text-green-700" role="status">{message}</p>}
      <div className="mt-12 flex w-full max-w-64 flex-col gap-3 ltr:ms-0 rtl:me-auto">
        <button type="button" onClick={save} disabled={saving} className="min-h-12 rounded-2xl bg-raz-teal px-7 font-bold text-white transition-transform hover:scale-[1.03] disabled:opacity-50">{saving ? (lang === "en" ? "Saving…" : "שומר…") : (lang === "en" ? "Save changes" : "שמירת שינויים")}</button>
      </div>
    </section>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`block text-sm font-bold text-raz-dark ${wide ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
}
