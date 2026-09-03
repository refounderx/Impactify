"use client";
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
  const audienceIcons = (data?.audienceIcons ?? []).filter(
    (icon, index, icons) => icons.findIndex((candidate) => candidate.kind === icon.kind) === index
  );
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5 2xl:gap-7">
      {audienceIcons.map((a, i) => {
        const isSelected = a.kind === selected;
        return (
          <button
            key={`${a.id}-${i}`}
            onClick={() => onSelect(a.kind)}
            className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border py-6 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal motion-reduce:transition-none motion-reduce:hover:scale-100 lg:min-h-44 lg:gap-3 lg:py-8 xl:min-h-48 xl:py-10 2xl:min-h-56 2xl:gap-4 2xl:py-12 ${
              isSelected ? "bg-raz-teal border-raz-teal text-white" : "bg-white border-gray-100 text-gray-800"
            }`}
          >
            <span className="text-4xl lg:text-5xl 2xl:text-6xl">{a.emoji}</span>
            <span className="text-lg font-bold lg:text-xl 2xl:text-2xl"><EditableText tKey={a.labelKey} /></span>
          </button>
        );
      })}
    </div>
  );
}
