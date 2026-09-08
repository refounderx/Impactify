"use client";

import Image from "next/image";
import { BadgeCheck, Play } from "lucide-react";
import type { getPublicCampaignsByOrg } from "@/lib/supabase/queries";

type Campaign = Awaited<ReturnType<typeof getPublicCampaignsByOrg>>[number];
type Props = {
  organization: { id: string; initials: string; color: string; verified: boolean; name: string; nameEn?: string; logo_url?: string; founded?: string; foundedEn?: string; ceo?: string; ceoEn?: string; volunteers?: number; address?: string; addressEn?: string; phone?: string };
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
          <div className="relative flex min-h-[18rem] flex-col justify-between p-6 text-white sm:min-h-[24rem] sm:p-8">
            <div className="flex items-center gap-3"><span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-white text-lg font-black shadow-lg" style={{ color: organization.color }}>{organization.initials}</span><span className="text-sm font-bold">{orgName}</span></div>
            {campaign.videoUrl && <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/80 bg-raz-dark/35 text-white backdrop-blur-sm"><Play size={34} fill="currentColor" /></span>}
            <div><p className="text-sm font-bold text-white/80">{isEnglish ? "Current campaign" : "הקמפיין הפעיל"}</p><p className="mt-1 text-xl font-extrabold leading-tight sm:text-3xl">{title}</p></div>
          </div>
        </div>
      </section>
      <section className="mt-6 rounded-[1.5rem] border bg-white p-5 shadow-sm sm:p-6" style={{ borderColor: organization.color }}>
        <div className="flex items-center gap-4"><span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-2xl font-black shadow-md" style={{ color: organization.color }}>{organization.logo_url ? <Image src={organization.logo_url} alt={orgName} width={80} height={80} className="h-full w-full object-cover" /> : organization.initials}</span><div><h2 className="text-xl font-extrabold text-raz-dark">{orgName}</h2>{organization.verified && <p className="mt-1 text-xs font-bold text-raz-teal"><BadgeCheck className="me-1 inline" size={15} />{isEnglish ? "Verified nonprofit" : "עמותה מאומתת"}</p>}</div></div>
        <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">{organization.founded && <Detail label={isEnglish ? "Founded" : "נוסדה"} value={isEnglish ? (organization.foundedEn ?? organization.founded) : organization.founded} />}{organization.ceo && <Detail label={isEnglish ? "CEO" : "מנכ״ל/ית"} value={isEnglish ? (organization.ceoEn ?? organization.ceo) : organization.ceo} />}{organization.volunteers !== undefined && <Detail label={isEnglish ? "Volunteers" : "מתנדבים"} value={organization.volunteers.toLocaleString()} />}{organization.address && <Detail label={isEnglish ? "Address" : "כתובת"} value={isEnglish ? (organization.addressEn ?? organization.address) : organization.address} />}{organization.phone && <Detail label={isEnglish ? "Phone" : "טלפון"} value={organization.phone} />}</dl>
      </section>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="flex items-baseline justify-between gap-3"><dt className="text-slate-400">{label}</dt><dd className="text-end font-bold text-slate-700">{value}</dd></div>; }
