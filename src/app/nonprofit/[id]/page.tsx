"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import { getOrgById } from "@/lib/supabase/queries";
import { getProductsByIds } from "@/lib/supabase/queries";
import { getCampaignsByOrg } from "@/lib/supabase/queries";
import { formatNIS } from "@/lib/mock-data";
import { Share2, Mail, MessageCircle, BadgeCheck, Calendar, User, Users, MapPin, Phone, Minus, Plus } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import EditableText from "@/components/admin/EditableText";

type Tab = "products" | "about" | "activity";

export default function NonprofitProfile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang, t } = useLang();
  const [org, setOrg] = useState<Awaited<ReturnType<typeof getOrgById>>>(null);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProductsByIds>>>([]);
  const [campaigns, setCampaigns] = useState<Awaited<ReturnType<typeof getCampaignsByOrg>>>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("products");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [useCustom, setUseCustom] = useState(false);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (!id) return;
    getOrgById(id).then(async (o) => {
      setOrg(o);
      const orgCampaigns = await getCampaignsByOrg(id);
      setCampaigns(orgCampaigns);
      const ids = Array.from(new Set(orgCampaigns.flatMap((c) => c.productIds))).slice(0, 3);
      if (ids.length) {
        const p = await getProductsByIds(ids);
        setProducts(p);
        setQty(Object.fromEntries(p.map((prod) => [prod.id, 1])));
      }
      setLoading(false);
    });
  }, [id]);

  const targetCampaignId = useMemo(() => campaigns[0]?.id, [campaigns]);

  const productsTotal = products.reduce((sum, p) => sum + p.price * (qty[p.id] ?? 0), 0);
  const total = useCustom ? (parseInt(custom) || 0) : productsTotal;

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-raz-surface">
      <div className="max-w-5xl mx-auto w-full px-6 py-6">
        <div className="bg-white rounded-2xl h-96 animate-pulse" />
      </div>
    </div>
  );

  if (!org) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <EditableText tKey="org.notFound" as="p" className="text-gray-500 text-lg" />
      <Link href="/" className="text-raz-teal font-medium">{lang === "en" ? "Back home" : "חזרה לדף הבית"}</Link>
    </div>
  );

  const orgName = lang === "en" ? (org.nameEn ?? org.name) : org.name;
  const hasExtra = "bio" in org;
  const bio = hasExtra ? (lang === "en" ? (org as { bioEn?: string }).bioEn : (org as { bio?: string }).bio) : undefined;
  const founded = hasExtra ? (lang === "en" ? (org as { foundedEn?: string }).foundedEn : (org as { founded?: string }).founded) : undefined;
  const ceo = hasExtra ? (lang === "en" ? (org as { ceoEn?: string }).ceoEn : (org as { ceo?: string }).ceo) : undefined;
  const volunteers = hasExtra ? (org as { volunteers?: number }).volunteers : undefined;
  const address = hasExtra ? (lang === "en" ? (org as { addressEn?: string }).addressEn : (org as { address?: string }).address) : undefined;
  const phone = hasExtra ? (org as { phone?: string }).phone : undefined;
  const videoGradient = hasExtra ? (org as { videoGradient?: string }).videoGradient ?? "from-gray-700 to-gray-900" : "from-gray-700 to-gray-900";

  function changeQty(productId: string, delta: number) {
    setQty((prev) => ({ ...prev, [productId]: Math.max(0, (prev[productId] ?? 0) + delta) }));
  }

  function handleDonate() {
    if (!targetCampaignId || total <= 0) return;
    router.push(`/donate/${targetCampaignId}/payment?amount=${total}`);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "products", label: t("org.tabProducts") },
    { id: "about", label: t("org.tabAbout") },
    { id: "activity", label: t("org.tabActivity") },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-raz-surface">
      <div className="max-w-5xl mx-auto w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left in reading order / visually right in RTL: video + public org info */}
          <div className="flex flex-col gap-4">
            <div className={`bg-gradient-to-br ${videoGradient} rounded-2xl aspect-video flex items-center justify-center relative`}>
              <button className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/35 transition-colors">
                <span className="text-2xl">▶</span>
              </button>
            </div>
            <div className="bg-white rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                  style={{ backgroundColor: org.color ?? "#00B5AD" }}
                >
                  {org.initials}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{orgName}</p>
                  {org.verified && (
                    <span className="inline-flex items-center gap-1 text-raz-teal text-xs font-medium mt-0.5">
                      <BadgeCheck size={14} /> <EditableText tKey="campaign.orgVerified" />
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {founded && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar size={15} className="text-raz-teal flex-shrink-0" />
                    <span><EditableText tKey="org.founded" />: {founded}</span>
                  </div>
                )}
                {ceo && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <User size={15} className="text-raz-teal flex-shrink-0" />
                    <span><EditableText tKey="org.ceo" />: {ceo}</span>
                  </div>
                )}
                {volunteers !== undefined && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users size={15} className="text-raz-teal flex-shrink-0" />
                    <span><EditableText tKey="org.volunteers" />: {volunteers}</span>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone size={15} className="text-raz-teal flex-shrink-0" />
                    <span dir="ltr">{phone}</span>
                  </div>
                )}
                {address && (
                  <div className="flex items-center gap-2 text-gray-500 col-span-2">
                    <MapPin size={15} className="text-raz-teal flex-shrink-0" />
                    <span>{address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right in reading order: share, name, description, tabs, products, donate */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-gray-400">
              <button className="hover:text-raz-teal"><Mail size={18} /></button>
              <button className="hover:text-raz-teal"><MessageCircle size={18} /></button>
              <button className="hover:text-raz-teal"><Share2 size={18} /></button>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{orgName}</h1>
            {bio && <p className="text-gray-600 text-sm leading-relaxed">{bio}</p>}

            <div className="flex gap-1 border-b border-gray-100">
              {tabs.map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className={`px-3 py-2.5 text-sm font-bold rounded-t-lg transition-colors ${
                    tab === tb.id ? "text-raz-teal border-b-2 border-raz-teal" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            {tab === "products" && (
              <>
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {products.map((p) => {
                      const q = qty[p.id] ?? 0;
                      return (
                        <div key={p.id} className="bg-white rounded-2xl p-3 flex flex-col items-center text-center">
                          <span className="text-3xl mb-2">{p.emoji}</span>
                          <p className="font-bold text-gray-800 text-xs mb-2 leading-snug">
                            {lang === "en" ? (p.nameEn ?? p.name) : p.name}
                          </p>
                          <p className="font-bold text-raz-teal font-numeric mb-2">{formatNIS(p.price * Math.max(q, 1))}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={() => changeQty(p.id, -1)}
                              className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-numeric font-bold text-gray-800 w-5 text-center">{q}</span>
                            <button
                              onClick={() => changeQty(p.id, 1)}
                              className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EditableText tKey="org.activityEmpty" as="p" className="text-gray-400 text-sm" />
                )}

                <div className="bg-white rounded-2xl p-4 mt-1">
                  <button
                    onClick={() => setUseCustom((v) => !v)}
                    className="text-xs text-raz-teal font-medium mb-2"
                  >
                    {useCustom ? <EditableText tKey="org.selectAmountAbove" /> : <EditableText tKey="org.customAmount" />}
                  </button>
                  {useCustom ? (
                    <div className="flex items-center border-2 border-gray-100 rounded-xl px-4 py-2 mb-3">
                      <span className="text-gray-700 font-bold">₪</span>
                      <input
                        type="number"
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                        className="flex-1 outline-none text-end font-bold text-lg font-numeric bg-transparent"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-3">
                      <EditableText tKey="org.total" className="text-sm text-gray-500" />
                      <span className="text-2xl font-bold text-gray-800 font-numeric">{formatNIS(total)}</span>
                    </div>
                  )}
                  <button
                    onClick={handleDonate}
                    disabled={total <= 0 || !targetCampaignId}
                    className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all ${
                      total > 0 && targetCampaignId ? "bg-raz-teal text-white hover:bg-raz-teal-dark" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <EditableText tKey="org.donateNow" />
                  </button>
                </div>
              </>
            )}

            {tab === "about" && (
              <div className="bg-white rounded-2xl p-5">
                <p className="text-gray-600 leading-relaxed" dir={lang === "en" ? "ltr" : "rtl"}>
                  {bio ?? <EditableText tKey="org.activityEmpty" />}
                </p>
              </div>
            )}

            {tab === "activity" && (
              <div className="bg-white rounded-2xl p-5">
                <EditableText tKey="org.activityEmpty" as="p" className="text-gray-400 text-sm" />
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav variant="donor" />
    </div>
  );
}
