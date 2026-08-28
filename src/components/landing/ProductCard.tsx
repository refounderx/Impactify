"use client";
import { formatNIS } from "@/lib/mock-data";
import EditableText from "@/components/admin/EditableText";

export default function ProductCard({
  title,
  price,
  priceRange,
  emoji,
  campaignCta,
  isChosen,
  onChoose,
}: {
  title: string;
  price?: number;
  priceRange?: string;
  emoji: string;
  campaignCta?: boolean;
  isChosen?: boolean;
  onChoose?: () => void;
}) {
  return (
    <div className={`bg-white rounded-2xl p-4 text-center border-2 ${isChosen ? "border-raz-teal" : "border-transparent"}`}>
      <div className="h-28 flex items-center justify-center text-5xl mb-3">{emoji}</div>
      <p className="text-sm text-gray-700 font-medium mb-2 leading-snug">{title}</p>
      <p className="text-2xl font-bold text-raz-teal font-numeric mb-3">
        {priceRange ? `₪${priceRange}` : formatNIS(price!)}
      </p>
      {campaignCta ? (
        <button className="interactive-control w-full bg-raz-teal text-white font-bold py-2 rounded-full text-sm mb-2">
          <EditableText tKey="landing.products.ctaCampaign" />
        </button>
      ) : isChosen ? (
        <button className="interactive-control w-full border-2 border-raz-teal text-raz-teal font-bold py-2 rounded-full text-sm mb-2">
          <EditableText tKey="landing.detail.chosenBtn" />
        </button>
      ) : (
        <button onClick={onChoose} className="interactive-control w-full bg-raz-teal text-white font-bold py-2 rounded-full text-sm mb-2">
          <EditableText tKey="landing.products.ctaBuy" />
        </button>
      )}
      {!campaignCta && <p className="text-xs text-gray-400">257 ❤ <EditableText tKey="landing.products.chosen" /></p>}
    </div>
  );
}
