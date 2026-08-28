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
            className={`interactive-control flex flex-col items-center gap-2 rounded-2xl border py-6 transition-colors ${
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
