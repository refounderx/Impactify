"use client";
import { useState } from "react";
import { Pencil, MoreVertical } from "lucide-react";
import SearchFilterBar from "@/components/nonprofit-admin/SearchFilterBar";
import { useLang } from "@/contexts/LanguageContext";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import EditableText from "@/components/admin/EditableText";

type Tab = "trigger" | "schedule";

const TRIGGER_HEADERS = ["סוג התראה", "כמות", "טריגר", "שעה", "תאריך", "נשלחה עד כה", "עריכה", "פעולות"];
const SCHEDULE_HEADERS = ["סוג התראה", "כמות", "תזמון", "יום", "שעה", "תאריך", "נשלחה עד כה", "עריכה", "פעולות"];

export default function CommunityUpdatesPage() {
  const { lang } = useLang();
  const { data } = useSiteDataset("community_admin");
  const communityUpdateRows = data?.communityUpdateRows ?? [];
  const communityUpdateScheduleRows = data?.communityUpdateScheduleRows ?? [];
  const [tab, setTab] = useState<Tab>("trigger");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800"><EditableText tKey="adm.updatesTitle" /></h1>
        <button className="bg-raz-teal text-white rounded-xl px-5 py-2.5 font-bold text-sm hover:bg-raz-teal-dark transition-colors">
          <EditableText tKey="adm.createUpdate" />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("trigger")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === "trigger" ? "bg-raz-teal/10 text-raz-teal" : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <EditableText tKey="adm.tabTrigger" />
          </button>
          <button
            onClick={() => setTab("schedule")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === "schedule" ? "bg-raz-teal/10 text-raz-teal" : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <EditableText tKey="adm.tabSchedule" />
          </button>
        </div>

        <SearchFilterBar filterLabel={lang === "en" ? "Filter by alert type" : "סוג התראה"} />

        <div className="overflow-x-auto mt-5">
          <table className="w-full text-sm" dir={lang === "en" ? "ltr" : "rtl"}>
            <thead>
              <tr className="border-b border-gray-100">
                {(tab === "trigger" ? TRIGGER_HEADERS : SCHEDULE_HEADERS).map((h) => (
                  <th key={h} className="pb-3 pt-1 text-raz-teal font-bold text-start px-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tab === "trigger"
                ? communityUpdateRows.map((row) => (
                    <UpdateRowActions key={row.id} id={row.id} category={lang === "en" ? row.categoryEn : row.category} quantity={row.quantity} date={row.date} sentSoFar={row.sentSoFar} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} lang={lang}>
                      <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{lang === "en" ? row.triggerEn : row.trigger}</td>
                      <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{lang === "en" ? row.timeOffsetEn : row.timeOffset}</td>
                    </UpdateRowActions>
                  ))
                : communityUpdateScheduleRows.map((row) => (
                    <UpdateRowActions key={row.id} id={row.id} category={lang === "en" ? row.categoryEn : row.category} quantity={row.quantity} date={row.date} sentSoFar={row.sentSoFar} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} lang={lang}>
                      <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{lang === "en" ? row.scheduleEn : row.schedule}</td>
                      <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{lang === "en" ? row.dayEn : row.day}</td>
                      <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{row.time}</td>
                    </UpdateRowActions>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UpdateRowActions({
  id, category, quantity, date, sentSoFar, openMenuId, setOpenMenuId, lang, children,
}: {
  id: string; category: string; quantity: number; date: string; sentSoFar: number;
  openMenuId: string | null; setOpenMenuId: (id: string | null) => void; lang: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50">
      <td className="py-3 px-2 font-medium text-gray-800 whitespace-nowrap">{category}</td>
      <td className="py-3 px-2 text-gray-500 font-numeric">{quantity}</td>
      {children}
      <td className="py-3 px-2 text-gray-400 whitespace-nowrap">{date}</td>
      <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
        {sentSoFar} {lang === "en" ? "times" : "פעמים"}
      </td>
      <td className="py-3 px-2">
        <button className="w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20">
          <Pencil size={14} />
        </button>
      </td>
      <td className="py-3 px-2 relative">
        <button
          onClick={() => setOpenMenuId(openMenuId === id ? null : id)}
          className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"
        >
          <MoreVertical size={14} />
        </button>
        {openMenuId === id && (
          <div className="absolute z-10 top-9 start-0 bg-white border border-gray-100 rounded-lg shadow-lg py-1 min-w-[100px]">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setOpenMenuId(null)}
                className="block w-full text-start px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                {lang === "en" ? `Action ${n}` : `פעולה ${n}`}
              </button>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}
