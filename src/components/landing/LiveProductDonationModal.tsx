"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { getCampaignVideoSource } from "@/lib/campaign-media";
import { formatNIS } from "@/lib/mock-data";
import type { DiscoverableProduct } from "@/lib/supabase/queries";
import { getCampaignById } from "@/lib/supabase/queries";
import { percent } from "@/lib/mock-data";

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
  const { preferences, openPreferences } = useCookieConsent();
  const title = lang === "en" ? (product.nameEn ?? product.name) : product.name;
  const description = lang === "en" ? (product.descriptionEn ?? product.description) : product.description;
  const video = getCampaignVideoSource(product.videoUrl);
  const [campaign, setCampaign] = useState<Awaited<ReturnType<typeof getCampaignById>>>(null);

  useEffect(() => { void getCampaignById(product.campaignId).then(setCampaign); }, [product.campaignId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-raz-dark/85 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <section className="my-auto w-full max-w-[34rem] overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_80px_rgba(10,15,35,0.45)]" dir={lang === "en" ? "ltr" : "rtl"} onClick={(event) => event.stopPropagation()}>
        <div className="relative px-6 pb-5 pt-6 sm:px-9">
          <button type="button" onClick={onClose} className="absolute start-3 top-3 z-10 rounded-full p-2 text-slate-300 transition hover:bg-slate-100 hover:text-slate-700" aria-label={t("hint.close")}><X size={25} /></button>
          {video?.kind === "embed" && preferences.marketing && <iframe src={video.url} title={title} className="relative mt-5 aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-inner" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />}
          {video?.kind === "embed" && !preferences.marketing && <div className="relative mt-5 flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl bg-raz-dark px-6 text-center text-white shadow-inner"><Play size={38} /><p className="text-sm font-bold">{lang === "en" ? "Approve marketing cookies to play this video here." : "יש לאשר עוגיות שיווק כדי לנגן את הסרטון כאן."}</p><button type="button" onClick={openPreferences} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-raz-teal">{lang === "en" ? "Cookie settings" : "ניהול הגדרות עוגיות"}</button></div>}
          {video?.kind === "video" && <video src={video.url} controls playsInline className="relative mt-5 aspect-video w-full rounded-2xl bg-black shadow-inner" />}
          <div className={`flex items-center gap-5 ${video ? "mt-6" : "mt-8"}`}>
            {product.imageUrl && <div className="relative h-28 w-32 shrink-0 overflow-hidden rounded-2xl bg-slate-50"><Image src={product.imageUrl} alt="" fill className="object-contain" sizes="128px" /></div>}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black leading-tight text-raz-dark sm:text-2xl">{title}</h2>
              {description && <p className="mt-2 text-sm leading-5 text-slate-500">{description}</p>}
              <p className="mt-3 text-4xl font-black tracking-tight text-raz-dark">{formatNIS(product.price)}</p>
              <p className="mt-1 text-xs font-bold text-slate-500"><span className="text-pink-500">♥</span> {product.donationCount.toLocaleString()} {lang === "en" ? "people chose this gift" : "תורמים כבר בחרו במתנה הזאת"}</p>
            </div>
          </div>
        </div>

        <div className="border-y border-raz-teal/10 bg-raz-teal/[0.04] px-6 py-5 sm:px-9">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-black text-raz-dark">{lang === "en" ? "Your donation total" : "סך התרומה שלך"}</p>
              <p className="mt-1 text-xs font-bold text-slate-400">{lang === "en" ? "One meaningful product" : "מוצר אחד עם השפעה ישירה"}</p>
            </div>
            <p className="text-2xl font-black text-raz-teal">{formatNIS(product.price)}</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white"><div className="h-full w-3/5 rounded-full bg-raz-teal" /></div>
        </div>

        {campaign && <div className="border-b border-slate-100 px-6 py-5 sm:px-9">
          <div className="flex items-center justify-between text-sm font-bold text-slate-600"><span>{lang === "en" ? "Campaign progress" : "התקדמות הקמפיין"}</span><span className="text-raz-teal">{percent(campaign.raised, campaign.goal)}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-raz-teal" style={{ width: `${percent(campaign.raised, campaign.goal)}%` }} /></div>
          <p className="mt-2 text-xs text-slate-500">{formatNIS(campaign.raised)} {lang === "en" ? "raised of" : "גויסו מתוך"} {formatNIS(campaign.goal)} · {campaign.donors.toLocaleString()} {lang === "en" ? "donors" : "תורמים"}</p>
        </div>}

        {otherProducts.length > 0 && <div className="px-6 py-6 sm:px-9">
          <p className="mb-4 text-center text-sm font-black text-raz-dark">{lang === "en" ? "Other donors also chose" : "תורמים אחרים בחרו גם במוצרים האלה"}</p>
          <div className="grid grid-cols-3 gap-3">
            {otherProducts.slice(0, 3).map((other) => (
              <button type="button" key={`${other.productId}-${other.campaignId}`} onClick={() => onChooseProduct(other)} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 text-center transition hover:-translate-y-0.5 hover:border-raz-teal/40 hover:bg-white hover:shadow-md">
                {other.imageUrl && <span className="relative block h-20 bg-white"><Image src={other.imageUrl} alt="" fill className="object-contain p-2" sizes="(max-width: 640px) 30vw, 140px" />{other.videoUrl && <span className="absolute inset-0 flex items-center justify-center"><span className="rounded-full bg-raz-dark/65 p-1.5 text-white"><Play size={13} fill="currentColor" /></span></span>}</span>}
                <span className="block px-2 pb-2 pt-3"><span className="block min-h-8 text-xs font-bold leading-tight text-slate-700">{lang === "en" ? (other.nameEn ?? other.name) : other.name}</span><span className="mt-1 block text-sm font-black text-raz-teal">{formatNIS(other.price)}</span></span>
              </button>
            ))}
          </div>
        </div>}

        <div className="border-t border-slate-100 px-6 py-6 sm:px-9">
          <div className="mx-auto max-w-xs rounded-2xl bg-slate-50 px-5 py-3 text-center"><span className="text-xs font-bold text-slate-500">{lang === "en" ? "Total" : "סה״כ"}</span><span className="ms-3 text-4xl font-black text-raz-dark">{formatNIS(product.price)}</span></div>
          <button type="button" onClick={onContinue} className="mt-4 w-full rounded-full bg-raz-teal py-3.5 text-base font-black text-white shadow-[0_10px_20px_rgba(0,181,173,0.25)] transition hover:-translate-y-0.5 hover:bg-raz-teal-dark">{lang === "en" ? "Choose to donate" : "אני בוחר לתרום"}</button>
        </div>
      </section>
    </div>
  );
}
