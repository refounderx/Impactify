"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import DonateAmountModal from "@/components/campaign/DonateAmountModal";
import ProductCard from "@/components/landing/ProductCard";
import LiveProductDonationModal from "@/components/landing/LiveProductDonationModal";
import CampaignTabs from "@/components/campaign/CampaignTabs";
import { getCampaignById, getProductsByIds, type DiscoverableProduct } from "@/lib/supabase/queries";
import { formatNIS, percent } from "@/lib/mock-data";
import { Share2 } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import EditableText from "@/components/admin/EditableText";
import { getCampaignVideoSource } from "@/lib/campaign-media";
import { sharePage } from "@/lib/share";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { campaignTargetLabel, campaignTimeRemaining } from "@/lib/campaign-target";
import LandingFooter from "@/components/landing/LandingFooter";
import PublicBackButton from "@/components/layout/PublicBackButton";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityId = searchParams.get("community_id") ?? undefined;
  const { lang, t } = useLang();
  const { preferences, openPreferences } = useCookieConsent();
  const [campaign, setCampaign] = useState<Awaited<ReturnType<typeof getCampaignById>>>(null);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProductsByIds>>>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DiscoverableProduct | null>(null);
  const [shareNotice, setShareNotice] = useState("");

  useEffect(() => {
    if (!id) return;
    getCampaignById(id).then(async (c) => {
      setCampaign(c);
      if (c?.productIds?.length) {
        const p = await getProductsByIds(c.productIds);
        setProducts(p);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="bg-gray-200 animate-pulse h-64 md:h-80" />
      <div className="max-w-5xl mx-auto w-full px-6 py-6">
        <div className="bg-white rounded-2xl h-40 animate-pulse mb-4" />
        <div className="bg-white rounded-2xl h-60 animate-pulse" />
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-gray-500 text-lg">קמפיין לא נמצא</p>
      <Link href="/" className="text-raz-teal font-medium">חזרה לדף הבית</Link>
    </div>
  );

  const org = campaign._org;
  const pct = percent(campaign.raised, campaign.goal);
  const title = lang === "en" ? (campaign.titleEn ?? campaign.title) : campaign.title;
  const story = lang === "en" ? (campaign.storyEn ?? campaign.story) : campaign.story;
  const orgName = lang === "en" ? (org?.name_en ?? org?.name) : org?.name;
  const orgBio = lang === "en" ? (org?.description_en ?? "") : (org?.description ?? "");
  const video = getCampaignVideoSource(campaign.videoUrl);
  const campaignProducts: DiscoverableProduct[] = products.map((product) => ({
    productId: product.id,
    campaignId: campaign.id,
    category: campaign.category,
    name: product.name,
    nameEn: product.nameEn,
    description: product.description,
    descriptionEn: product.descriptionEn,
    price: product.price,
    emoji: product.emoji,
    imageUrl: product.imageUrl,
    videoUrl: product.videoUrl,
    donationCount: campaign.donors,
  }));

  function continueWithProduct(product: DiscoverableProduct) {
    const params = new URLSearchParams({ amount: String(product.price), product_id: product.productId });
    if (communityId) params.set("community_id", communityId);
    router.push(`/donate/${product.campaignId}/payment?${params.toString()}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="mx-auto w-full max-w-6xl px-5 pb-12 pt-8 md:w-[90%] md:max-w-[64.8rem] md:px-8 md:pt-12">
      <div className="relative" dir={lang === "en" ? "ltr" : "rtl"}>
      <PublicBackButton />
      {/* The campaign's visual story leads the page; campaign data stays immediately below it. */}
      <div className="relative">
      <div className={`relative flex min-h-[19rem] items-center justify-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br sm:min-h-[24rem] md:min-h-[28rem] ${campaign.gradient}`}>
        {video?.kind === "embed" && preferences.marketing ? (
          <iframe
            src={video.url}
            title={title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : video?.kind === "embed" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-raz-dark/25 px-6 text-center text-white">
            <p className="max-w-md text-sm font-bold leading-6 drop-shadow-sm">
              {lang === "en" ? "This video is hosted by a third party. Approve marketing cookies to load it." : "הסרטון מתארח אצל ספק צד שלישי. יש לאשר עוגיות שיווק כדי להציג אותו."}
            </p>
            <button type="button" onClick={openPreferences} className="interactive-control rounded-xl bg-white px-4 py-2 text-sm font-bold text-raz-teal shadow-sm">
              {lang === "en" ? "Manage cookie settings" : "ניהול הגדרות עוגיות"}
            </button>
          </div>
        ) : video?.kind === "video" ? (
          <video src={video.url} controls playsInline className="absolute inset-0 w-full h-full object-cover bg-black" />
        ) : campaign.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- public Supabase URLs are configured at runtime.
          <img src={campaign.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="text-8xl md:text-9xl opacity-40">{campaign.emoji}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-raz-dark/70 via-raz-dark/10 to-transparent" />
        <div className="absolute inset-x-5 bottom-6 z-10 text-white sm:inset-x-10 sm:bottom-10" dir={lang === "en" ? "ltr" : "rtl"}>
          <p className="mb-2 text-sm font-bold text-white/85 sm:text-base">{orgName}</p>
          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight drop-shadow-sm sm:text-5xl md:text-6xl">{title}</h1>
        </div>
        <button type="button" onClick={() => void sharePage(title).then((result) => setShareNotice(result === "copied" ? (lang === "en" ? "Link copied" : "הקישור הועתק") : ""))} className="micro-hint micro-hint-below absolute end-4 top-4 z-20 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30" aria-label={t("hint.share")}>
          <Share2 size={20} />
        </button>
        {shareNotice && <span role="status" className="absolute end-4 top-14 rounded-full bg-white px-3 py-1 text-xs font-bold text-raz-dark">{shareNotice}</span>}
      </div>
        {/* Organization logo, or initials only when no logo has been uploaded. */}
        <div
          className="absolute -top-6 start-6 z-30 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white text-lg font-bold text-white shadow-md sm:h-20 sm:w-20"
          style={{ backgroundColor: org?.color ?? "#00B5AD" }}
        >
          {org?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- public Supabase logo URL is configured by the NGO.
            <img src={org.logo_url} alt={orgName ?? ""} className="h-full w-full object-cover" />
          ) : org?.initials}
        </div>
      </div>
      </div>

      <section className="mx-auto max-w-5xl px-1 pt-8 md:pt-10" dir={lang === "en" ? "ltr" : "rtl"}>
        {/* Progress, set as goal in the campaign wizard. */}
        <div className="mb-7">
          <div className="mb-3 flex items-end justify-between gap-4">
            <p className="text-sm font-medium text-slate-500"><EditableText tKey="campaign.goalLabel" /> {formatNIS(campaign.goal)}</p>
            <div className="flex items-baseline gap-3 font-numeric" style={{ color: org?.color ?? "#00B5AD" }}>
              <span className="text-2xl font-extrabold sm:text-3xl">{pct}%</span>
              <span className="h-6 w-px bg-current opacity-30" />
              <span className="text-2xl font-extrabold sm:text-3xl">{formatNIS(campaign.raised)}</span>
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: org?.color ?? "#00B5AD" }} />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs sm:text-sm">
            <p className="font-bold" style={{ color: org?.color ?? "#00B5AD" }}>{campaignTargetLabel(campaign, lang)}</p>
            <p className="text-slate-400">{campaignTimeRemaining(campaign, lang)}</p>
          </div>
        </div>

        {/* Opens the donation-amount popup */}
        <div className="mb-10 flex justify-center">
          <button
            onClick={() => { setSelectedProduct(null); setShowModal(true); }}
            className="rounded-full px-9 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: org?.color ?? "#00B5AD" }}
          >
            <EditableText tKey="campaign.chooseAmount" />
          </button>
        </div>

        {/* 3 products chosen by the org admin when creating the campaign */}
        {products.length > 0 && (
          <section className="mx-auto mb-12 max-w-4xl">
            <h2 className="mb-5 text-center text-xl font-extrabold text-raz-dark sm:text-2xl">{lang === "en" ? "Choose the impact you want to make" : "בחרו את התרומה שתרצו לאפשר"}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {campaignProducts.slice(0, 3).map((p) => (
              <ProductCard
                key={p.productId}
                emoji={p.emoji}
                imageUrl={p.imageUrl}
                videoUrl={p.videoUrl}
                donationCount={p.donationCount}
                onOpenDetails={() => router.push(`/product/${p.productId}?campaign_id=${p.campaignId}`)}
                title={lang === "en" ? (p.nameEn ?? p.name) : p.name}
                price={p.price}
                onChoose={() => setSelectedProduct(p)}
              />
            ))}
          </div>
          </section>
        )}

        {/* Tabs: donors / communities invited by the org / campaign story / about the org */}
        <section className="rounded-[1.75rem] bg-slate-50 p-3 sm:p-6">
        <CampaignTabs
          campaignId={campaign.id}
          story={story}
          orgBio={orgBio ?? ""}
        />
        </section>
      </section>
      </main>

      {showModal && !selectedProduct && (
        <DonateAmountModal
          campaignId={campaign.id}
          title={title}
          gradient={campaign.gradient}
          emoji={campaign.emoji}
          communityId={communityId}
          product={null}
          onClose={() => { setShowModal(false); setSelectedProduct(null); }}
        />
      )}
      {selectedProduct && <LiveProductDonationModal product={selectedProduct} otherProducts={campaignProducts.filter((product) => product.productId !== selectedProduct.productId)} onChooseProduct={setSelectedProduct} onContinue={() => continueWithProduct(selectedProduct)} onClose={() => setSelectedProduct(null)} />}

      <LandingFooter />
      <BottomNav variant="donor" />
    </div>
  );
}
