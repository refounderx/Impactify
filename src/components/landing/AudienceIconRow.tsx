"use client";
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { audienceIcons as defaultAudienceIcons, type AudienceKind } from "@/lib/landing-data";
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
  const audienceIcons = (data?.audienceIcons?.length ? data.audienceIcons : defaultAudienceIcons).filter(
    (icon, index, icons) => icons.findIndex((candidate) => candidate.kind === icon.kind) === index
  );
  const carouselItems = audienceIcons.length > 1
    ? [{ icon: audienceIcons[audienceIcons.length - 1], isClone: true }, ...audienceIcons.map((icon) => ({ icon, isClone: false })), { icon: audienceIcons[0], isClone: true }]
    : audienceIcons.map((icon) => ({ icon, isClone: false }));
  const initialAudienceKind = audienceIcons[0]?.kind;

  function getOriginalCard(kind: AudienceKind) {
    return carouselRef.current?.querySelector<HTMLButtonElement>(`[data-audience-card][data-audience-kind="${kind}"]:not([data-carousel-clone])`);
  }

  function getCenteredCard() {
    const container = carouselRef.current;
    const cards = Array.from(container?.querySelectorAll<HTMLButtonElement>("[data-audience-card]") ?? []);
    if (!container || !cards.length) return null;
    const containerBounds = container.getBoundingClientRect();
    const center = containerBounds.left + containerBounds.width / 2;
    return cards.reduce((best, card) => {
      const cardCenter = card.getBoundingClientRect().left + card.clientWidth / 2;
      const bestCenter = best.getBoundingClientRect().left + best.clientWidth / 2;
      return Math.abs(cardCenter - center) < Math.abs(bestCenter - center) ? card : best;
    });
  }
  function centerCard(card: HTMLButtonElement, behavior: ScrollBehavior = "smooth") {
    const container = carouselRef.current;
    if (!container) return;
    const containerBounds = container.getBoundingClientRect();
    const cardBounds = card.getBoundingClientRect();
    const distanceFromCenter = cardBounds.left + cardBounds.width / 2 - (containerBounds.left + containerBounds.width / 2);
    if (Math.abs(distanceFromCenter) >= 1) container.scrollBy({ left: distanceFromCenter, behavior });
  }

  useEffect(() => {
    if (!initialAudienceKind) return;
    const initialFrame = window.requestAnimationFrame(() => {
      const firstCard = getOriginalCard(initialAudienceKind);
      if (firstCard) centerCard(firstCard, "auto");
    });
    return () => window.cancelAnimationFrame(initialFrame);
  }, [initialAudienceKind]);

  useEffect(() => {
    if (!selected) return;
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const card = getOriginalCard(selected);
        if (card) centerCard(card);
      });
    });
    return () => window.cancelAnimationFrame(firstFrame);
  }, [selected]);

  function scrollToCard(direction: -1 | 1) {
    const current = getCenteredCard();
    if (!current || !audienceIcons.length) return;
    const currentIndex = audienceIcons.findIndex((icon) => icon.kind === current.dataset.audienceKind);
    if (currentIndex < 0) return;
    const targetIndex = (currentIndex + direction + audienceIcons.length) % audienceIcons.length;
    const targetKind = audienceIcons[targetIndex].kind;
    const wrapsForward = direction === 1 && currentIndex === audienceIcons.length - 1;
    const wrapsBackward = direction === -1 && currentIndex === 0;
    const target = (wrapsForward || wrapsBackward)
      ? carouselRef.current?.querySelector<HTMLButtonElement>(`[data-audience-card][data-audience-kind="${targetKind}"][data-carousel-clone]`)
      : getOriginalCard(targetKind);
    if (!target) return;
    centerCard(target);
    if (wrapsForward || wrapsBackward) {
      const container = carouselRef.current;
      const normalize = () => {
        const original = getOriginalCard(targetKind);
        if (original) centerCard(original, "auto");
      };
      container?.addEventListener("scrollend", normalize, { once: true });
      window.setTimeout(normalize, 700);
    }
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
    <div className="relative min-w-0 md:mx-0">
      <button type="button" onClick={() => scrollToCard(-1)} className="interactive-control absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2 text-raz-dark shadow-lg md:hidden" aria-label="הקטגוריה הקודמת"><ChevronLeft size={20} /></button>
      <div ref={carouselRef} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} className="no-scrollbar flex w-full min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto px-8 pb-2 touch-pan-y md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-5 lg:gap-5 2xl:gap-7">
      {carouselItems.map(({ icon: a, isClone }, i) => {
        const isSelected = !isClone && a.kind === selected;
        return (
          <button data-audience-card
            data-audience-kind={a.kind}
            {...(isClone ? { "data-carousel-clone": "true" } : {})}
            key={`${a.id}-${i}`}
            onClick={(event) => {
              if (suppressClick.current) return;
              if (selected === a.kind) centerCard(isClone ? getOriginalCard(a.kind) ?? event.currentTarget : event.currentTarget);
              else onSelect(a.kind);
            }}
            className={`flex h-40 w-28 shrink-0 snap-center cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border py-5 transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal motion-reduce:transition-none md:h-auto md:w-auto md:min-h-36 md:py-6 lg:min-h-44 lg:gap-3 lg:py-8 xl:min-h-48 xl:py-10 2xl:min-h-56 2xl:gap-4 2xl:py-12 ${
              isSelected ? "bg-raz-teal border-raz-teal text-white" : "bg-white border-gray-100 text-gray-800"
            }`}
          >
            <span className="text-4xl lg:text-5xl 2xl:text-6xl">{a.emoji}</span>
            <span className="text-lg font-bold lg:text-xl 2xl:text-2xl"><EditableText tKey={a.labelKey} /></span>
          </button>
        );
      })}
      </div>
      <button type="button" onClick={() => scrollToCard(1)} className="interactive-control absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2 text-raz-dark shadow-lg md:hidden" aria-label="הקטגוריה הבאה"><ChevronRight size={20} /></button>
    </div>
  );
}
