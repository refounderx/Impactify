"use client";

import { useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import type { AudienceProduct } from "@/lib/landing-data";
import { formatNIS } from "@/lib/mock-data";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import EditableText from "@/components/admin/EditableText";

function ProductVisual({ product, size = "large" }: { product: AudienceProduct; size?: "large" | "small" }) {
  const dimensions = size === "large" ? "h-28 w-28 text-6xl" : "h-16 w-16 text-3xl";
  if (product.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- Product imagery may be supplied by the site dataset.
    return <img src={product.imageUrl} alt="" className={`${dimensions} object-contain`} />;
  }
  return <div className={`${dimensions} flex items-center justify-center`}>{product.emoji}</div>;
}

export default function ProductDonationPanel({
  product,
  qty,
  onQtyChange,
  otherProducts,
  otherQty,
  onOtherQtyChange,
  total,
  onContinue,
  onClose,
}: {
  product: AudienceProduct;
  qty: number;
  onQtyChange: (qty: number) => void;
  otherProducts: AudienceProduct[];
  otherQty: Record<string, number>;
  onOtherQtyChange: (id: string, qty: number) => void;
  total: number;
  onContinue: () => void;
  onClose: () => void;
}) {
  const { lang, t } = useLang();
  const { data } = useSiteDataset("landing");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const progress = data?.checkoutProgress ?? { goal: 0, raised: 0 };
  const progressPercent = progress.goal > 0 ? Math.min(100, (progress.raised / progress.goal) * 100) : 0;
  const title = lang === "en" ? product.titleEn : product.title;

  return (
    <section className="w-full max-w-[30rem] overflow-hidden rounded-2xl bg-white shadow-2xl" dir={lang === "en" ? "ltr" : "rtl"}>
      <div className="relative px-9 pb-6 pt-8 sm:px-10">
        <button type="button" onClick={onClose} className="absolute start-3 top-3 rounded-full p-2 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600" aria-label={t("hint.close")}>
          <X size={25} />
        </button>

        {product.videoUrl && (
          <div className="relative mb-6 aspect-video overflow-hidden bg-black">
            <video ref={videoRef} src={product.videoUrl} controls={videoPlaying} playsInline onPlay={() => setVideoPlaying(true)} onPause={() => setVideoPlaying(false)} className="h-full w-full object-cover" />
            {!videoPlaying && <button type="button" onClick={() => void videoRef.current?.play()} className="absolute inset-0 flex items-center justify-center text-white" aria-label={t("hint.play")}><span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/65 bg-black/20"><Play size={38} fill="currentColor" /></span></button>}
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto] items-center gap-5 border-b border-slate-100 pb-5">
          <div className="text-center">
            <h2 className="text-lg font-black leading-tight text-raz-dark">{title}</h2>
            <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">{formatNIS(product.price * qty)}</p>
            <div className="mt-2 inline-flex items-center gap-4 rounded-full border border-raz-teal px-3 py-1 text-sm text-raz-teal">
              <button type="button" onClick={() => onQtyChange(Math.max(1, qty - 1))} aria-label={t("hint.decrease")}>−</button>
              <span className="font-bold">{qty}</span>
              <button type="button" onClick={() => onQtyChange(qty + 1)} aria-label={t("hint.increase")}>+</button>
            </div>
            <p className="mt-3 text-xs font-bold text-slate-600">257 <span className="text-pink-500">♥</span> <EditableText tKey="landing.products.chosen" /></p>
          </div>
          <ProductVisual product={product} />
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-center">
          <EditableText tKey="landing.checkout.progressIncludes" as="p" className="text-lg font-bold text-slate-700" />
          <p className="mt-1 text-sm text-slate-500"><EditableText tKey="landing.checkout.progressPrefix" /> {progress.goal.toLocaleString()} <EditableText tKey="landing.checkout.progressMid" /> <span className="font-bold text-raz-teal">{progress.raised.toLocaleString()}</span> <EditableText tKey="landing.checkout.progressUnit" /></p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-raz-teal" style={{ width: `${progressPercent}%` }} /></div>
        </div>
      </div>

      {otherProducts.length > 0 && <div className="border-y border-slate-100 px-7 py-6 sm:px-10">
        <EditableText tKey="landing.checkout.crossSellHeading" as="p" className="mb-4 block text-center text-sm font-bold text-slate-700" />
        <div className="grid grid-cols-3 gap-2">
          {otherProducts.slice(0, 3).map((other) => {
            const selected = otherQty[other.id] ?? 0;
            return <div key={other.id} className="rounded-xl bg-slate-50 px-2 py-3 text-center">
              <div className="flex justify-center"><ProductVisual product={other} size="small" /></div>
              <p className="mt-2 min-h-8 text-xs font-bold leading-tight text-slate-700">{lang === "en" ? other.titleEn : other.title}</p>
              <p className="mt-1 text-base font-black text-slate-900">{formatNIS(other.price)}</p>
              <div className="mt-2 flex items-center justify-center gap-3 rounded-full border border-raz-teal py-0.5 text-xs text-raz-teal">
                <button type="button" onClick={() => onOtherQtyChange(other.id, Math.max(0, selected - 1))} aria-label={t("hint.decrease")}>−</button>
                <span>{selected}</span>
                <button type="button" onClick={() => onOtherQtyChange(other.id, selected + 1)} aria-label={t("hint.increase")}>+</button>
              </div>
            </div>;
          })}
        </div>
      </div>}

      <div className="px-9 py-7 text-center sm:px-10">
        <p className="text-xs text-slate-500"><EditableText tKey="landing.checkout.totalLabel" /></p>
        <p className="mt-1 text-4xl font-black tracking-tight text-black">{formatNIS(total)}</p>
        <button type="button" onClick={onContinue} className="mt-5 w-full rounded-full bg-raz-teal py-3 text-sm font-black text-white transition hover:bg-raz-teal-dark">
          <Play size={14} className="me-2 inline-block rotate-180" fill="currentColor" /> <EditableText tKey="landing.checkout.continuePersonal" />
        </button>
      </div>
    </section>
  );
}
