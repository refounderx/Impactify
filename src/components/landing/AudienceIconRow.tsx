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
  const audienceIcons = data?.audienceIcons ?? [];
  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
      {audienceIcons.map((a, i) => {
        const isSelected = a.kind === selected;
        return (
          <button
            key={`${a.id}-${i}`}
            onClick={() => onSelect(a.kind)}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border py-6 transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal motion-reduce:transition-none motion-reduce:hover:scale-100 ${
              isSelected ? "bg-raz-teal border-raz-teal text-white" : "bg-white border-gray-100 text-gray-800"
            }`}
          >
            <span className="text-4xl">{a.emoji}</span>
            <span className="font-bold"><EditableText tKey={a.labelKey} /></span>
          </button>
        );
      })}
    </div>
  );
}
