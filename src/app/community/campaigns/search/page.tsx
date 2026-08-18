"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpDown, Check, Eye } from "lucide-react";
import DonutChart from "@/components/nonprofit-admin/DonutChart";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import { communityCampaignCards } from "@/lib/community-admin-data";

const SORT_OPTIONS_HE = [
  "תאריך סיום קרוב להרחוק", "תאריך סיום רחוק לקרוב",
  "סכום שגויס גבוה לנמוך", "סכום שגויס נמוך לגבוה",
  "סכום היעד גבוה לנמוך", "סכום היעד נמוך לגבוה",
];
const FILTER_OPTIONS_HE = ["תחומי פעילות", "אזור פעילות"];

export default function CommunitySearchCampaignsPage() {
  const { lang, t } = useLang();
  const [openDropdown, setOpenDropdown] = useState<"sort" | "filter" | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  const toggleRequest = (id: string) => {
    setRequested((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link
          href="/community"
          className="bg-raz-teal text-white rounded-xl px-5 py-2.5 font-bold text-sm hover:bg-raz-teal-dark transition-colors order-2"
        >
          {t("adm.createCampaign")}
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 order-1">{t("adm.searchCampaignsTitle")}</h1>
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
            {t("adm.sortBy")}
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
            {t("adm.filterBy")}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {communityCampaignCards.map((c) => {
          const isRequested = requested.has(c.id);
          return (
            <div key={c.id} className="bg-white rounded-2xl p-4 relative">
              <span className="absolute top-4 start-4 bg-gray-100 text-gray-500 text-[11px] font-medium rounded-full px-2.5 py-1">
                {lang === "en" ? c.activityAreaEn : c.activityArea}
              </span>
              <div className="absolute top-4 end-4 flex items-center gap-2">
                <button
                  onClick={() => toggleRequest(c.id)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    isRequested ? "bg-raz-teal text-white" : "bg-raz-teal/10 text-raz-teal hover:bg-raz-teal/20"
                  }`}
                >
                  <Check size={13} />
                </button>
                <button className="w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20">
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
                onClick={() => toggleRequest(c.id)}
                className={`w-full mt-3 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                  isRequested ? "bg-gray-100 text-gray-400" : "bg-raz-teal text-white hover:bg-raz-teal-dark"
                }`}
              >
                {isRequested ? (lang === "en" ? "Request Sent" : "הבקשה נשלחה") : t("adm.requestToJoin")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
