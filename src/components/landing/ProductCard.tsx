"use client";
import Image from "next/image";
import { Play } from "lucide-react";
import { formatNIS } from "@/lib/mock-data";
import EditableText from "@/components/admin/EditableText";

export default function ProductCard({
  title,
  price,
  priceRange,
  emoji,
  imageUrl,
  videoUrl,
  donationCount,
  campaignCta,
  isChosen,
  onChoose,
}: {
  title: string;
  price?: number;
  priceRange?: string;
  emoji: string;
  imageUrl?: string;
  videoUrl?: string;
  donationCount?: number;
  campaignCta?: boolean;
  isChosen?: boolean;
  onChoose?: () => void;
}) {
  return (
    <div className={`flex min-h-[19rem] flex-col rounded-[1.5rem] bg-white p-5 text-center shadow-[0_8px_22px_rgba(15,23,42,0.1)] ring-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(15,23,42,0.14)] ${isChosen ? "ring-2 ring-raz-teal" : "ring-slate-100"}`}>
      {(imageUrl || videoUrl) && <div aria-label={imageUrl ? undefined : emoji} className={`relative mb-4 flex overflow-hidden rounded-2xl ${imageUrl ? "h-40 bg-slate-50" : "h-32 bg-raz-dark"}`}>
        {imageUrl && <Image src={imageUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />}
        {videoUrl && <button type="button" onClick={onChoose} className="absolute inset-0 flex items-center justify-center bg-raz-dark/20 transition hover:bg-raz-dark/35" aria-label="צפייה בסרטון"><span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-raz-dark/65 text-white shadow-lg"><Play size={22} fill="currentColor" /></span></button>}
      </div>}
      <p className="mb-3 min-h-12 break-words text-lg font-extrabold leading-snug text-raz-dark">{title}</p>
      <p className="mb-5 text-2xl font-bold text-raz-teal font-numeric">
        {priceRange ? `₪${priceRange}` : formatNIS(price!)}
      </p>
      <div className="mt-auto">{campaignCta ? (
        <button type="button" onClick={onChoose} className="interactive-control w-full bg-raz-teal text-white font-bold py-2 rounded-full text-sm mb-2">
          <EditableText tKey="landing.products.ctaCampaign" />
        </button>
      ) : isChosen ? (
        <button className="interactive-control w-full border-2 border-raz-teal text-raz-teal font-bold py-2 rounded-full text-sm mb-2">
          <EditableText tKey="landing.detail.chosenBtn" />
        </button>
      ) : (
      <button type="button" onClick={onChoose} className="interactive-control w-full bg-raz-teal text-white font-bold py-2 rounded-full text-sm mb-2">
          <EditableText tKey="landing.products.ctaBuy" />
        </button>
      )}
      {donationCount !== undefined && <p className="mt-2 text-xs font-bold text-slate-600"><span className="text-pink-500">♥</span> {donationCount.toLocaleString()} {" "}כבר בחרו לתרום</p>}</div>
    </div>
  );
}
