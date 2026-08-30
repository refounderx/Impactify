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
    <div className={`rounded-[1.5rem] bg-white p-5 text-center shadow-[0_8px_22px_rgba(15,23,42,0.1)] ring-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(15,23,42,0.14)] ${isChosen ? "ring-2 ring-raz-teal" : "ring-slate-100"}`}>
      <div className="mb-4 flex h-36 items-center justify-center border-b border-slate-200 text-6xl">{emoji}</div>
      <p className="mb-3 break-words text-lg font-extrabold leading-snug text-raz-dark">{title}</p>
      <p className="mb-5 text-2xl font-bold text-raz-teal font-numeric">
        {priceRange ? `₪${priceRange}` : formatNIS(price!)}
      </p>
      {campaignCta ? (
        <button type="button" onClick={onChoose} className="interactive-control w-full bg-raz-teal text-white font-bold py-2 rounded-full text-sm mb-2">
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
    </div>
  );
}
