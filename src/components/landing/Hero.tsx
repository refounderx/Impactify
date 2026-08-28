"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import type { AudienceKind } from "@/lib/landing-data";
import { getHeroCards } from "@/lib/supabase/queries-landing";
import AudienceIconRow from "./AudienceIconRow";
import AudienceFilterOverlay from "./AudienceFilterOverlay";
import EditableText from "@/components/admin/EditableText";

function Badge({ text }: { text: string }) {
  return (
    <span className="absolute bottom-2 start-2 end-2 z-10 bg-white rounded-xl shadow-md px-3 py-1.5 text-xs font-medium text-gray-700 text-center leading-snug">
      {text}
    </span>
  );
}

type HeroCard = Awaited<ReturnType<typeof getHeroCards>>[number];

function HeroImageCard({ card, lang, className }: { card: HeroCard; lang: string; className: string }) {
  const text = lang === "en" ? card.bubbleTextEn : card.bubbleText;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {card.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.imageUrl} alt={text} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className={`absolute inset-0 ${card.placeholderClass}`} />
      )}
      <Badge text={text} />
    </div>
  );
}

export default function Hero() {
  const { lang } = useLang();
  const [selectedKind, setSelectedKind] = useState<AudienceKind | null>(null);
  const [cards, setCards] = useState<HeroCard[]>([]);

  useEffect(() => {
    getHeroCards().then((data) => {
      setCards(data);
    });
  }, []);

  const [soldierCard, elderlyCard, childCard] = cards;

  return (
    <section className="max-w-6xl mx-auto px-6 py-14">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        {/* Image+bubble cards — each pair is one unit, see heroCards in mock-data.ts */}
        <div className="grid grid-cols-2 gap-4">
          {soldierCard && <HeroImageCard card={soldierCard} lang={lang} className="rounded-2xl h-72 col-span-1" />}
          <div className="flex flex-col gap-4">
            {elderlyCard && <HeroImageCard card={elderlyCard} lang={lang} className="rounded-2xl h-32" />}
            {childCard && <HeroImageCard card={childCard} lang={lang} className="rounded-2xl h-32" />}
          </div>
        </div>

        <div>
          <EditableText tKey="landing.hero.title" as="h1" className="text-5xl font-bold text-gray-900 leading-tight mb-6 block" />
          <EditableText tKey="landing.hero.body" as="p" className="text-gray-500 leading-relaxed mb-6 block" />
          <Link href="/auth" className="interactive-control inline-block border-2 border-raz-teal text-raz-teal font-bold px-8 py-3 rounded-full">
            <EditableText tKey="landing.hero.cta" />
          </Link>
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
