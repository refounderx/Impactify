"use client";
import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import EditableText from "@/components/admin/EditableText";

export default function MascotDonationForm() {
  const { t } = useLang();
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="w-24 h-24 rounded-full bg-raz-teal/20 mx-auto mb-6 flex items-center justify-center text-4xl">😊</div>
      <h3 className="text-xl font-bold text-gray-900 mb-1"><EditableText tKey="landing.cta.mascotHeading1" /></h3>
      <p className="text-xl font-bold text-gray-900 mb-8"><EditableText tKey="landing.cta.mascotHeading2" /></p>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="email" placeholder={t("landing.cta.emailPH")} className="interactive-field border border-gray-200 rounded-xl px-4 py-3 text-sm" />
          <input type="tel" placeholder={t("landing.cta.phonePH")} className="interactive-field border border-gray-200 rounded-xl px-4 py-3 text-sm" />
        </div>
        <input type="text" placeholder={t("landing.cta.namePH")} className="interactive-field border border-gray-200 rounded-xl px-4 py-3 text-sm" />
        <textarea placeholder={t("landing.cta.messagePH")} rows={4} className="interactive-field border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none" />
        <button type="submit" className="interactive-control bg-raz-teal text-white font-bold py-3 rounded-xl">
          {submitted ? "✓" : <EditableText tKey="landing.cta.submit" />}
        </button>
      </form>
    </section>
  );
}
