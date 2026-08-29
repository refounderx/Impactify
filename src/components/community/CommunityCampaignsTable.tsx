"use client";
import { useState, Fragment } from "react";
import { Eye, ChevronDown, ChevronUp, Info, Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import CampaignDetailPanel from "@/components/nonprofit-admin/CampaignDetailPanel";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import { getAdminCampaignDetail } from "@/lib/nonprofit-admin-data";
import type { CommunityCampaignRow } from "@/lib/community-admin-data";

const HEADERS = ["שם הקמפיין", "הקמה", "סיום", "מוצרים", "מוצרים שגויסו", "סכום שגויס", "מספר תורמים", "מצטרפים", "עמותה", "צפייה", "עריכה", ""];

export default function CommunityCampaignsTable({ rows, onStatusChange }: { rows: CommunityCampaignRow[]; onStatusChange: (id: string, action: "pause" | "resume") => Promise<void> }) {
  const router = useRouter();
  const { lang, t } = useLang();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<{ id: string; type: "edit" | "view" } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const closeMenu = () => setOpenMenu(null);

  async function changeStatus(row: CommunityCampaignRow) {
    setSavingId(row.id);
    try { await onStatusChange(row.id, row.paused ? "resume" : "pause"); closeMenu(); }
    finally { setSavingId(null); }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" dir={lang === "en" ? "ltr" : "rtl"}>
        <thead>
          <tr className="border-b border-gray-100">
            {HEADERS.map((h) => (
              <th key={h} className="pb-3 pt-1 text-raz-teal font-bold text-start px-2 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const expanded = expandedId === row.id;
            return (
              <Fragment key={row.id}>
                <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-2 font-medium text-gray-800 whitespace-nowrap">{lang === "en" ? row.nameEn : row.name}</td>
                  <td className={`py-3 px-2 whitespace-nowrap ${row.paused ? "text-red-500 font-medium" : "text-gray-500"}`}>{row.created}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{row.ended}</td>
                  <td className="py-3 px-2 text-gray-500 font-numeric">{row.productsCount}</td>
                  <td className="py-3 px-2 text-gray-500 font-numeric">{row.productsRaisedCount}</td>
                  <td className="py-3 px-2 font-bold text-gray-800 font-numeric">{formatNIS(row.amountRaised)}</td>
                  <td className="py-3 px-2 text-gray-500 font-numeric">{row.donorCount}</td>
                  <td className="py-3 px-2">
                    {row.paused ? (
                      <span className="flex items-center gap-1 text-gray-400 text-xs">
                        <span className="group relative">
                          <Info size={13} className="text-gray-300" />
                          <span className="pointer-events-none absolute z-10 bottom-full mb-1 start-0 hidden group-hover:block whitespace-nowrap bg-gray-800 text-white text-[11px] rounded-md px-2 py-1 shadow-lg">
                            {lang === "en" ? "Campaign is inactive — you can edit and republish it" : "הקמפיין אינו פעיל / באפשרותך לערוך ולפרסם אותו מחדש"}
                          </span>
                        </span>
                        {lang === "en" ? "Campaign paused" : "קמפיין מושהה"}
                      </span>
                    ) : (
                      <span className="text-gray-500 font-numeric">{row.joinedCount}</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <span className="group relative w-7 h-7 rounded-full bg-raz-teal flex items-center justify-center text-white text-[10px] font-bold cursor-default">
                      {(lang === "en" ? row.orgNameEn : row.orgName).slice(0, 1)}
                      <span className="pointer-events-none absolute z-10 bottom-full mb-1 start-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-gray-800 text-white text-[11px] rounded-md px-2 py-1 shadow-lg">
                        {lang === "en" ? row.orgNameEn : row.orgName}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-2 relative">
                    <button
                      onClick={() => setOpenMenu(openMenu?.id === row.id && openMenu.type === "view" ? null : { id: row.id, type: "view" })}
                      className="micro-hint w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20"
                      aria-label={t("hint.view")}
                    >
                      <Eye size={14} />
                    </button>
                    {openMenu?.id === row.id && openMenu.type === "view" && (
                      <div className="absolute z-10 top-9 start-0 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[140px] text-start">
                        <button onClick={() => router.push(`/campaign/${row.id}`)} className="block w-full text-start px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                          {lang === "en" ? "View campaign" : "צפייה בקמפיין"}
                        </button>
                        <button
                          onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/campaign/${row.id}`); closeMenu(); }}
                          className="block w-full text-start px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          {lang === "en" ? "Copy link" : "העתקת קישור"}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2 relative">
                    <button
                      onClick={() => setOpenMenu(openMenu?.id === row.id && openMenu.type === "edit" ? null : { id: row.id, type: "edit" })}
                      className="micro-hint w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20"
                      aria-label={lang === "en" ? "Manage campaign participation" : "ניהול השתתפות בקמפיין"}
                    >
                      {row.paused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    {openMenu?.id === row.id && openMenu.type === "edit" && (
                      <div className="absolute z-10 top-9 start-0 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[140px] text-start">
                        <button disabled={savingId === row.id} onClick={() => void changeStatus(row)} className="block w-full text-start px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                          {row.paused ? (lang === "en" ? "Reactivate campaign" : "הפעלת קמפיין") : (lang === "en" ? "Pause campaign" : "הפסקת קמפיין")}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => setExpandedId(expanded ? null : row.id)}
                      className="micro-hint w-7 h-7 rounded-full text-gray-400 flex items-center justify-center hover:bg-gray-100"
                      aria-label={t(expanded ? "hint.collapse" : "hint.expand")}
                    >
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </td>
                </tr>
                {expanded && (
                  <tr>
                    <td colSpan={HEADERS.length} className="p-2">
                      <CampaignDetailPanel detail={getAdminCampaignDetail(i)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
