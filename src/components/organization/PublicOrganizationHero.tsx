"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import { campaignTargetLabel } from "@/lib/campaign-target";
import { formatNIS } from "@/lib/mock-data";
import type { getPublicCampaignsByOrg } from "@/lib/supabase/queries";

type Campaign = Awaited<ReturnType<typeof getPublicCampaignsByOrg>>[number];
type Props = {
  organization: { id: string; initials: string; color: string; verified: boolean; name: string; nameEn?: string };
  campaign: Campaign;
  lang: "he" | "en";
};

export default function PublicOrganizationHero({ organization, campaign, lang }: Props) {
  const isEnglish = lang === "en";
  const orgName = isEnglish ? (organization.nameEn ?? organization.name) : organization.name;
  const title = isEnglish ? (campaign.titleEn ?? campaign.title) : campaign.title;

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_42px_rgba(15,23,42,.08)]">
        <div className="relative min-h-[18rem] overflow-hidden bg-raz-dark sm:min-h-[24rem]">
          {campaign.heroImageUrl && <Image src={campaign.heroImageUrl} alt="" fill priority className="object-cover opacity-70" sizes="(max-width: 768px) 100vw, 1200px" />}
          <div className={`absolute inset-0 bg-gradient-to-t ${campaign.heroImageUrl ? "from-raz-dark via-raz-dark/45" : campaign.gradient}`} />
          <div className="relative flex min-h-[18rem] flex-col justify-end p-6 text-white sm:min-h-[24rem] sm:p-10">
            <div className="mb-auto flex items-center gap-3"><span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-white text-lg font-black shadow-lg" style={{ color: organization.color }}>{organization.initials}</span><span className="text-sm font-bold">{orgName}</span></div>
            <p className="text-sm font-bold text-white/80">{isEnglish ? "Current campaign" : "הקמפיין הפעיל"}</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">{title}</h1>
          </div>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-end sm:p-8">
          <div><div className="flex flex-wrap items-baseline justify-between gap-3"><span className="text-3xl font-extrabold text-raz-dark">{formatNIS(campaign.raised)}</span><span className="font-bold" style={{ color: organization.color }}>{Math.min(100, Math.round((campaign.raised / campaign.goal) * 100))}%</span></div><div className="mt-3"><ProgressBar raised={campaign.raised} goal={campaign.goal} /></div><p className="mt-2 text-sm text-slate-500">{campaignTargetLabel(campaign, lang)}</p></div>
          <Link href={`/campaign/${campaign.id}`} className="interactive-control inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: organization.color }}>{isEnglish ? "Campaign page" : "לעמוד הקמפיין"}</Link>
        </div>
      </section>
      {organization.verified && <p className="mt-6 text-center text-xs font-bold text-raz-teal"><BadgeCheck className="me-1 inline" size={16} />{isEnglish ? "Verified nonprofit" : "עמותה מאומתת"}</p>}
    </>
  );
}
