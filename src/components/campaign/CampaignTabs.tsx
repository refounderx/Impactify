"use client";
import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { getCampaignDonors, getCampaignCommunities, formatNIS } from "@/lib/mock-data";

type Tab = "donors" | "communities" | "story" | "org";

interface CampaignTabsProps {
  campaignId: string;
  donorsCount: number;
  story: string;
  orgBio: string;
}

export default function CampaignTabs({ campaignId, donorsCount, story, orgBio }: CampaignTabsProps) {
  const { lang, t } = useLang();
  const [tab, setTab] = useState<Tab>("donors");
  const donors = getCampaignDonors(campaignId, Math.min(donorsCount, 9) || 9);
  const communities = getCampaignCommunities(campaignId);

  const tabs: { id: Tab; label: string }[] = [
    { id: "donors", label: t("campaign.tabDonors") },
    { id: "communities", label: t("campaign.tabCommunities") },
    { id: "story", label: t("campaign.tabStory") },
    { id: "org", label: t("campaign.tabOrg") },
  ];

  return (
    <div className="bg-white rounded-2xl p-5">
      <div className="flex flex-wrap gap-1 border-b border-gray-100 mb-4 -mx-1">
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

      {tab === "donors" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {donors.map((d) => (
            <div key={d.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-9 h-9 rounded-full bg-raz-teal/15 flex items-center justify-center text-raz-teal font-bold text-sm flex-shrink-0">
                {d.anonymous ? "?" : d.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-gray-800 text-sm truncate">
                    {d.anonymous ? (lang === "en" ? "Anonymous" : "אלמוני") : d.name}
                  </span>
                  <span className="font-bold text-raz-teal text-sm font-numeric">{formatNIS(d.amount)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{lang === "en" ? d.dateEn : d.date}</p>
                <p className="text-xs text-gray-500 mt-1 leading-snug">{lang === "en" ? d.messageEn : d.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "communities" && (
        communities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {communities.map((c) => (
              <div key={c.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <span className="text-2xl">{c.emoji}</span>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{lang === "en" ? c.nameEn : c.name}</p>
                  <p className="text-xs text-gray-500">{c.members} {lang === "en" ? "members" : "חברים"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">{t("campaign.communitiesEmpty")}</p>
        )
      )}

      {tab === "story" && (
        <p className="text-gray-600 leading-relaxed" dir={lang === "en" ? "ltr" : "rtl"}>{story}</p>
      )}

      {tab === "org" && (
        <p className="text-gray-600 leading-relaxed" dir={lang === "en" ? "ltr" : "rtl"}>{orgBio}</p>
      )}
    </div>
  );
}
