"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import DonateAmountModal from "@/components/campaign/DonateAmountModal";
import ProductBuyCard from "@/components/campaign/ProductBuyCard";
import CampaignTabs from "@/components/campaign/CampaignTabs";
import { getCampaignById, getProductsByIds } from "@/lib/supabase/queries";
import { formatNIS, percent } from "@/lib/mock-data";
import { Share2, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useParams, useRouter } from "next/navigation";
import EditableText from "@/components/admin/EditableText";
import { getCampaignVideoSource } from "@/lib/campaign-media";
import { sharePage } from "@/lib/share";

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang, t } = useLang();
  const [campaign, setCampaign] = useState<Awaited<ReturnType<typeof getCampaignById>>>(null);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProductsByIds>>>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; price: number } | null>(null);
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
    <div className="flex flex-col min-h-screen bg-raz-surface">
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

  return (
    <div className="flex flex-col min-h-screen bg-raz-surface">
      {/* Hero: campaign video/image selected in the campaign wizard */}
      <div className={`bg-gradient-to-br ${campaign.gradient} h-64 md:h-80 flex items-center justify-center relative overflow-visible`}>
        {video?.kind === "embed" ? (
          <iframe
            src={video.url}
            title={title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : video?.kind === "video" ? (
          <video src={video.url} controls playsInline className="absolute inset-0 w-full h-full object-cover bg-black" />
        ) : campaign.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- public Supabase URLs are configured at runtime.
          <img src={campaign.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="text-8xl md:text-9xl opacity-40">{campaign.emoji}</span>
        )}
        <button type="button" onClick={() => router.back()} className="micro-hint micro-hint-below absolute top-4 start-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm" aria-label={t("hint.back")}>
          <ArrowRight size={20} />
        </button>
        <button type="button" onClick={() => void sharePage(title).then((result) => setShareNotice(result === "copied" ? (lang === "en" ? "Link copied" : "הקישור הועתק") : ""))} className="micro-hint micro-hint-below absolute top-4 end-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm" aria-label={t("hint.share")}>
          <Share2 size={20} />
        </button>
        {shareNotice && <span role="status" className="absolute end-4 top-14 rounded-full bg-white px-3 py-1 text-xs font-bold text-raz-dark">{shareNotice}</span>}
        {/* Organization logo, or initials only when no logo has been uploaded. */}
        <div
          className="absolute -bottom-7 start-6 z-10 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white text-lg font-bold text-white shadow-md"
          style={{ backgroundColor: org?.color ?? "#00B5AD" }}
        >
          {org?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- public Supabase logo URL is configured by the NGO.
            <img src={org.logo_url} alt={orgName ?? ""} className="h-full w-full object-cover" />
          ) : org?.initials}
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-6 pt-10 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-gray-600 font-medium">{orgName}</span>
          {org?.verified && (
            <span className="bg-raz-teal/10 text-raz-teal text-xs px-2 py-0.5 rounded-full ms-1"><EditableText tKey="campaign.orgVerified" /></span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 leading-snug mb-6">{title}</h1>

        {/* Progress, set as goal in the campaign wizard */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-gray-800 font-numeric text-lg">{formatNIS(campaign.raised)}</span>
            <span className="font-bold text-raz-teal text-lg">{pct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div className="bg-raz-teal rounded-full h-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm text-gray-400 mt-1.5"><EditableText tKey="campaign.goalLabel" /> {formatNIS(campaign.goal)}</p>
        </div>

        {/* Opens the donation-amount popup */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => { setSelectedProduct(null); setShowModal(true); }}
            className="bg-raz-teal text-white rounded-full px-8 py-3.5 font-bold text-lg hover:bg-raz-teal-dark transition-colors shadow-sm"
          >
            <EditableText tKey="campaign.chooseAmount" />
          </button>
        </div>

        {/* 3 products chosen by the org admin when creating the campaign */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {products.slice(0, 3).map((p, i) => (
              <ProductBuyCard
                key={p.id}
                emoji={p.emoji}
                name={lang === "en" ? (p.nameEn ?? p.name) : p.name}
                description={lang === "en" ? (p.descriptionEn ?? p.description) : p.description}
                price={p.price}
                chosenCount={campaign.donors}
                onBuy={() => { setSelectedProduct({ id: p.id, name: lang === "en" ? (p.nameEn ?? p.name) : p.name, price: p.price }); setShowModal(true); }}
              />
            ))}
          </div>
        )}

        {/* Tabs: donors / communities invited by the org / campaign story / about the org */}
        <CampaignTabs
          campaignId={campaign.id}
          donorsCount={campaign.donors}
          story={story}
          orgBio={orgBio ?? ""}
        />
      </div>

      {showModal && (
        <DonateAmountModal
          campaignId={campaign.id}
          title={title}
          gradient={campaign.gradient}
          emoji={campaign.emoji}
          product={selectedProduct}
          onClose={() => { setShowModal(false); setSelectedProduct(null); }}
        />
      )}

      <BottomNav variant="donor" />
    </div>
  );
}
