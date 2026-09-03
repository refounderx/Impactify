"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import type { AudienceKind } from "@/lib/landing-data";
import { getHeroCards } from "@/lib/supabase/queries-landing";
import AudienceIconRow from "./AudienceIconRow";
import AudienceFilterOverlay from "./AudienceFilterOverlay";
import EditableText from "@/components/admin/EditableText";

function Badge({ text }: { text: string }) {
  return (
    <span className="absolute bottom-0 left-1/2 z-10 flex min-h-8 w-[86%] -translate-x-1/2 items-center justify-center rounded-lg border border-gray-100 bg-white px-2.5 py-1 text-[11px] font-medium leading-tight text-gray-700 shadow-sm text-center">
      {text}
    </span>
  );
}

type HeroCard = Awaited<ReturnType<typeof getHeroCards>>[number];

function HeroImageCard({ card, lang, className }: { card: HeroCard; lang: string; className: string }) {
  const text = lang === "en" ? card.bubbleTextEn : card.bubbleText;
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-x-0 top-0 bottom-10 overflow-hidden rounded-2xl">
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt={text} className="h-full w-full object-cover" />
        ) : (
          <div className={`h-full w-full ${card.placeholderClass}`} />
        )}
      </div>
      <Badge text={text} />
    </div>
  );
}

export default function Hero() {
  const { lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const [selectedKind, setSelectedKind] = useState<AudienceKind | null>(null);
  const [cards, setCards] = useState<HeroCard[]>([]);

  useEffect(() => {
    getHeroCards().then((data) => {
      setCards(data);
    });
  }, []);

  const [soldierCard, elderlyCard, childCard] = cards;

  return (
    <section className="mx-auto max-w-7xl px-6 py-14">
      <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] md:gap-16" dir="ltr">
        <div className="order-1 text-right md:order-2" dir={lang === "he" ? "rtl" : "ltr"}>
          <EditableText tKey="landing.hero.title" as="h1" className="mb-6 block text-4xl font-bold leading-tight text-gray-900 sm:text-5xl xl:text-6xl" />
          <EditableText tKey="landing.hero.body" as="p" className="mb-7 block text-lg leading-relaxed text-gray-500 xl:text-xl" />
          {!authLoading && !user && (
            <Link href="/auth" className="interactive-control inline-block rounded-full border-2 border-raz-teal px-8 py-3 text-lg font-bold text-raz-teal">
              <EditableText tKey="landing.hero.cta" />
            </Link>
          )}
        </div>

        <div className={`order-2 mt-2 md:order-3 md:col-span-2 md:mt-14 ${selectedKind ? "z-50" : ""}`}>
          <AudienceIconRow selected={selectedKind} onSelect={setSelectedKind} />
        </div>

        {/* Image+bubble cards — captions use their own reserved space below each image. */}
        <div className="order-3 grid grid-cols-[0.95fr_1.05fr] gap-5 md:order-1" dir="ltr">
          <div className="flex flex-col gap-5">
            {elderlyCard && <HeroImageCard card={elderlyCard} lang={lang} className="h-[9.5rem]" />}
            {childCard && <HeroImageCard card={childCard} lang={lang} className="h-[9.5rem]" />}
          </div>
          {soldierCard && <HeroImageCard card={soldierCard} lang={lang} className="h-80" />}
        </div>
      </div>

      {selectedKind && (
        <AudienceFilterOverlay kind={selectedKind} onClose={() => setSelectedKind(null)} />
      )}
    </section>
  );
}
