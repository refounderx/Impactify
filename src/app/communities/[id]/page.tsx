"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import PublicCommunityHero from "@/components/community/PublicCommunityHero";
import PublicCommunityProfileTabs from "@/components/community/PublicCommunityProfileTabs";
import { useLang } from "@/contexts/LanguageContext";
import { getPublicCommunityById, getPublicCommunityCampaigns } from "@/lib/supabase/queries";
import PublicBackButton from "@/components/layout/PublicBackButton";

export default function PublicCommunityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLang();
  const [community, setCommunity] = useState<Awaited<ReturnType<typeof getPublicCommunityById>>>(null);
  const [campaigns, setCampaigns] = useState<Awaited<ReturnType<typeof getPublicCommunityCampaigns>>>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    void Promise.all([getPublicCommunityById(id), getPublicCommunityCampaigns(id)]).then(([item, activeCampaigns]) => { setCommunity(item); setCampaigns(activeCampaigns); setLoaded(true); });
  }, [id]);

  if (!loaded) return <main className="min-h-screen bg-raz-surface px-6 py-16"><div className="mx-auto h-[36rem] max-w-6xl animate-pulse rounded-[2rem] bg-white" /></main>;
  if (!community) return <main className="min-h-screen bg-raz-surface px-6 py-16 text-center" dir={lang === "en" ? "ltr" : "rtl"}><h1 className="text-3xl font-extrabold text-raz-dark">{lang === "en" ? "Community not found" : "הקהילה לא נמצאה"}</h1><button type="button" onClick={() => router.push("/")} className="mt-5 rounded-full bg-raz-teal px-5 py-3 text-sm font-bold text-white">{lang === "en" ? "Back home" : "חזרה לדף הבית"}</button></main>;
  const name = lang === "en" ? (community.name_en ?? community.name) : community.name;

  return <main className="min-h-screen bg-white pb-24" dir={lang === "en" ? "ltr" : "rtl"}>
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <div className="relative">
      <PublicBackButton />
      <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr]" dir="ltr"><section dir={lang === "en" ? "ltr" : "rtl"} className="min-w-0"><p className="text-sm font-bold" style={{ color: community.color }}>{lang === "en" ? "Community profile" : "פרופיל קהילה"}</p><h1 className="mt-2 text-4xl font-extrabold leading-tight text-raz-dark sm:text-5xl">{name}</h1><p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">{lang === "en" ? "A community built around shared giving and measurable impact." : "קהילה שנבנתה סביב נתינה משותפת והשפעה שאפשר לראות."}</p><PublicCommunityProfileTabs community={community} campaigns={campaigns} lang={lang} /></section><aside className="min-w-0" dir={lang === "en" ? "ltr" : "rtl"}><PublicCommunityHero community={community} campaign={campaigns[0]} lang={lang} /></aside></div>
      </div>
    </div>
    <BottomNav variant="donor" />
  </main>;
}
