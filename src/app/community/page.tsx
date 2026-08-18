"use client";
import { useState } from "react";
import StatHeader from "@/components/nonprofit-admin/StatHeader";
import SearchFilterBar from "@/components/nonprofit-admin/SearchFilterBar";
import CampaignSourceTabs from "@/components/community/CampaignSourceTabs";
import CommunityCampaignsTable from "@/components/community/CommunityCampaignsTable";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import {
  communityCampaignRows,
  communityCampaignsTotalRaised,
  communityCampaignsActiveCount,
  AS_OF,
  type CommunityCampaignSource,
} from "@/lib/community-admin-data";

export default function CommunityCampaignsDashboardPage() {
  const { lang, t } = useLang();
  const [source, setSource] = useState<CommunityCampaignSource>("created");

  const rows = communityCampaignRows.filter((r) => r.source === source);

  return (
    <div>
      <CampaignSourceTabs active={source} onChange={setSource} />

      <div className="bg-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SearchFilterBar filterLabel={lang === "en" ? "Filter by activity area" : "אזור פעילות העמותה"} />
          <StatHeader
            stats={[
              { label: t("adm.activeCampaigns"), value: String(communityCampaignsActiveCount) },
              { label: `${t("adm.totalRaisedToDate")} ${AS_OF})`, value: formatNIS(communityCampaignsTotalRaised) },
            ]}
          />
        </div>

        <CommunityCampaignsTable rows={rows} />
      </div>
    </div>
  );
}
