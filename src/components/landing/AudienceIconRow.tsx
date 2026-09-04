"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AudienceKind } from "@/lib/landing-data";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import EditableText from "@/components/admin/EditableText";

export default function AudienceIconRow({
  selected,
  onSelect,
}: {
  selected: AudienceKind | null;
  onSelect: (kind: AudienceKind) => void;
}) {
  const { data } = useSiteDataset("landing");
  const carouselRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);
  const audienceIcons = (data?.audienceIcons ?? []).filter(
    (icon, index, icons) => icons.findIndex((candidate) => candidate.kind === icon.kind) === index
  );
  function scrollToCard(direction: -1 | 1) {
    const cards = Array.from(carouselRef.current?.querySelectorAll<HTMLButtonElement>("[data-audience-card]") ?? []);
    if (!cards.length) return;
    const container = carouselRef.current;
    const center = container ? container.getBoundingClientRect().left + container.clientWidth / 2 : 0;
    const current = cards.reduce((best, card, index) => Math.abs(card.getBoundingClientRect().left + card.clientWidth / 2 - center) < Math.abs(cards[best].getBoundingClientRect().left + cards[best].clientWidth / 2 - center) ? index : best, 0);
    cards[Math.max(0, Math.min(cards.length - 1, current + direction))]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  return (
    <div className="relative md:mx-0">
      <button type="button" onClick={() => scrollToCard(-1)} className="interactive-control absolute start-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2 text-raz-dark shadow-lg md:hidden" aria-label="הקטגוריה הקודמת"><ChevronRight size={20} /></button>
      <div ref={carouselRef} onPointerDown={(event) => { dragStart.current = event.clientX; }} onPointerUp={(event) => { if (dragStart.current === null) return; const delta = event.clientX - dragStart.current; dragStart.current = null; if (Math.abs(delta) > 36) scrollToCard(delta < 0 ? 1 : -1); }} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-8 pb-2 touch-pan-x md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-5 lg:gap-5 2xl:gap-7">
      {audienceIcons.map((a, i) => {
        const isSelected = a.kind === selected;
        return (
          <button data-audience-card
            key={`${a.id}-${i}`}
            onClick={(event) => { event.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }); window.setTimeout(() => onSelect(a.kind), 220); }}
            className={`flex h-40 w-28 shrink-0 snap-center cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border py-5 transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal motion-reduce:transition-none md:h-auto md:w-auto md:min-h-36 md:py-6 lg:min-h-44 lg:gap-3 lg:py-8 xl:min-h-48 xl:py-10 2xl:min-h-56 2xl:gap-4 2xl:py-12 ${
              isSelected ? "bg-raz-teal border-raz-teal text-white" : "bg-white border-gray-100 text-gray-800"
            }`}
          >
            <span className="text-4xl lg:text-5xl 2xl:text-6xl">{a.emoji}</span>
            <span className="text-lg font-bold lg:text-xl 2xl:text-2xl"><EditableText tKey={a.labelKey} /></span>
          </button>
        );
      })}</div>
      <button type="button" onClick={() => scrollToCard(1)} className="interactive-control absolute end-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2 text-raz-dark shadow-lg md:hidden" aria-label="הקטגוריה הבאה"><ChevronLeft size={20} /></button>
    </div>
  );
}
