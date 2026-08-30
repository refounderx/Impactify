"use client";
import Link from "next/link";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatNIS } from "@/lib/mock-data";
import { useLang } from "@/contexts/LanguageContext";
import type { getCampaigns } from "@/lib/supabase/queries";
import EditableText from "@/components/admin/EditableText";

type Campaign = Awaited<ReturnType<typeof getCampaigns>>[number];

export default function CampaignCard({ campaign }: { campaign: Campaign }) {
  const org = campaign._org;
  const { lang } = useLang();
  const title = lang === "en" ? (campaign.titleEn ?? campaign.title) : campaign.title;
  const orgName = lang === "en" ? (org?.name_en ?? org?.name) : org?.name;

  return (
    <Link
      href={`/campaign/${campaign.id}`}
      className="group block overflow-hidden rounded-[1.5rem] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(15,23,42,0.14)]"
    >
      <div className={`bg-gradient-to-br ${campaign.gradient} flex h-44 items-center justify-center border-b border-slate-100`}>
        <span className="text-7xl transition-transform duration-200 group-hover:scale-110">{campaign.emoji}</span>
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
            style={{ backgroundColor: org?.color }}
          >
            {org?.initials}
          </div>
          <span className="text-xs text-gray-500 truncate">{orgName}</span>
        </div>
        <h3 className="mb-5 min-h-12 text-lg font-extrabold leading-snug text-raz-dark line-clamp-2">{title}</h3>
        <ProgressBar raised={campaign.raised} goal={campaign.goal} size="sm" />
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-gray-500">{campaign.donors} <EditableText tKey="donors" /></span>
          <span className="font-bold text-raz-teal">{formatNIS(campaign.raised)}</span>
        </div>
        {campaign.daysLeft > 0 ? (
          <span className="mt-3 block text-xs font-medium text-gray-400">{campaign.daysLeft} <EditableText tKey="daysLeft" /></span>
        ) : (
          <span className="mt-3 block text-xs font-bold text-raz-success"><EditableText tKey="goalReached" /></span>
        )}
      </div>
    </Link>
  );
}
