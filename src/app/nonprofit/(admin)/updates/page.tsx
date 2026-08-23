"use client";
import { useState } from "react";
import { Pencil, MoreVertical } from "lucide-react";
import SearchFilterBar from "@/components/nonprofit-admin/SearchFilterBar";
import { useLang } from "@/contexts/LanguageContext";
import type { AdminCampaignRow, AdminProductRow, AdminUpdateRow } from "@/lib/nonprofit-admin-data";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import CreateUpdateWizard, { type NewUpdateDraft } from "@/components/nonprofit-admin/CreateUpdateWizard";
import EditableText from "@/components/admin/EditableText";

type Tab = "trigger" | "schedule";

const TRIGGER_LABELS: Record<NewUpdateDraft["trigger"], [string, string]> = {
  donation: ["לאחר ביצוע תרומה", "After a donation is made"],
  quantity: ["כשכמות המוצר מגיעה ליעד", "When product quantity reaches its goal"],
  days: ["מספר ימים מאז התרומה האחרונה", "Days since last donation"],
};

function draftToRow(
  draft: NewUpdateDraft,
  productRows: AdminProductRow[],
  campaignRows: AdminCampaignRow[],
): AdminUpdateRow {
  const pool = draft.audience === "products" ? productRows : campaignRows;
  const names = draft.audience === "all"
    ? [["כל התורמים", "All donors"] as [string, string]]
    : pool.filter((o) => draft.targetIds.includes(o.id)).map((o) => [o.name, o.nameEn] as [string, string]);
  const [category, categoryEn] = names[0] ?? ["—", "—"];
  const [trigger, triggerEn] = draft.timing === "trigger" ? TRIGGER_LABELS[draft.trigger] : ["מיידי", "Immediate"];

  return {
    id: `au-new-${Date.now()}`,
    category, categoryEn,
    quantity: names.length,
    trigger, triggerEn,
    timeOffset: draft.timing === "scheduled" ? draft.scheduledAt : "--",
    timeOffsetEn: draft.timing === "scheduled" ? draft.scheduledAt : "--",
    date: new Date().toLocaleDateString("he-IL"),
    sentSoFar: 0,
  };
}

export default function UpdatesPage() {
  const { lang, t } = useLang();
  const { data } = useSiteDataset("nonprofit_admin");
  const [tab, setTab] = useState<Tab>("trigger");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [createdRows, setCreatedRows] = useState<AdminUpdateRow[]>([]);
  const [creating, setCreating] = useState(false);
  const rows = [...createdRows, ...(data?.adminUpdateRows ?? [])];

  function handleCreate(draft: NewUpdateDraft) {
    setCreatedRows((rs) => [draftToRow(draft, data?.adminProductRows ?? [], data?.adminCampaignRows ?? []), ...rs]);
    setCreating(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <EditableText tKey="adm.updatesTitle" as="h1" className="text-3xl font-bold text-gray-800" />
        <button
          onClick={() => setCreating(true)}
          className="bg-raz-teal text-white rounded-xl px-5 py-2.5 font-bold text-sm hover:bg-raz-teal-dark transition-colors"
        >
          <EditableText tKey="adm.createUpdate" />
        </button>
      </div>

      {creating && (
        <CreateUpdateWizard lang={lang} t={t} onClose={() => setCreating(false)} onCreate={handleCreate} />
      )}

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
                {["סוג התראה", "כמות", "טריגר", "שעה", "תאריך", "נשלחה עד כה", "עריכה", "פעולות"].map((h) => (
                  <th key={h} className="pb-3 pt-1 text-raz-teal font-bold text-start px-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-2 font-medium text-gray-800 whitespace-nowrap">{lang === "en" ? row.categoryEn : row.category}</td>
                  <td className="py-3 px-2 text-gray-500 font-numeric">{row.quantity}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{lang === "en" ? row.triggerEn : row.trigger}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{lang === "en" ? row.timeOffsetEn : row.timeOffset}</td>
                  <td className="py-3 px-2 text-gray-400 whitespace-nowrap">{row.date}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                    {row.sentSoFar} {lang === "en" ? "times" : "פעמים"}
                  </td>
                  <td className="py-3 px-2">
                    <button className="w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20">
                      <Pencil size={14} />
                    </button>
                  </td>
                  <td className="py-3 px-2 relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
                      className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"
                    >
                      <MoreVertical size={14} />
                    </button>
                    {openMenuId === row.id && (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
