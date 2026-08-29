"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import DonutChart from "@/components/nonprofit-admin/DonutChart";
import CampaignSourceTabs from "@/components/community/CampaignSourceTabs";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import type { CommunityCampaignSource } from "@/lib/community-admin-data";
import { useCommunityAdminView } from "@/hooks/useCommunityAdminView";
import AdminDataStatus from "@/components/nonprofit-admin/AdminDataStatus";
import EditableText from "@/components/admin/EditableText";
import { setCommunityCampaign } from "@/lib/supabase/queries-community-admin";

export default function CommunityCampaignsGridPage() {
  const router = useRouter();
  const { lang, t } = useLang();
  const { data, loading, error, reload } = useCommunityAdminView();
  const [source, setSource] = useState<CommunityCampaignSource>("linked");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;

  async function changeStatus(id: string, paused: boolean) {
    setSavingId(id); setActionError("");
    try { await setCommunityCampaign(id, paused ? "resume" : "pause"); reload(); }
    catch (changeError) { setActionError(changeError instanceof Error ? changeError.message : "Unable to update campaign"); }
    finally { setSavingId(null); }
  }

  return (
    <div>
      <CampaignSourceTabs active={source} onChange={setSource} />
      {actionError && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{actionError}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          href="/community"
          className="bg-raz-dark rounded-2xl p-5 flex flex-col items-center justify-center text-center text-white min-h-[19rem] hover:bg-gray-800 transition-colors"
        >
          <p className="font-bold text-lg leading-snug mb-2"><EditableText tKey="adm.backToDashboard" /></p>
        </Link>
        {(data?.communityCampaignCards ?? []).filter((campaign) => campaign.source === source).map((c) => (
          <div key={c.id} className="bg-white rounded-2xl p-4 relative">
            <div className="absolute top-4 end-4 flex flex-col gap-2">
              <button disabled={savingId === c.id} onClick={() => void changeStatus(c.id, c.paused)} className="micro-hint w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20 disabled:opacity-50" aria-label={c.paused ? (lang === "en" ? "Reactivate campaign" : "הפעלת קמפיין") : (lang === "en" ? "Pause campaign" : "השהיית קמפיין")}>
                {c.paused ? <Play size={13} /> : <Pause size={13} />}
              </button>
              <button onClick={() => router.push(`/campaign/${c.id}`)} className="micro-hint w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20" aria-label={t("hint.view")}>
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
