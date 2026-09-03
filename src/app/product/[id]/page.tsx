"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Heart, Play } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import LiveProductDonationModal from "@/components/landing/LiveProductDonationModal";
import ProductCard from "@/components/landing/ProductCard";
import { useLang } from "@/contexts/LanguageContext";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { getCampaignVideoSource } from "@/lib/campaign-media";
import { campaignTargetLabel, campaignTimeRemaining } from "@/lib/campaign-target";
import { formatNIS, percent } from "@/lib/mock-data";
import { getCampaignById, getProductsByIds, type DiscoverableProduct } from "@/lib/supabase/queries";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const campaignId = useSearchParams().get("campaign_id");
  const { lang } = useLang();
  const { preferences, openPreferences } = useCookieConsent();
  const [product, setProduct] = useState<Awaited<ReturnType<typeof getProductsByIds>>[number] | null>(null);
  const [campaign, setCampaign] = useState<Awaited<ReturnType<typeof getCampaignById>>>(null);
  const [related, setRelated] = useState<Awaited<ReturnType<typeof getProductsByIds>>>([]);
  const [showDonation, setShowDonation] = useState(false);

  useEffect(() => {
    if (!id || !campaignId) return;
    void Promise.all([getProductsByIds([id]), getCampaignById(campaignId)]).then(async ([products, currentCampaign]) => {
      setProduct(products[0] ?? null);
      setCampaign(currentCampaign);
      if (currentCampaign?.productIds?.length) setRelated(await getProductsByIds(currentCampaign.productIds.filter((productId) => productId !== id)));
    });
  }, [id, campaignId]);

  if (!product || !campaign) return <main className="min-h-screen bg-raz-surface px-6 py-16"><div className="mx-auto h-96 max-w-5xl animate-pulse rounded-3xl bg-white" /></main>;
  const title = lang === "en" ? (product.nameEn ?? product.name) : product.name;
  const description = lang === "en" ? (product.descriptionEn ?? product.description) : product.description;
  const campaignTitle = lang === "en" ? (campaign.titleEn ?? campaign.title) : campaign.title;
  const org = campaign._org;
  const orgName = lang === "en" ? (org?.name_en ?? org?.name) : org?.name;
  const video = getCampaignVideoSource(product.videoUrl);
  const progress = percent(campaign.raised, campaign.goal);
  const detailProduct: DiscoverableProduct = { productId: product.id, campaignId: campaign.id, category: campaign.category, name: product.name, nameEn: product.nameEn, description: product.description, descriptionEn: product.descriptionEn, price: product.price, emoji: product.emoji, imageUrl: product.imageUrl, videoUrl: product.videoUrl, donationCount: campaign.donors };

  return <main className="min-h-screen bg-raz-surface pb-24" dir={lang === "en" ? "ltr" : "rtl"}>
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-bold text-raz-teal"><ArrowRight size={18} />{lang === "en" ? "Back" : "חזרה"}</button>
      <div className="mt-6 grid gap-8 rounded-[2rem] bg-white p-6 shadow-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] md:p-10">
        <div className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-3xl bg-slate-50">
          {video?.kind === "embed" && preferences.marketing ? <iframe src={video.url} title={title} className="absolute inset-0 h-full w-full bg-black" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            : video?.kind === "video" ? <video src={video.url} controls playsInline className="absolute inset-0 h-full w-full bg-black object-contain" />
              : product.imageUrl ? <Image src={product.imageUrl} alt={title} fill className="object-contain p-8" sizes="(max-width: 768px) 100vw, 45vw" />
                : <span className="text-8xl">{product.emoji}</span>}
          {video?.kind === "embed" && !preferences.marketing && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-raz-dark px-6 text-center text-white"><Play size={40} /><p className="font-bold">{lang === "en" ? "Approve marketing cookies to play this video here." : "יש לאשר עוגיות שיווק כדי לנגן את הסרטון כאן."}</p><button type="button" onClick={openPreferences} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-raz-teal">{lang === "en" ? "Cookie settings" : "ניהול הגדרות עוגיות"}</button></div>}
        </div>
        <div className="flex flex-col justify-center">
          {org && <Link href={`/organization/${org.id}`} className="inline-flex w-fit items-center gap-2 text-sm font-bold text-raz-teal hover:underline"><Building2 size={17} />{orgName}</Link>}
          <h1 className="mt-4 text-4xl leading-tight text-raz-dark md:text-5xl">{title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{description}</p>
          <p className="mt-7 text-5xl font-black text-raz-dark">{formatNIS(product.price)}</p>
          <button type="button" onClick={() => setShowDonation(true)} className="mt-7 w-full rounded-full bg-raz-teal py-4 text-lg font-black text-white shadow-[0_12px_24px_rgba(0,181,173,.25)]">{lang === "en" ? "Choose to donate" : "אני בוחר לתרום"}</button>
          <p className="mt-3 text-center text-sm font-bold text-slate-500"><Heart className="me-1 inline text-pink-500" size={16} fill="currentColor" />{campaign.donors.toLocaleString()} {lang === "en" ? "people have already donated" : "כבר בחרו לתרום"}</p>
          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5"><Link href={`/organization/${campaign.orgId}`} className="rounded-full border border-raz-teal px-4 py-2 text-sm font-bold text-raz-teal">{lang === "en" ? "About the nonprofit" : "לעמוד העמותה"}</Link><Link href={`/campaign/${campaign.id}`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600">{lang === "en" ? "Campaign page" : "לעמוד הקמפיין"}</Link></div>
        </div>
      </div>
      <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm md:p-10"><p className="text-sm font-bold text-raz-teal">{lang === "en" ? "Campaign progress" : "התקדמות הקמפיין"}</p><h2 className="mt-2 text-3xl font-extrabold text-raz-dark">{campaignTitle}</h2><div className="mt-6 flex items-center justify-between font-bold"><span>{formatNIS(campaign.raised)} {lang === "en" ? "raised" : "גויסו"}</span><span className="text-raz-teal">{progress}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-raz-teal" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-sm text-slate-500">{campaignTargetLabel(campaign, lang)} · {lang === "en" ? `Goal: ${formatNIS(campaign.goal)}` : `יעד: ${formatNIS(campaign.goal)}`}</p><p className="mt-1 text-xs text-slate-400">{campaignTimeRemaining(campaign, lang)}</p></section>
      <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm md:p-10"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-raz-teal">{lang === "en" ? "The nonprofit" : "העמותה"}</p><h2 className="mt-1 text-2xl font-extrabold text-raz-dark">{orgName}</h2></div>{org && <Link href={`/organization/${org.id}`} className="text-sm font-bold text-raz-teal hover:underline">{lang === "en" ? "View page" : "לפרופיל העמותה"}</Link>}</div><p className="mt-5 leading-8 text-slate-600">{lang === "en" ? (org?.description_en ?? org?.description) : org?.description}</p><p className="mt-6 border-t border-slate-100 pt-6 leading-8 text-slate-600">{lang === "en" ? (campaign.storyEn ?? campaign.story) : campaign.story}</p></section>
      {related.length > 0 && <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm md:p-10"><p className="text-sm font-bold text-raz-teal">{lang === "en" ? "More ways to help" : "מוצרים נוספים מאותו קמפיין"}</p><h2 className="mt-2 text-3xl font-extrabold text-raz-dark">{lang === "en" ? "Other relevant products" : "אפשרויות תרומה נוספות"}</h2><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <ProductCard key={item.id} title={lang === "en" ? (item.nameEn ?? item.name) : item.name} price={item.price} emoji={item.emoji} imageUrl={item.imageUrl} videoUrl={item.videoUrl} donationCount={campaign.donors} onOpenDetails={() => router.push(`/product/${item.id}?campaign_id=${campaign.id}`)} onChoose={() => router.push(`/product/${item.id}?campaign_id=${campaign.id}`)} />)}</div></section>}
    </div>
    {showDonation && <LiveProductDonationModal product={detailProduct} otherProducts={[]} onChooseProduct={() => {}} onContinue={() => router.push(`/donate/${campaign.id}/payment?amount=${product.price}&product_id=${product.id}`)} onClose={() => setShowDonation(false)} />}
    <BottomNav variant="donor" />
  </main>;
}
