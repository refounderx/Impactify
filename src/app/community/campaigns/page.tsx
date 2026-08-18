"use client";
import { useState } from "react";
import Link from "next/link";
import { Pencil, Eye } from "lucide-react";
import DonutChart from "@/components/nonprofit-admin/DonutChart";
import CampaignSourceTabs from "@/components/community/CampaignSourceTabs";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import { communityCampaignCards, type CommunityCampaignSource } from "@/lib/community-admin-data";

export default function CommunityCampaignsGridPage() {
  const { lang, t } = useLang();
  const [source, setSource] = useState<CommunityCampaignSource>("created");

  return (
    <div>
      <CampaignSourceTabs active={source} onChange={setSource} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          href="/community"
          className="bg-raz-dark rounded-2xl p-5 flex flex-col items-center justify-center text-center text-white min-h-[19rem] hover:bg-gray-800 transition-colors"
        >
          <p className="font-bold text-lg leading-snug mb-2">{t("adm.backToDashboard")}</p>
        </Link>
        {communityCampaignCards.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl p-4 relative">
            <div className="absolute top-4 end-4 flex flex-col gap-2">
              <button className="w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20">
                <Pencil size={13} />
              </button>
              <button className="w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20">
                <Eye size={13} />
              </button>
            </div>
            <div className="w-24 h-24 rounded-xl bg-gray-50 flex items-center justify-center text-5xl mb-3">
              {c.emoji}
            </div>
            <h3 className="font-bold text-gray-800 mb-1">{lang === "en" ? c.titleEn : c.title}</h3>
            <p className="text-xs text-gray-500 mb-1">{lang === "en" ? "Total donations to this campaign:" : "סה\"כ תרומות לקמפיין זה:"}</p>
            <DonutChart
              filled={c.raised}
              total={c.goal}
              centerValue={formatNIS(c.goal)}
              filledLabel={formatNIS(c.raised)}
              remainingLabel={formatNIS(c.goal - c.raised)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
