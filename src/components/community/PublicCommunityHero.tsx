"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import type { Campaign, Community } from "@/lib/supabase/types";

type Props = { community: Community; campaign: Campaign | undefined; lang: "he" | "en" };

export default function PublicCommunityHero({ community, campaign, lang }: Props) {
  const isEnglish = lang === "en";
  const name = isEnglish ? (community.name_en ?? community.name) : community.name;
  const campaignTitle = campaign && (isEnglish ? (campaign.title_en ?? campaign.title) : campaign.title);

  return <section className="overflow-hidden rounded-[2rem] bg-raz-dark shadow-[0_18px_42px_rgba(15,23,42,.10)]">
    <div className="relative min-h-[20rem] overflow-hidden sm:min-h-[27rem]">
      {campaign?.hero_image_url && <Image src={campaign.hero_image_url} alt="" fill priority className="object-cover opacity-70" sizes="(max-width: 1024px) 100vw, 48vw" />}
      <div className="absolute inset-0" style={{ background: campaign?.hero_image_url ? "linear-gradient(to top, rgba(15,23,42,.88), rgba(15,23,42,.14))" : `linear-gradient(135deg, ${community.color}, #172033)` }} />
      <div className="relative flex min-h-[20rem] flex-col justify-between p-6 text-white sm:min-h-[27rem] sm:p-8">
        <div className="flex items-center gap-3"><span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-white text-xl font-black shadow-lg" style={{ color: community.color }}>{name.slice(0, 1)}</span><span className="text-sm font-bold">{name}</span></div>
        {campaign?.video_url && <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/80 bg-raz-dark/35 text-white backdrop-blur-sm"><Play size={34} fill="currentColor" /></span>}
        <div>{campaignTitle ? <><p className="text-sm font-bold text-white/80">{isEnglish ? "Latest community activity" : "הפעילות האחרונה בקהילה"}</p><p className="mt-1 text-xl font-extrabold leading-tight sm:text-3xl">{campaignTitle}</p></> : <p className="text-2xl font-extrabold sm:text-4xl">{isEnglish ? "Community with impact" : "קהילה שמניעה שינוי"}</p>}</div>
      </div>
    </div>
  </section>;
}
