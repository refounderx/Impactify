"use client";
import { useState } from "react";
import StatHeader from "@/components/nonprofit-admin/StatHeader";
import SearchFilterBar from "@/components/nonprofit-admin/SearchFilterBar";
import CampaignSourceTabs from "@/components/community/CampaignSourceTabs";
import CommunityCampaignsTable from "@/components/community/CommunityCampaignsTable";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import type { CommunityCampaignSource } from "@/lib/community-admin-data";
import { useCommunityAdminView } from "@/hooks/useCommunityAdminView";
import AdminDataStatus from "@/components/nonprofit-admin/AdminDataStatus";

export default function CommunityCampaignsDashboardPage() {
  const { lang, t } = useLang();
  const { data, loading, error, reload } = useCommunityAdminView();
  const [source, setSource] = useState<CommunityCampaignSource>("linked");
  const rows = (data?.communityCampaignRows ?? []).filter((r) => r.source === source);

  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;

  return (
    <div>
      <CampaignSourceTabs active={source} onChange={setSource} />

      <div className="bg-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SearchFilterBar filterLabel={lang === "en" ? "Filter by activity area" : "אזור פעילות העמותה"} />
          <StatHeader
            stats={[
              { label: t("adm.activeCampaigns"), value: String(data?.communityCampaignsActiveCount ?? 0) },
              { label: `${t("adm.totalRaisedToDate")} ${data?.AS_OF ?? ""})`, value: formatNIS(data?.communityCampaignsTotalRaised ?? 0) },
            ]}
          />
        </div>

        <CommunityCampaignsTable rows={rows} />
      </div>
    </div>
  );
}
