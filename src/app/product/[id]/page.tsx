"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Heart, Play } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import LiveProductDonationModal from "@/components/landing/LiveProductDonationModal";
import ProductCard from "@/components/landing/ProductCard";
import { useLang } from "@/contexts/LanguageContext";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { getCampaignVideoSource } from "@/lib/campaign-media";
import { campaignTargetLabel, campaignTimeRemaining } from "@/lib/campaign-target";
import { formatNIS, percent } from "@/lib/mock-data";
import { getCampaignById, getCampaignProductProgress, getProductProgress, getProductsByIds, type DiscoverableProduct } from "@/lib/supabase/queries";
import { getOrgById } from "@/lib/supabase/queries-orgs";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const campaignId = useSearchParams().get("campaign_id");
  const { lang } = useLang();
  const { preferences, openPreferences } = useCookieConsent();
  const [product, setProduct] = useState<Awaited<ReturnType<typeof getProductsByIds>>[number] | null>(null);
  const [campaign, setCampaign] = useState<Awaited<ReturnType<typeof getCampaignById>>>(null);
  const [directOrg, setDirectOrg] = useState<Awaited<ReturnType<typeof getOrgById>>>(null);
  const [related, setRelated] = useState<Awaited<ReturnType<typeof getProductsByIds>>>([]);
  const [showDonation, setShowDonation] = useState(false);
  const [globalProgress, setGlobalProgress] = useState<Awaited<ReturnType<typeof getProductProgress>>>(null);
  const [campaignProductProgress, setCampaignProductProgress] = useState<Awaited<ReturnType<typeof getCampaignProductProgress>>>(null);

  useEffect(() => {
    if (!id) return;
    void Promise.all([getProductsByIds([id]), getProductProgress(id), campaignId ? getCampaignById(campaignId) : Promise.resolve(null)]).then(async ([products, currentGlobalProgress, currentCampaign]) => {
      setProduct(products[0] ?? null);
      setGlobalProgress(currentGlobalProgress);
      setCampaign(currentCampaign);
      setCampaignProductProgress(currentCampaign ? await getCampaignProductProgress(currentCampaign.id, id) : null);
      if (!currentCampaign && products[0]?.orgId) setDirectOrg(await getOrgById(products[0].orgId));
      if (currentCampaign?.productIds?.length) setRelated(await getProductsByIds(currentCampaign.productIds.filter((productId) => productId !== id)));
    });
  }, [id, campaignId]);

  if (!product || (campaignId && !campaign)) return <main className="min-h-screen bg-raz-surface px-6 py-16"><div className="mx-auto h-96 max-w-5xl animate-pulse rounded-3xl bg-white" /></main>;
  const title = lang === "en" ? (product.nameEn ?? product.name) : product.name;
  const description = lang === "en" ? (product.descriptionEn ?? product.description) : product.description;
  const campaignTitle = campaign && (lang === "en" ? (campaign.titleEn ?? campaign.title) : campaign.title);
  const org = campaign?._org ?? directOrg;
  const orgName = lang === "en" ? ((org as { name_en?: string; nameEn?: string; name?: string } | null)?.name_en ?? (org as { nameEn?: string } | null)?.nameEn ?? org?.name) : org?.name;
  const brandColor = org?.color ?? "#00B5AD";
  const video = getCampaignVideoSource(product.videoUrl);
  const progress = campaign ? percent(campaign.raised, campaign.goal) : 0;
  const globalTarget = product.globalTargetQuantity;
  const globalQuantity = globalProgress?.donatedQuantity ?? 0;
  const globalProgressPercent = percent(globalQuantity, globalTarget);
  const globalTargetLabel = campaignTargetLabel({ goalType: globalProgress?.goalType ?? product.globalTargetGoalType, periodEnd: globalProgress?.periodEnd ?? product.globalTargetEndDate }, lang);
  const globalTimeRemaining = campaignTimeRemaining({ goalType: globalProgress?.goalType ?? product.globalTargetGoalType, periodEnd: globalProgress?.periodEnd ?? product.globalTargetEndDate }, lang);
  const currentCampaignQuantity = campaignProductProgress?.donatedQuantity ?? 0;
  const currentCampaignTarget = campaignProductProgress?.requiredQuantity ?? 0;
  const campaignProductPercent = currentCampaignTarget ? percent(currentCampaignQuantity, currentCampaignTarget) : 0;
  const detailProduct: DiscoverableProduct = { productId: product.id, campaignId: campaign?.id ?? "", category: campaign?.category ?? "product", name: product.name, nameEn: product.nameEn, description: product.description, descriptionEn: product.descriptionEn, price: product.price, emoji: product.emoji, imageUrl: product.imageUrl, videoUrl: product.videoUrl, donationCount: campaign?.donors ?? 0 };

  return <main className="min-h-screen bg-raz-surface pb-24" dir={lang === "en" ? "ltr" : "rtl"}>
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <button type="button" onClick={() => router.back()} className="interactive-control group inline-flex min-h-11 items-center gap-2 rounded-full border border-raz-teal/20 bg-white px-4 text-sm font-bold text-raz-teal shadow-sm transition-all hover:-translate-y-0.5 hover:border-raz-teal hover:bg-raz-teal/5 hover:shadow-md" aria-label={lang === "en" ? "Back" : "חזרה"}>
        {lang === "en" ? <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5" /> : <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />}
        {lang === "en" ? "Back" : "חזרה"}
      </button>
      <div className="mt-6 grid gap-8 rounded-[2rem] bg-white p-6 shadow-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] md:p-10">
        <div className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-3xl bg-slate-50">
          {video?.kind === "embed" && preferences.marketing ? <iframe src={video.url} title={title} className="absolute inset-0 h-full w-full bg-black" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            : video?.kind === "video" ? <video src={video.url} controls playsInline className="absolute inset-0 h-full w-full bg-black object-contain" />
              : product.imageUrl ? <Image src={product.imageUrl} alt={title} fill className="object-contain p-8" sizes="(max-width: 768px) 100vw, 45vw" />
                : <span className="text-8xl">{product.emoji}</span>}
          {video?.kind === "embed" && !preferences.marketing && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-raz-dark px-6 text-center text-white"><Play size={40} /><p className="font-bold">{lang === "en" ? "Approve marketing cookies to play this video here." : "יש לאשר עוגיות שיווק כדי לנגן את הסרטון כאן."}</p><button type="button" onClick={openPreferences} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-raz-teal">{lang === "en" ? "Cookie settings" : "ניהול הגדרות עוגיות"}</button></div>}
        </div>
        <div className="flex flex-col justify-center">
          {org && <Link href={`/organization/${org.id}`} className="inline-flex w-fit items-center gap-2 text-sm font-bold hover:underline" style={{ color: brandColor }}><Building2 size={17} />{orgName}</Link>}
          <h1 className="mt-4 text-4xl leading-tight text-raz-dark md:text-5xl">{title}</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{description}</p>
          <p className="mt-7 text-5xl font-black text-raz-dark">{formatNIS(product.price)}</p>
          <button type="button" onClick={() => setShowDonation(true)} className="mt-7 w-full rounded-full py-4 text-lg font-black text-white shadow-[0_12px_24px_rgba(0,181,173,.25)]" style={{ backgroundColor: brandColor }}>{lang === "en" ? "Choose to donate" : "אני בוחר לתרום"}</button>
          <p className="mt-3 text-center text-sm font-bold text-slate-500"><Heart className="me-1 inline text-pink-500" size={16} fill="currentColor" />{(campaign?.donors ?? globalProgress?.donorsCount ?? 0).toLocaleString()} {lang === "en" ? "people have already donated" : "כבר בחרו לתרום"}</p>
          {org && <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5"><Link href={`/organization/${org.id}`} className="rounded-full border px-4 py-2 text-sm font-bold" style={{ borderColor: brandColor, color: brandColor }}>{lang === "en" ? "About the nonprofit" : "לעמוד העמותה"}</Link></div>}
        </div>
      </div>
      {campaign && <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm md:p-10"><p className="text-sm font-bold text-raz-teal">{lang === "en" ? "This product in the campaign" : "המוצר הזה בקמפיין"}</p><h2 className="mt-2 text-3xl font-extrabold text-raz-dark">{campaignTitle}</h2><div className="mt-6 flex items-center justify-between font-bold"><span>{currentCampaignQuantity.toLocaleString()} {lang === "en" ? "units donated" : "יחידות נתרמו"}</span><span className="text-raz-teal">{campaignProductPercent}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-raz-teal" style={{ width: `${campaignProductPercent}%` }} /></div><p className="mt-2 text-sm text-slate-500">{lang === "en" ? `Campaign target: ${currentCampaignTarget.toLocaleString()} units` : `יעד המוצר בקמפיין: ${currentCampaignTarget.toLocaleString()} יחידות`}</p><div className="mt-7 border-t border-slate-100 pt-5"><div className="flex items-center justify-between font-bold"><span>{formatNIS(campaign.raised)} {lang === "en" ? "raised in campaign" : "גויסו בקמפיין"}</span><span className="text-raz-teal">{progress}%</span></div><p className="mt-2 text-xs text-slate-400">{campaignTargetLabel(campaign, lang)} · {campaignTimeRemaining(campaign, lang)}</p></div></section>}
      {!campaign && <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm md:p-10"><p className="text-sm font-bold" style={{ color: brandColor }}>{lang === "en" ? "Product progress" : "התקדמות המוצר"}</p><div className="mt-4 flex items-center justify-between font-bold"><span>{globalQuantity.toLocaleString()} {lang === "en" ? "units donated" : "יחידות נתרמו"}</span><span style={{ color: brandColor }}>{globalProgressPercent}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${globalProgressPercent}%`, backgroundColor: brandColor }} /></div><p className="mt-2 text-sm text-slate-500">{globalTargetLabel} · {lang === "en" ? `${globalTarget.toLocaleString()} units` : `${globalTarget.toLocaleString()} יחידות`}</p><p className="mt-1 text-xs text-slate-400">{globalTimeRemaining}</p></section>}
      {!campaign && org && <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm md:p-10"><p className="text-sm font-bold" style={{ color: brandColor }}>{lang === "en" ? "The nonprofit" : "העמותה"}</p><h2 className="mt-2 text-3xl font-extrabold text-raz-dark">{orgName}</h2><p className="mt-4 leading-8 text-slate-600">{lang === "en" ? ((org as { bioEn?: string; description_en?: string } | null)?.bioEn ?? (org as { description_en?: string } | null)?.description_en) : ((org as { bio?: string; description?: string } | null)?.bio ?? (org as { description?: string } | null)?.description)}</p><Link href={`/organization/${org.id}`} className="mt-5 inline-flex text-sm font-bold hover:underline" style={{ color: brandColor }}>{lang === "en" ? "Visit the nonprofit" : "לביקור בעמוד העמותה"}</Link></section>}
      {campaign && <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm md:p-10"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-raz-teal">{lang === "en" ? "The nonprofit" : "העמותה"}</p><h2 className="mt-1 text-2xl font-extrabold text-raz-dark">{orgName}</h2></div>{org && <Link href={`/organization/${org.id}`} className="text-sm font-bold text-raz-teal hover:underline">{lang === "en" ? "View page" : "לפרופיל העמותה"}</Link>}</div><p className="mt-5 leading-8 text-slate-600">{lang === "en" ? ((org as { description_en?: string; bioEn?: string } | null)?.description_en ?? (org as { bioEn?: string } | null)?.bioEn) : ((org as { description?: string; bio?: string } | null)?.description ?? (org as { bio?: string } | null)?.bio)}</p><p className="mt-6 border-t border-slate-100 pt-6 leading-8 text-slate-600">{lang === "en" ? (campaign.storyEn ?? campaign.story) : campaign.story}</p></section>}
      {campaign && related.length > 0 && <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm md:p-10"><p className="text-sm font-bold text-raz-teal">{lang === "en" ? "More ways to help" : "מוצרים נוספים מאותו קמפיין"}</p><h2 className="mt-2 text-3xl font-extrabold text-raz-dark">{lang === "en" ? "Other relevant products" : "אפשרויות תרומה נוספות"}</h2><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <ProductCard key={item.id} title={lang === "en" ? (item.nameEn ?? item.name) : item.name} price={item.price} emoji={item.emoji} imageUrl={item.imageUrl} videoUrl={item.videoUrl} donationCount={campaign.donors} onOpenDetails={() => router.push(`/product/${item.id}?campaign_id=${campaign.id}`)} onChoose={() => router.push(`/product/${item.id}?campaign_id=${campaign.id}`)} />)}</div></section>}
    </div>
    {showDonation && <LiveProductDonationModal product={detailProduct} otherProducts={[]} onChooseProduct={() => {}} onContinue={() => router.push(campaign ? `/donate/${campaign.id}/payment?amount=${product.price}&product_id=${product.id}` : `/donate/${product.id}/payment?direct_product=1&amount=${product.price}&product_id=${product.id}`)} onClose={() => setShowDonation(false)} />}
    <BottomNav variant="donor" />
  </main>;
}
