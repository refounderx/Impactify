"use client";
import { useLang } from "@/contexts/LanguageContext";

export default function WhyJoinSection() {
  const { t } = useLang();

  return (
    <section id="why" className="max-w-4xl mx-auto px-6 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">{t("landing.why.heading1")}</h2>
      <p className="text-2xl font-bold text-gray-900 mb-4">{t("landing.why.heading2")}</p>
      <p className="text-gray-500 mb-10">{t("landing.why.sub")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200" />
            <p className="text-sm text-gray-500 leading-relaxed">{t("landing.why.sub")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
