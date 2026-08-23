"use client";
import { impactTiles, qualityBadgeCount } from "@/lib/landing-data";
import EditableText from "@/components/admin/EditableText";

const tileColor: Record<string, string> = {
  teal: "bg-raz-teal text-white",
  "teal-sm": "bg-raz-teal text-white",
  pink: "bg-[#F82A79] text-white",
  yellow: "bg-[#FDE84F] text-gray-900",
  dark: "bg-raz-dark text-white",
};

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
      <span className="w-2 h-2 rounded-full bg-red-400" /> LIVE
    </span>
  );
}

export default function ImpactStatsGrid() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <EditableText tKey="landing.impact.heading1" as="h2" className="text-2xl font-bold text-gray-900 text-center mb-1 block" />
      <EditableText tKey="landing.impact.heading2" as="p" className="text-gray-500 text-center mb-10 block" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {impactTiles.map((tile) => (
          <div key={tile.id} className={`rounded-2xl p-5 flex flex-col justify-between min-h-[140px] ${tileColor[tile.color]}`}>
            {tile.live && <LiveDot />}
            <p className="text-3xl font-bold font-numeric mt-2">{tile.value}</p>
            <p className="text-xs opacity-80 mt-1"><EditableText tKey={tile.captionKey} /></p>
          </div>
        ))}

        <div className="rounded-2xl p-5 bg-white border border-gray-100 col-span-2">
          <EditableText tKey="landing.impact.qualityCaption" as="p" className="text-xs text-gray-500 mb-3 block" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: qualityBadgeCount }).map((_, i) => (
              <span key={i} className="text-[10px] font-bold text-raz-teal border border-raz-teal rounded px-2 py-1 text-center">
                <EditableText tKey="landing.impact.qualityBadge" />
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-gray-100 col-span-2 flex items-center justify-between">
          <div>
            <LiveDot />
            <p className="text-3xl font-bold font-numeric mt-2">1,850,235</p>
            <p className="text-xs text-gray-500 mt-1"><EditableText tKey="landing.impact.tileFinal" /></p>
          </div>
          <span className="w-20 h-20 rounded-full bg-raz-teal/20 flex items-center justify-center text-3xl">💚</span>
        </div>
      </div>
    </section>
  );
}
