"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, ArrowUpDown, Check, Eye } from "lucide-react";
import DonutChart from "@/components/nonprofit-admin/DonutChart";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import { getCampaigns } from "@/lib/supabase/queries";
import { getCommunityCampaignStatuses, setCommunityCampaign, type CommunityCampaignStatus } from "@/lib/supabase/queries-community-admin";
import EditableText from "@/components/admin/EditableText";

const SORT_OPTIONS_HE = [
  "תאריך סיום קרוב להרחוק", "תאריך סיום רחוק לקרוב",
  "סכום שגויס גבוה לנמוך", "סכום שגויס נמוך לגבוה",
  "סכום היעד גבוה לנמוך", "סכום היעד נמוך לגבוה",
];
const FILTER_OPTIONS_HE = ["תחומי פעילות", "אזור פעילות"];

export default function CommunitySearchCampaignsPage() {
  const router = useRouter();
  const { lang, t } = useLang();
  const [communityCampaignCards, setCommunityCampaignCards] = useState<Awaited<ReturnType<typeof getCampaigns>>>([]);
  const [loadError, setLoadError] = useState("");
  const [openDropdown, setOpenDropdown] = useState<"sort" | "filter" | null>(null);
  const [statuses, setStatuses] = useState<Record<string, CommunityCampaignStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCampaigns(), getCommunityCampaignStatuses()]).then(([campaigns, membershipStatuses]) => {
      setCommunityCampaignCards(campaigns);
      setStatuses(membershipStatuses);
    }).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : "Unable to load campaigns");
    });
  }, []);

  async function toggleRequest(id: string) {
    const current = statuses[id];
    if (current === "active" || current === "paused") return;
    setSavingId(id); setLoadError("");
    try {
      const status = await setCommunityCampaign(id, current === "pending" ? "cancel" : "request");
      setStatuses((previous) => {
        const next = { ...previous };
        if (status === "cancelled") delete next[id];
        else next[id] = status as CommunityCampaignStatus;
        return next;
      });
    } catch (error) { setLoadError(error instanceof Error ? error.message : "Unable to update join request"); }
    finally { setSavingId(null); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link
          href="/community"
          className="bg-raz-teal text-white rounded-xl px-5 py-2.5 font-bold text-sm hover:bg-raz-teal-dark transition-colors order-2"
        >
          <EditableText tKey="adm.createCampaign" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 order-1"><EditableText tKey="adm.searchCampaignsTitle" /></h1>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
          <input
            type="text"
            placeholder={lang === "en" ? "Search" : "חיפוש"}
            className="w-full border border-gray-200 rounded-lg ps-9 pe-3 py-2 text-sm outline-none focus:border-raz-teal"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
            className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <ArrowUpDown size={14} />
            <EditableText tKey="adm.sortBy" />
          </button>
          {openDropdown === "sort" && (
            <div className="absolute z-10 top-11 start-0 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[220px] text-start">
              {SORT_OPTIONS_HE.map((o) => (
                <button
                  key={o}
                  onClick={() => setOpenDropdown(null)}
                  className="block w-full text-start px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                >
                  {o}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "filter" ? null : "filter")}
            className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <SlidersHorizontal size={14} />
            <EditableText tKey="adm.filterBy" />
          </button>
          {openDropdown === "filter" && (
            <div className="absolute z-10 top-11 start-0 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[160px] text-start">
              {FILTER_OPTIONS_HE.map((o) => (
                <button
                  key={o}
                  onClick={() => setOpenDropdown(null)}
                  className="block w-full text-start px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                >
                  {o}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loadError && <p className="bg-red-50 text-red-700 rounded-xl p-3 mb-4">{loadError}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {communityCampaignCards.map((c) => {
          const status = statuses[c.id];
          const isRequested = status === "pending";
          const isJoined = status === "active" || status === "paused";
          return (
            <div key={c.id} className="bg-white rounded-2xl p-4 relative">
              <span className="absolute top-4 start-4 bg-gray-100 text-gray-500 text-[11px] font-medium rounded-full px-2.5 py-1">
                {c.category}
              </span>
              <div className="absolute top-4 end-4 flex items-center gap-2">
                <button
                  onClick={() => void toggleRequest(c.id)}
                  disabled={isJoined || savingId === c.id}
                  aria-label={isJoined ? (lang === "en" ? "Already joined" : "הקהילה כבר הצטרפה") : isRequested ? (lang === "en" ? "Cancel join request" : "ביטול בקשת ההצטרפות") : (lang === "en" ? "Request to join" : "בקשת הצטרפות")}
                  className={`micro-hint w-7 h-7 rounded-full flex items-center justify-center ${
                    isRequested || isJoined ? "bg-raz-teal text-white" : "bg-raz-teal/10 text-raz-teal hover:bg-raz-teal/20"
                  }`}
                >
                  <Check size={13} />
                </button>
                <button onClick={() => router.push(`/campaign/${c.id}`)} className="micro-hint w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20" aria-label={t("hint.view")}>
                  <Eye size={13} />
                </button>
              </div>
              <div className="w-24 h-24 rounded-xl bg-gray-50 flex items-center justify-center text-5xl mb-3 mt-6">
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
              <button
                onClick={() => void toggleRequest(c.id)}
                disabled={isJoined || savingId === c.id}
                className={`w-full mt-3 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                  isRequested || isJoined ? "bg-gray-100 text-gray-500" : "bg-raz-teal text-white hover:bg-raz-teal-dark"
                }`}
              >
                {savingId === c.id ? (lang === "en" ? "Saving…" : "שומר…") : isJoined ? (lang === "en" ? "Joined" : "הקהילה מחוברת") : isRequested ? (lang === "en" ? "Cancel request" : "ביטול בקשה") : <EditableText tKey="adm.requestToJoin" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
