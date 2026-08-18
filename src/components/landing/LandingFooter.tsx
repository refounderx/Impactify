"use client";
import { useLang } from "@/contexts/LanguageContext";
import { socialLinks } from "@/lib/landing-data";

export default function LandingFooter() {
  const { t } = useLang();

  return (
    <footer className="bg-raz-dark text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
        <div className="flex flex-col gap-2 text-gray-300">
          <span>{t("landing.footer.lorem")}</span>
          <div className="flex gap-3 mt-2">
            {socialLinks.map((s) => (
              <a key={s.id} href={s.href} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 text-gray-300">
          <a href="#contact">{t("landing.footer.contact")}</a>
          <a href="#why">{t("landing.footer.aboutIsrael")}</a>
          <a href="#">{t("landing.footer.terms")}</a>
          <a href="#">{t("landing.footer.app")}</a>
        </div>

        <div className="flex flex-col gap-2 text-gray-300">
          <a href="#why">{t("landing.footer.about")}</a>
          <a href="/nonprofit">{t("landing.footer.haveOrg")}</a>
          <a href="/recurring">{t("landing.footer.recurring")}</a>
          <a href="#">{t("landing.footer.doGood")}</a>
        </div>
      </div>
    </footer>
  );
}
