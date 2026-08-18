"use client";
import Link from "next/link";
import ProgressBar from "@/components/ui/ProgressBar";
import { getOrg, formatNIS, percent } from "@/lib/mock-data";
import { useLang } from "@/contexts/LanguageContext";
import type { campaigns } from "@/lib/mock-data";

type Campaign = (typeof campaigns)[number];

export default function CampaignCard({ campaign }: { campaign: Campaign }) {
  const org = getOrg(campaign.orgId);
  const pct = percent(campaign.raised, campaign.goal);
  const { lang, t } = useLang();
  const title = lang === "en" ? (campaign.titleEn ?? campaign.title) : campaign.title;
  const orgName = lang === "en" ? (org?.nameEn ?? org?.name) : org?.name;

  return (
    <Link
      href={`/campaign/${campaign.id}`}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow block"
    >
      <div className={`bg-gradient-to-br ${campaign.gradient} h-32 flex items-center justify-center`}>
        <span className="text-5xl">{campaign.emoji}</span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
            style={{ backgroundColor: org?.color }}
          >
            {org?.initials}
          </div>
          <span className="text-xs text-gray-500 truncate">{orgName}</span>
        </div>
        <h3 className="font-bold text-sm text-gray-800 leading-snug mb-2 line-clamp-2">{title}</h3>
        <ProgressBar raised={campaign.raised} goal={campaign.goal} size="sm" />
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-gray-500">{campaign.donors} {t("donors")}</span>
          <span className="font-bold text-raz-teal">{formatNIS(campaign.raised)}</span>
        </div>
        {campaign.daysLeft > 0 ? (
          <span className="text-[11px] text-gray-400">{campaign.daysLeft} {t("daysLeft")}</span>
        ) : (
          <span className="text-[11px] text-raz-success font-medium">{t("goalReached")}</span>
        )}
      </div>
    </Link>
  );
}
