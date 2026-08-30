"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { useCookieConsent } from "@/contexts/CookieConsentContext";

export default function CookieConsentBanner() {
  const { lang } = useLang();
  const { ready, consented, acceptAll, rejectOptional, preferencesOpen, openPreferences } = useCookieConsent();
  const isHebrew = lang === "he";

  if (!ready) return null;
  const showBanner = !consented && !preferencesOpen;
  const heading = isHebrew ? "הפרטיות שלך חשובה לנו" : "Your privacy matters";
  const body = isHebrew
    ? "אנו משתמשים בעוגיות חיוניות להפעלת האתר. עוגיות אנליטיקה ושיווק יופעלו רק באישורך."
    : "We use essential cookies to operate the site. Analytics and marketing cookies are enabled only with your approval.";

  return <>
    {showBanner && (
      <section className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:bottom-6 sm:p-6" role="dialog" aria-live="polite" aria-label={heading} dir={isHebrew ? "rtl" : "ltr"}>
        <h2 className="text-lg font-extrabold text-raz-dark">{heading}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{body} <Link href="/privacy" className="font-bold text-raz-teal underline">{isHebrew ? "מדיניות הפרטיות" : "Privacy policy"}</Link></p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button type="button" onClick={acceptAll} className="interactive-control min-h-11 rounded-xl bg-raz-teal px-4 font-bold text-white">{isHebrew ? "אישור הכל" : "Accept all"}</button>
          <button type="button" onClick={rejectOptional} className="interactive-control min-h-11 rounded-xl border border-raz-teal px-4 font-bold text-raz-teal">{isHebrew ? "דחיית לא־חיוניים" : "Reject optional"}</button>
          <button type="button" onClick={openPreferences} className="interactive-control min-h-11 px-3 text-sm font-bold text-gray-600 underline">{isHebrew ? "ניהול העדפות" : "Manage preferences"}</button>
        </div>
      </section>
    )}

    {preferencesOpen && <CookiePreferencesDialog isHebrew={isHebrew} />}
  </>;
}

function CookiePreferencesDialog({ isHebrew }: { isHebrew: boolean }) {
  const { preferences, rejectOptional, savePreferences, closePreferences } = useCookieConsent();
  const [draft, setDraft] = useState(preferences);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir={isHebrew ? "rtl" : "ltr"}>
        <button type="button" className="absolute inset-0 bg-raz-dark/50" onClick={closePreferences} aria-label={isHebrew ? "סגירה" : "Close"} />
        <section className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title">
          <h2 id="cookie-preferences-title" className="text-xl font-extrabold text-raz-dark">{isHebrew ? "העדפות עוגיות" : "Cookie preferences"}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">{isHebrew ? "ניתן לשנות את הבחירה בכל עת דרך הקישור בתחתית הדף." : "You can change this choice at any time from the footer link."}</p>
          <div className="mt-5 space-y-3">
            <Category title={isHebrew ? "חיוניות" : "Essential"} description={isHebrew ? "נדרשות להתחברות, אבטחה, שפה והפעלת האתר." : "Required for sign-in, security, language, and site operation."} checked disabled onChange={() => {}} />
            <Category title={isHebrew ? "אנליטיקה" : "Analytics"} description={isHebrew ? "מסייעות להבין שימוש באתר ולשפר אותו. כרגע אינן מופעלות ללא אישור." : "Help us understand and improve site usage. Disabled unless approved."} checked={draft.analytics} onChange={(checked) => setDraft((current) => ({ ...current, analytics: checked }))} />
            <Category title={isHebrew ? "שיווק" : "Marketing"} description={isHebrew ? "מאפשרות מדידה ופרסום מותאם של צדדים שלישיים. כרגע אינן מופעלות ללא אישור." : "Allow third-party measurement and tailored advertising. Disabled unless approved."} checked={draft.marketing} onChange={(checked) => setDraft((current) => ({ ...current, marketing: checked }))} />
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => savePreferences(draft)} className="interactive-control min-h-11 rounded-xl bg-raz-teal px-5 font-bold text-white">{isHebrew ? "שמירת בחירה" : "Save choices"}</button>
            <button type="button" onClick={rejectOptional} className="interactive-control min-h-11 rounded-xl border border-gray-300 px-5 font-bold text-gray-700">{isHebrew ? "דחיית לא־חיוניים" : "Reject optional"}</button>
          </div>
        </section>
    </div>
  );
}

function Category({ title, description, checked, disabled = false, onChange }: { title: string; description: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-200 p-4 has-[:disabled]:cursor-default">
    <span><span className="block font-bold text-raz-dark">{title}</span><span className="mt-1 block text-sm leading-5 text-gray-600">{description}</span></span>
    <input type="checkbox" className="mt-1 h-5 w-5 accent-[#00B5AD]" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
  </label>;
}
