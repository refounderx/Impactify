"use client";
import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import type { AudienceKind } from "@/lib/landing-data";
import AudienceIconRow from "./AudienceIconRow";
import AudienceFilterOverlay from "./AudienceFilterOverlay";

function Badge({ text }: { text: string }) {
  return (
    <span className="absolute bg-white rounded-full shadow-md px-3 py-1.5 text-xs font-medium text-gray-700 whitespace-nowrap">
      {text}
    </span>
  );
}

export default function Hero() {
  const { t } = useLang();
  const badge = t("landing.hero.badge");
  const [selectedKind, setSelectedKind] = useState<AudienceKind | null>(null);

  return (
    <section className="max-w-6xl mx-auto px-6 py-14">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        {/* Placeholder image blocks */}
        <div className="relative grid grid-cols-2 gap-4">
          <div className="bg-gray-200 rounded-2xl h-72 col-span-1" />
          <div className="flex flex-col gap-4">
            <div className="bg-gray-500 rounded-2xl h-32" />
            <div className="bg-gray-100 rounded-2xl h-32" />
          </div>
          <div className="absolute -top-4 start-16"><Badge text={badge} /></div>
          <div className="absolute top-1/2 end-0"><Badge text={badge} /></div>
          <div className="absolute bottom-4 start-0"><Badge text={badge} /></div>
        </div>

        <div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">{t("landing.hero.title")}</h1>
          <p className="text-gray-500 leading-relaxed mb-6">{t("landing.hero.body")}</p>
          <button className="border-2 border-raz-teal text-raz-teal font-bold px-8 py-3 rounded-full">
            {t("landing.hero.cta")}
          </button>
        </div>
      </div>

      <div className="mt-14">
        <AudienceIconRow selected={selectedKind} onSelect={setSelectedKind} />
      </div>

      {selectedKind && (
        <AudienceFilterOverlay kind={selectedKind} onSelect={setSelectedKind} onClose={() => setSelectedKind(null)} />
      )}
    </section>
  );
}
