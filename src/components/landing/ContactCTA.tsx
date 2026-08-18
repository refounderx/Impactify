"use client";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";

export default function ContactCTA() {
  const { t } = useLang();

  return (
    <section id="contact" className="max-w-6xl mx-auto px-6 py-10">
      <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <p className="text-sm text-gray-600">{t("landing.cta.bar")}</p>
        <div className="flex gap-2 flex-shrink-0">
          <button className="bg-raz-teal text-white text-sm font-bold px-4 py-2 rounded-full">{t("landing.cta.donateBtn")}</button>
          <Link href="/profile" className="bg-raz-dark text-white text-sm font-bold px-4 py-2 rounded-full">{t("landing.cta.personalArea")}</Link>
        </div>
      </div>

      <div className="bg-raz-teal rounded-2xl px-6 py-8 text-center">
        <h3 className="text-white text-xl font-bold mb-4">{t("landing.cta.bannerHeading")}</h3>
        <p className="text-white/90 mb-6">{t("landing.cta.bannerSub")}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button className="bg-white text-raz-teal font-bold px-5 py-2.5 rounded-full text-sm">{t("landing.cta.noOrg")}</button>
          <button className="bg-raz-dark text-white font-bold px-5 py-2.5 rounded-full text-sm">{t("landing.cta.hasOrg")}</button>
        </div>
      </div>
    </section>
  );
}
