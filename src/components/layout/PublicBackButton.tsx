"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLang } from "@/contexts/LanguageContext";

/** Public resource pages share one reversible, desktop-only back control. */
export default function PublicBackButton() {
  const router = useRouter();
  const { lang } = useLang();
  const isEnglish = lang === "en";

  return <button
    type="button"
    onClick={() => router.back()}
    className="interactive-control group hidden min-h-11 shrink-0 items-center gap-2 rounded-full border border-raz-teal/20 bg-white px-4 text-sm font-bold text-raz-teal shadow-sm transition-all hover:-translate-y-0.5 hover:border-raz-teal hover:bg-raz-teal/5 hover:shadow-md md:inline-flex"
    aria-label={isEnglish ? "Back" : "חזרה"}
  >
    {isEnglish ? <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5" /> : <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />}
    {isEnglish ? "Back" : "חזרה"}
  </button>;
}
