"use client";
import { useRef } from "react";
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
  const drag = useRef<{ pointerId: number; lastX: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const audienceIcons = (data?.audienceIcons?.length ? data.audienceIcons : defaultAudienceIcons).filter(
    (icon, index, icons) => icons.findIndex((candidate) => candidate.kind === icon.kind) === index
  );
  function scrollToCard(direction: -1 | 1) {
    const container = carouselRef.current;
    if (container) container.scrollBy({ left: direction * container.clientWidth * 0.75, behavior: "smooth" });
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(min-width: 768px)").matches) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const container = event.currentTarget;
    drag.current = { pointerId: event.pointerId, lastX: event.clientX, moved: false };
    container.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(min-width: 768px)").matches) return;
    const currentDrag = drag.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;
    const distance = event.clientX - currentDrag.lastX;
    if (Math.abs(distance) > 3) currentDrag.moved = true;
    event.currentTarget.scrollBy({ left: -distance, behavior: "instant" });
    currentDrag.lastX = event.clientX;
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(min-width: 768px)").matches) return;
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
      <div ref={carouselRef} dir="ltr" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} className="no-scrollbar flex w-full min-w-0 touch-pan-y select-none gap-3 overflow-x-auto px-8 pb-2 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-5 lg:gap-5 2xl:gap-7">
      {audienceIcons.map((a) => {
        const isSelected = a.kind === selected;
        return (
          <button
            key={a.id}
            onClick={() => {
              if (suppressClick.current) return;
              onSelect(a.kind);
            }}
            className={`flex h-40 w-[calc((100%-0.75rem)/2)] shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border py-5 transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal motion-reduce:transition-none md:h-auto md:w-auto md:min-h-36 md:py-6 lg:min-h-44 lg:gap-3 lg:py-8 xl:min-h-48 xl:py-10 2xl:min-h-56 2xl:gap-4 2xl:py-12 ${
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
