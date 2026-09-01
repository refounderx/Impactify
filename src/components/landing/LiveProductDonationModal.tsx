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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-raz-dark/80 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <section className="w-full max-w-[30rem] overflow-hidden rounded-2xl bg-white shadow-2xl" dir={lang === "en" ? "ltr" : "rtl"} onClick={(event) => event.stopPropagation()}>
        <div className="relative px-9 pb-6 pt-8 sm:px-10">
          <button type="button" onClick={onClose} className="absolute start-3 top-3 rounded-full p-2 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600" aria-label={t("hint.close")}><X size={25} /></button>
          <div className="grid grid-cols-[1fr_auto] items-center gap-5 border-b border-slate-100 pb-5">
            <div className="text-center">
              <h2 className="text-lg font-black leading-tight text-raz-dark">{title}</h2>
              <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">{formatNIS(product.price)}</p>
              <p className="mt-3 text-xs font-bold text-slate-600"><span className="text-pink-500">♥</span> {product.donationCount.toLocaleString()} {lang === "en" ? "already chose to donate" : "כבר בחרו לתרום"}</p>
            </div>
            <div className="flex h-28 w-28 items-center justify-center text-6xl">{product.emoji}</div>
          </div>
          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-center">
            <p className="text-sm font-bold text-slate-700">{lang === "en" ? "Your donation supports this active campaign" : "התרומה שלך תומכת בקמפיין הפעיל"}</p>
            <p className="mt-1 text-xs text-slate-500">{lang === "en" ? "The amount is set by the nonprofit for this product." : "סכום התרומה נקבע על ידי העמותה עבור מוצר זה."}</p>
          </div>
        </div>

        {otherProducts.length > 0 && <div className="border-y border-slate-100 px-7 py-6 sm:px-10">
          <p className="mb-4 text-center text-sm font-bold text-slate-700">{lang === "en" ? "Other popular choices" : "בחירות פופולריות נוספות"}</p>
          <div className="grid grid-cols-3 gap-2">
            {otherProducts.slice(0, 3).map((other) => (
              <button type="button" key={`${other.productId}-${other.campaignId}`} onClick={() => onChooseProduct(other)} className="rounded-xl bg-slate-50 px-2 py-3 text-center transition hover:bg-raz-teal/10">
                <span className="text-3xl">{other.emoji}</span>
                <span className="mt-2 block min-h-8 text-xs font-bold leading-tight text-slate-700">{lang === "en" ? (other.nameEn ?? other.name) : other.name}</span>
                <span className="mt-1 block text-base font-black text-slate-900">{formatNIS(other.price)}</span>
              </button>
            ))}
          </div>
        </div>}

        <div className="px-9 py-7 text-center sm:px-10">
          <button type="button" onClick={onContinue} className="w-full rounded-full bg-raz-teal py-3 text-sm font-black text-white transition hover:bg-raz-teal-dark">{lang === "en" ? "Continue to donate" : "המשך לתרומה"}</button>
        </div>
      </section>
    </div>
  );
}
