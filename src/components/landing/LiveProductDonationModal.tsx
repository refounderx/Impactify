"use client";

import { X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import type { DiscoverableProduct } from "@/lib/supabase/queries";

export default function LiveProductDonationModal({
  product,
  otherProducts,
  onChooseProduct,
  onContinue,
  onClose,
}: {
  product: DiscoverableProduct;
  otherProducts: DiscoverableProduct[];
  onChooseProduct: (product: DiscoverableProduct) => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  const { lang, t } = useLang();
  const title = lang === "en" ? (product.nameEn ?? product.name) : product.name;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-raz-dark/85 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <section className="my-auto w-full max-w-[34rem] overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_80px_rgba(10,15,35,0.45)]" dir={lang === "en" ? "ltr" : "rtl"} onClick={(event) => event.stopPropagation()}>
        <div className="relative overflow-hidden bg-raz-dark px-7 pb-7 pt-8 text-white sm:px-10">
          <div className="absolute -end-16 -top-20 h-52 w-52 rounded-full border-[24px] border-white/5" />
          <div className="absolute -start-10 bottom-0 h-28 w-28 rounded-full bg-raz-teal/20 blur-2xl" />
          <button type="button" onClick={onClose} className="absolute end-4 top-4 z-10 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white" aria-label={t("hint.close")}><X size={25} /></button>
          <p className="relative text-xs font-bold tracking-[0.18em] text-teal-200">{lang === "en" ? "A GIFT WITH IMPACT" : "מתנה עם השפעה"}</p>
          <div className="relative mt-5 flex items-center gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.7rem] border border-white/15 bg-white/10 text-6xl shadow-inner">{product.emoji}</div>
            <div>
              <h2 className="text-xl font-black leading-tight sm:text-2xl">{title}</h2>
              <p className="mt-2 text-sm font-medium text-white/70">{lang === "en" ? "One product. A direct impact." : "מוצר אחד. השפעה ישירה."}</p>
            </div>
          </div>
        </div>

        <div className="px-7 py-7 sm:px-10">
          <div className="grid grid-cols-[1fr_auto] items-end gap-4 border-b border-slate-100 pb-6">
            <div>
              <p className="text-xs font-bold text-slate-400">{lang === "en" ? "Donation amount" : "סכום התרומה"}</p>
              <p className="mt-1 text-5xl font-black tracking-tight text-slate-950">{formatNIS(product.price)}</p>
            </div>
            <div className="rounded-2xl bg-pink-50 px-3 py-2 text-center text-xs font-bold text-slate-600"><span className="text-pink-500">♥</span><br />{product.donationCount.toLocaleString()}<br />{lang === "en" ? "donors" : "תורמים"}</div>
          </div>

          <div className="mt-5 rounded-2xl border border-raz-teal/10 bg-raz-teal/5 px-5 py-4">
            <p className="font-bold text-raz-dark">{lang === "en" ? "This is what your gift supports" : "לזה התרומה שלך מיועדת"}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{lang === "en" ? "The nonprofit set this amount specifically for the product you selected." : "העמותה קבעה את הסכום במיוחד עבור המוצר שבחרת."}</p>
          </div>
        </div>

        {otherProducts.length > 0 && <div className="border-y border-slate-100 bg-slate-50/80 px-7 py-6 sm:px-10">
          <p className="mb-4 text-center text-sm font-black text-slate-700">{lang === "en" ? "Other popular choices" : "בחירות פופולריות נוספות"}</p>
          <div className="grid grid-cols-3 gap-3">
            {otherProducts.slice(0, 3).map((other) => (
              <button type="button" key={`${other.productId}-${other.campaignId}`} onClick={() => onChooseProduct(other)} className="rounded-2xl border border-transparent bg-white px-2 py-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-raz-teal/40 hover:shadow-md">
                <span className="text-3xl">{other.emoji}</span>
                <span className="mt-2 block min-h-8 text-xs font-bold leading-tight text-slate-700">{lang === "en" ? (other.nameEn ?? other.name) : other.name}</span>
                <span className="mt-1 block text-sm font-black text-raz-teal">{formatNIS(other.price)}</span>
              </button>
            ))}
          </div>
        </div>}

        <div className="px-7 py-7 sm:px-10">
          <button type="button" onClick={onContinue} className="w-full rounded-full bg-raz-teal py-4 text-base font-black text-white shadow-[0_10px_20px_rgba(0,181,173,0.25)] transition hover:-translate-y-0.5 hover:bg-raz-teal-dark">{lang === "en" ? "Continue to donate" : "אני בוחר לתרום"}</button>
        </div>
      </section>
    </div>
  );
}
