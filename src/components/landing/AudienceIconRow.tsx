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
  const drag = useRef<{ pointerId: number; startX: number; scrollLeft: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const audienceIcons = (data?.audienceIcons ?? []).filter(
    (icon, index, icons) => icons.findIndex((candidate) => candidate.kind === icon.kind) === index
  );
  function centerCard(card: HTMLButtonElement, behavior: ScrollBehavior = "smooth") {
    const container = carouselRef.current;
    if (!container) return;
    const containerBounds = container.getBoundingClientRect();
    const cardBounds = card.getBoundingClientRect();
    const distanceFromCenter = cardBounds.left + cardBounds.width / 2 - (containerBounds.left + containerBounds.width / 2);
    container.scrollBy({ left: distanceFromCenter, behavior });
  }

  function scrollToCard(direction: -1 | 1) {
    const cards = Array.from(carouselRef.current?.querySelectorAll<HTMLButtonElement>("[data-audience-card]") ?? []);
    if (!cards.length) return;
    const container = carouselRef.current;
    if (!container) return;
    const containerBounds = container.getBoundingClientRect();
    const center = containerBounds.left + containerBounds.width / 2;
    const current = cards.reduce((best, card, index) => {
      const cardCenter = card.getBoundingClientRect().left + card.clientWidth / 2;
      const bestCenter = cards[best].getBoundingClientRect().left + cards[best].clientWidth / 2;
      return Math.abs(cardCenter - center) < Math.abs(bestCenter - center) ? index : best;
    }, 0);
    const target = cards[Math.max(0, Math.min(cards.length - 1, current + direction))];
    if (target) centerCard(target);
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const container = event.currentTarget;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, scrollLeft: container.scrollLeft, moved: false };
    container.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const currentDrag = drag.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;
    const distance = event.clientX - currentDrag.startX;
    if (Math.abs(distance) > 3) currentDrag.moved = true;
    event.currentTarget.scrollLeft = currentDrag.scrollLeft - distance;
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const currentDrag = drag.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
    if (currentDrag.moved) {
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
    }
  }

  return (
    <div className="relative md:mx-0">
      <button type="button" onClick={() => scrollToCard(-1)} className="interactive-control absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2 text-raz-dark shadow-lg md:hidden" aria-label="הקטגוריה הקודמת"><ChevronLeft size={20} /></button>
      <div ref={carouselRef} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-[calc(50%-3.5rem)] pb-2 touch-pan-y md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-5 lg:gap-5 2xl:gap-7">
      {audienceIcons.map((a, i) => {
        const isSelected = a.kind === selected;
        return (
          <button data-audience-card
            key={`${a.id}-${i}`}
            onClick={(event) => { if (suppressClick.current) return; centerCard(event.currentTarget); window.setTimeout(() => onSelect(a.kind), 260); }}
            className={`flex h-40 w-28 shrink-0 snap-center cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border py-5 transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal motion-reduce:transition-none md:h-auto md:w-auto md:min-h-36 md:py-6 lg:min-h-44 lg:gap-3 lg:py-8 xl:min-h-48 xl:py-10 2xl:min-h-56 2xl:gap-4 2xl:py-12 ${
              isSelected ? "bg-raz-teal border-raz-teal text-white" : "bg-white border-gray-100 text-gray-800"
            }`}
          >
            <span className="text-4xl lg:text-5xl 2xl:text-6xl">{a.emoji}</span>
            <span className="text-lg font-bold lg:text-xl 2xl:text-2xl"><EditableText tKey={a.labelKey} /></span>
          </button>
        );
      })}</div>
      <button type="button" onClick={() => scrollToCard(1)} className="interactive-control absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2 text-raz-dark shadow-lg md:hidden" aria-label="הקטגוריה הבאה"><ChevronRight size={20} /></button>
    </div>
  );
}
