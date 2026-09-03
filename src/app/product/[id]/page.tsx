"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Building2, Heart } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import LiveProductDonationModal from "@/components/landing/LiveProductDonationModal";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS, percent } from "@/lib/mock-data";
import { getCampaignById, getProductsByIds, type DiscoverableProduct } from "@/lib/supabase/queries";
import { campaignTargetLabel, campaignTimeRemaining } from "@/lib/campaign-target";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaign_id");
  const { lang } = useLang();
  const [product, setProduct] = useState<Awaited<ReturnType<typeof getProductsByIds>>[number] | null>(null);
  const [campaign, setCampaign] = useState<Awaited<ReturnType<typeof getCampaignById>>>(null);
  const [showDonation, setShowDonation] = useState(false);

  useEffect(() => {
    if (!id || !campaignId) return;
    void Promise.all([getProductsByIds([id]), getCampaignById(campaignId)]).then(([products, currentCampaign]) => {
      setProduct(products[0] ?? null);
      setCampaign(currentCampaign);
    });
  }, [id, campaignId]);

  if (!product || !campaign) return <main className="min-h-screen bg-raz-surface px-6 py-16"><div className="mx-auto h-96 max-w-3xl animate-pulse rounded-3xl bg-white" /></main>;

  const title = lang === "en" ? (product.nameEn ?? product.name) : product.name;
  const description = lang === "en" ? (product.descriptionEn ?? product.description) : product.description;
  const campaignTitle = lang === "en" ? (campaign.titleEn ?? campaign.title) : campaign.title;
  const org = campaign._org;
  const orgName = lang === "en" ? (org?.name_en ?? org?.name) : org?.name;
  const detailProduct: DiscoverableProduct = { productId: product.id, campaignId: campaign.id, category: campaign.category, name: product.name, nameEn: product.nameEn, description: product.description, descriptionEn: product.descriptionEn, price: product.price, emoji: product.emoji, imageUrl: product.imageUrl, videoUrl: product.videoUrl, donationCount: campaign.donors };
  const progress = percent(campaign.raised, campaign.goal);

  return <main className="min-h-screen bg-raz-surface pb-24" dir={lang === "en" ? "ltr" : "rtl"}>
    <div className="mx-auto max-w-5xl px-6 py-8">
      <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-bold text-raz-teal"><ArrowRight size={18} />{lang === "en" ? "Back" : "חזרה"}</button>
      <div className="mt-6 grid gap-10 rounded-3xl bg-white p-7 shadow-sm md:grid-cols-[1fr_1.1fr] md:p-10">
        <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-3xl bg-slate-50">
          {product.imageUrl ? <Image src={product.imageUrl} alt="" fill className="object-contain p-6" sizes="(max-width: 768px) 100vw, 45vw" /> : <span className="text-8xl">{product.emoji}</span>}
        </div>
        <div>
          <p className="text-sm font-bold text-raz-teal">{orgName}</p>
          <h1 className="mt-3 text-4xl leading-tight text-raz-dark md:text-5xl">{title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{description}</p>
          <p className="mt-7 text-5xl font-black text-raz-dark">{formatNIS(product.price)}</p>
          <button type="button" onClick={() => setShowDonation(true)} className="mt-7 w-full rounded-full bg-raz-teal py-4 text-lg font-black text-white shadow-[0_12px_24px_rgba(0,181,173,.25)]">{lang === "en" ? "Choose to donate" : "אני בוחר לתרום"}</button>
          <p className="mt-3 text-center text-sm font-bold text-slate-500"><Heart className="me-1 inline text-pink-500" size={16} fill="currentColor" />{campaign.donors.toLocaleString()} {lang === "en" ? "people have already donated" : "כבר בחרו לתרום"}</p>
        </div>
      </div>

      <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm md:p-10">
        <p className="text-sm font-bold text-raz-teal">{lang === "en" ? "Campaign" : "קמפיין"}</p>
        <h2 className="mt-2 text-3xl font-extrabold text-raz-dark">{campaignTitle}</h2>
        <div className="mt-6 flex items-center justify-between font-bold"><span>{formatNIS(campaign.raised)} {lang === "en" ? "raised" : "גויסו"}</span><span className="text-raz-teal">{progress}%</span></div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-raz-teal" style={{ width: `${progress}%` }} /></div>
        <p className="mt-2 text-sm text-slate-500">{campaignTargetLabel(campaign, lang)} · {lang === "en" ? `Goal: ${formatNIS(campaign.goal)} · ${campaign.donors.toLocaleString()} donors` : `יעד: ${formatNIS(campaign.goal)} · ${campaign.donors.toLocaleString()} תורמים`}</p>
        <p className="mt-1 text-xs text-slate-400">{campaignTimeRemaining(campaign, lang)}</p>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm md:p-10">
        <div className="flex items-center gap-3"><Building2 className="text-raz-teal" /><div><p className="text-sm font-bold text-raz-teal">{lang === "en" ? "The nonprofit" : "העמותה"}</p><h2 className="text-2xl font-extrabold text-raz-dark">{orgName}</h2></div></div>
        <p className="mt-5 leading-8 text-slate-600">{lang === "en" ? (org?.description_en ?? org?.description) : org?.description}</p>
        <p className="mt-6 border-t border-slate-100 pt-6 leading-8 text-slate-600">{lang === "en" ? (campaign.storyEn ?? campaign.story) : campaign.story}</p>
      </section>
    </div>
    {showDonation && <LiveProductDonationModal product={detailProduct} otherProducts={[]} onChooseProduct={() => {}} onContinue={() => router.push(`/donate/${campaign.id}/payment?amount=${product.price}&product_id=${product.id}`)} onClose={() => setShowDonation(false)} />}
    <BottomNav variant="donor" />
  </main>;
}
