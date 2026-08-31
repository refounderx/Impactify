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
import { setCommunityCampaign } from "@/lib/supabase/queries-community-admin";

export default function CommunityCampaignsDashboardPage() {
  const { lang, t } = useLang();
  const { data, loading, error, reload } = useCommunityAdminView();
  const [source, setSource] = useState<CommunityCampaignSource>("linked");
  const [actionError, setActionError] = useState("");
  const rows = (data?.communityCampaignRows ?? []).filter((r) => r.source === source);

  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;

  async function changeCampaignStatus(id: string, action: "pause" | "resume") {
    setActionError("");
    try { await setCommunityCampaign(id, action); reload(); }
    catch (changeError) { setActionError(changeError instanceof Error ? changeError.message : "Unable to update campaign"); }
  }

  return (
    <div>
      <CampaignSourceTabs active={source} onChange={setSource} />

      <div className="bg-white rounded-2xl p-5">
        {actionError && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{actionError}</p>}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SearchFilterBar filterLabel={lang === "en" ? "Filter by activity area" : "אזור פעילות העמותה"} />
          <StatHeader
            stats={[
              { label: t("adm.activeCampaigns"), value: String(data?.communityCampaignsActiveCount ?? 0) },
              { label: `${t("adm.totalRaisedToDate")} ${data?.AS_OF ?? ""})`, value: formatNIS(data?.communityCampaignsTotalRaised ?? 0) },
            ]}
          />
        </div>

        <CommunityCampaignsTable rows={rows} communityId={data?.communityId ?? ""} onStatusChange={changeCampaignStatus} />
      </div>
    </div>
  );
}
