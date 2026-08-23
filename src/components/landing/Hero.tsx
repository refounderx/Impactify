"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/contexts/LanguageContext";
import type { AudienceKind } from "@/lib/landing-data";
import { getHeroCards } from "@/lib/supabase/queries-landing";
import { heroCards as mockHeroCards } from "@/lib/mock-data";
import AudienceIconRow from "./AudienceIconRow";
import AudienceFilterOverlay from "./AudienceFilterOverlay";
import EditableText from "@/components/admin/EditableText";

function Badge({ text }: { text: string }) {
  return (
    <span className="absolute bg-white rounded-full shadow-md px-3 py-1.5 text-xs font-medium text-gray-700 whitespace-nowrap">
      {text}
    </span>
  );
}

function HeroImageCard({ card, lang, className }: { card: typeof mockHeroCards[0]; lang: string; className: string }) {
  const text = lang === "en" ? card.bubbleTextEn : card.bubbleText;
  return card.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={card.imageUrl} alt={text} className={`${className} object-cover`} />
  ) : (
    <div className={`${className} ${card.placeholderClass}`} />
  );
}

export default function Hero() {
  const { lang } = useLang();
  const [selectedKind, setSelectedKind] = useState<AudienceKind | null>(null);
  const [cards, setCards] = useState(mockHeroCards);

  useEffect(() => {
    getHeroCards().then((data) => {
      if (data && data.length > 0) setCards(data);
    });
  }, []);

  const [soldierCard, elderlyCard, childCard] = cards;

  return (
    <section className="max-w-6xl mx-auto px-6 py-14">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        {/* Image+bubble cards — each pair is one unit, see heroCards in mock-data.ts */}
        <div className="relative grid grid-cols-2 gap-4">
          {soldierCard && <HeroImageCard card={soldierCard} lang={lang} className="rounded-2xl h-72 col-span-1" />}
          <div className="flex flex-col gap-4">
            {elderlyCard && <HeroImageCard card={elderlyCard} lang={lang} className="rounded-2xl h-32" />}
            {childCard && <HeroImageCard card={childCard} lang={lang} className="rounded-2xl h-32" />}
          </div>
          {soldierCard && <div className="absolute -top-4 start-16"><Badge text={lang === "en" ? soldierCard.bubbleTextEn : soldierCard.bubbleText} /></div>}
          {elderlyCard && <div className="absolute top-1/2 end-0"><Badge text={lang === "en" ? elderlyCard.bubbleTextEn : elderlyCard.bubbleText} /></div>}
          {childCard && <div className="absolute bottom-4 start-0"><Badge text={lang === "en" ? childCard.bubbleTextEn : childCard.bubbleText} /></div>}
        </div>

        <div>
          <EditableText tKey="landing.hero.title" as="h1" className="text-5xl font-bold text-gray-900 leading-tight mb-6 block" />
          <EditableText tKey="landing.hero.body" as="p" className="text-gray-500 leading-relaxed mb-6 block" />
          <button className="border-2 border-raz-teal text-raz-teal font-bold px-8 py-3 rounded-full">
            <EditableText tKey="landing.hero.cta" />
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
