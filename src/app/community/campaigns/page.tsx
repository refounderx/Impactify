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

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/community"
          className="flex min-h-[39rem] flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-raz-dark p-8 text-center text-white shadow-[0_12px_28px_rgba(15,23,42,0.2)] transition-all duration-200 hover:-translate-y-1 hover:bg-slate-800 hover:shadow-[0_18px_34px_rgba(15,23,42,0.25)]"
        >
          <p className="font-bold text-lg leading-snug mb-2"><EditableText tKey="adm.backToDashboard" /></p>
        </Link>
        {(data?.communityCampaignCards ?? []).filter((campaign) => campaign.source === source).map((c) => (
          <article key={c.id} className="relative flex min-h-[39rem] flex-col overflow-hidden rounded-[2rem] bg-white px-8 pb-7 pt-7 shadow-[0_12px_28px_rgba(15,23,42,0.12)] ring-1 ring-slate-100 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,23,42,0.14)]">
            <div className="absolute end-6 top-8 z-10 flex flex-col gap-3">
              <button disabled={savingId === c.id} onClick={() => void changeStatus(c.id, c.paused)} className="micro-hint flex h-11 w-11 items-center justify-center rounded-full bg-raz-teal text-white transition-transform hover:scale-110 disabled:opacity-50" aria-label={c.paused ? (lang === "en" ? "Reactivate campaign" : "הפעלת קמפיין") : (lang === "en" ? "Pause campaign" : "השהיית קמפיין")}>
                {c.paused ? <Play size={17} /> : <Pause size={17} />}
              </button>
              <button onClick={() => router.push(`/campaign/${c.id}`)} className="micro-hint flex h-11 w-11 items-center justify-center rounded-full bg-raz-teal text-white transition-transform hover:scale-110" aria-label={t("hint.view")}>
                <Eye size={18} />
              </button>
            </div>
            <div className="flex h-52 items-center justify-center border-b border-slate-200 pe-12 text-8xl" aria-hidden="true">
              {c.emoji}
            </div>
            <div className="flex flex-1 flex-col items-center pt-7 text-center">
              <h2 className="text-3xl font-extrabold leading-tight text-raz-dark">{lang === "en" ? c.titleEn : c.title}</h2>
              <p className="mt-7 text-xl font-bold text-raz-dark">{lang === "en" ? "Total donations to this campaign:" : "סה\"כ תרומות לקמפיין זה:"}</p>
              <DonutChart filled={c.raised} total={c.goal} centerValue={formatNIS(c.goal)} filledLabel={formatNIS(c.raised)} remainingLabel={formatNIS(c.goal - c.raised)} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
