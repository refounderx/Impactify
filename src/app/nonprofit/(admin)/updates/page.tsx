"use client";

import { useMemo, useState } from "react";
import { Eye, MoreVertical, Pencil, Plus, Search } from "lucide-react";
import CreateUpdateWizard, { type NewUpdateDraft } from "@/components/nonprofit-admin/CreateUpdateWizard";
import { useLang } from "@/contexts/LanguageContext";
import { adminUpdateRows, type AdminUpdateRow } from "@/lib/nonprofit-admin-data";

type UpdateMode = "trigger" | "schedule";
type ViewRow = AdminUpdateRow & { mode: UpdateMode; paused?: boolean };

const START_ROWS: ViewRow[] = adminUpdateRows.map((row, index) => ({
  ...row,
  mode: index % 3 === 0 ? "schedule" : "trigger",
  date: index % 3 === 0 ? "13/08/23" : row.date,
}));

export default function NgoUpdatesPage() {
  const { lang, t } = useLang();
  const [mode, setMode] = useState<UpdateMode>("trigger");
  const [rows, setRows] = useState(START_ROWS);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const visibleRows = useMemo(() => rows.filter((row) => {
    const text = `${row.category} ${row.categoryEn} ${row.trigger} ${row.triggerEn}`.toLocaleLowerCase();
    return row.mode === mode && (category === "all" || row.category === category) && (!query.trim() || text.includes(query.trim().toLocaleLowerCase()));
  }), [category, mode, query, rows]);

  function addUpdate(draft: NewUpdateDraft) {
    const scheduled = draft.timing === "scheduled";
    const triggerLabels = { donation: ["ביצוע תרומה", "Donation made"], quantity: ["הגעה ליעד", "Goal reached"], days: ["ימים מהתרומה האחרונה", "Days since donation"] } as const;
    const trigger = draft.timing === "trigger" ? triggerLabels[draft.trigger] : scheduled ? ["מתוזמן", "Scheduled"] : ["שליחה מיידית", "Send now"];
    const audience = draft.audience === "products" ? ["מוצרים", "Products"] : draft.audience === "campaigns" ? ["קמפיינים", "Campaigns"] : ["כל התורמים", "All donors"];
    const scheduledDate = draft.scheduledAt ? new Date(draft.scheduledAt) : null;
    const nextRow: ViewRow = { id: editingId ?? `local-${Date.now()}`, category: audience[0], categoryEn: audience[1], quantity: draft.targetIds.length || 1, trigger: trigger[0], triggerEn: trigger[1], timeOffset: scheduledDate ? scheduledDate.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : "מיידי", timeOffsetEn: scheduledDate ? scheduledDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "Now", date: scheduledDate ? scheduledDate.toLocaleDateString("he-IL") : new Date().toLocaleDateString("he-IL"), sentSoFar: 0, mode: scheduled ? "schedule" : "trigger" };
    setRows((current) => editingId ? current.map((row) => row.id === editingId ? nextRow : row) : [nextRow, ...current]);
    setMode(nextRow.mode); setEditingId(null); setWizardOpen(false);
  }

  const categories = [...new Set(rows.map((row) => row.category))];

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div><p className="mb-2 text-sm font-bold text-raz-teal">{lang === "en" ? "Keep donors informed automatically" : "שומרים על קשר עם התורמים באופן אוטומטי"}</p><h1 className="text-4xl font-bold text-raz-dark md:text-6xl">{t("adm.updatesTitle")}</h1></div>
        <button type="button" onClick={() => { setEditingId(null); setWizardOpen(true); }} className="flex min-h-11 items-center gap-2 rounded-xl bg-raz-teal px-6 py-3 font-bold text-white transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal"><Plus size={18} />{t("adm.createUpdate")}</button>
      </div>

      <div className="ms-auto w-full max-w-2xl rounded-t-2xl bg-white p-2">
        <div className="grid grid-cols-2 gap-2">{(["schedule", "trigger"] as const).map((tab) => <button key={tab} type="button" onClick={() => setMode(tab)} className={`rounded-xl px-5 py-4 text-lg font-bold transition-colors ${mode === tab ? "bg-raz-teal/20 text-raz-dark" : "text-gray-400 hover:bg-gray-50"}`}>{tab === "schedule" ? t("adm.tabSchedule") : t("adm.tabTrigger")}</button>)}</div>
      </div>

      <section className="rounded-2xl rounded-se-none bg-white px-5 py-6 shadow-sm md:px-8" aria-label={lang === "en" ? "Updates management" : "ניהול עדכונים"}>
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 md:flex-row md:items-center md:justify-between">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700"><Eye size={17} className="text-raz-teal" /><span>{lang === "en" ? "Filter by" : "סינון לפי"}</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-xl border border-gray-100 bg-raz-surface px-4 font-normal outline-none focus:border-raz-teal"><option value="all">{lang === "en" ? "All update types" : "כל סוגי ההתראה"}</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <div className="relative w-full max-w-xs"><Search size={18} className="absolute start-1 top-1/2 -translate-y-1/2 text-raz-dark" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lang === "en" ? "Search" : "חיפוש"} className="min-h-11 w-full border-b border-gray-400 bg-transparent ps-8 pe-2 outline-none focus:border-raz-teal" /></div>
        </div>

        <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-sm"><thead className="text-raz-teal"><tr className="border-b border-gray-200"><Header>{lang === "en" ? "Update type" : "סוג התראה"}</Header><Header>{lang === "en" ? "Quantity" : "כמות"}</Header><Header>{mode === "trigger" ? t("adm.tabTrigger") : t("adm.tabSchedule")}</Header><Header>{mode === "trigger" ? (lang === "en" ? "Offset" : "השהיה") : (lang === "en" ? "Day" : "יום")}</Header><Header>{lang === "en" ? "Date / time" : "תאריך / שעה"}</Header><Header>{lang === "en" ? "Sent so far" : "נשלחה עד כה"}</Header><Header>{lang === "en" ? "Edit" : "עריכה"}</Header><Header>{lang === "en" ? "Actions" : "פעולות"}</Header></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id} className={`border-b border-gray-200 text-gray-800 hover:bg-gray-50/70 ${row.paused ? "opacity-55" : ""}`}><Cell bold>{lang === "en" ? row.categoryEn : row.category}{row.paused && <span className="ms-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">{lang === "en" ? "Paused" : "מושהה"}</span>}</Cell><Cell>{row.quantity}</Cell><Cell>{lang === "en" ? row.triggerEn : row.trigger}</Cell><Cell>{lang === "en" ? row.timeOffsetEn : row.timeOffset}</Cell><Cell>{row.date}</Cell><Cell>{row.sentSoFar}</Cell><td className="px-4 py-4"><IconButton label={lang === "en" ? "Edit update" : "עריכת עדכון"} onClick={() => { setEditingId(row.id); setWizardOpen(true); }}><Pencil size={16} /></IconButton></td><td className="relative px-4 py-4"><IconButton label={lang === "en" ? "Update actions" : "פעולות עדכון"} onClick={() => setMenuId(menuId === row.id ? null : row.id)}><MoreVertical size={17} /></IconButton>{menuId === row.id && <div className="absolute end-4 top-14 z-20 w-36 rounded-xl border border-gray-100 bg-white py-1 text-xs shadow-xl"><button onClick={() => { setRows((current) => [{ ...row, id: `copy-${Date.now()}` }, ...current]); setMenuId(null); }} className="block w-full px-4 py-2 text-start hover:bg-gray-50">{lang === "en" ? "Duplicate" : "שכפול"}</button><button onClick={() => { setRows((current) => current.map((item) => item.id === row.id ? { ...item, paused: !item.paused } : item)); setMenuId(null); }} className="block w-full px-4 py-2 text-start hover:bg-gray-50">{row.paused ? (lang === "en" ? "Resume" : "הפעלה") : (lang === "en" ? "Pause" : "השהיה")}</button><button onClick={() => { setRows((current) => current.filter((item) => item.id !== row.id)); setMenuId(null); }} className="block w-full px-4 py-2 text-start text-red-600 hover:bg-red-50">{lang === "en" ? "Remove" : "הסרה"}</button></div>}</td></tr>)}</tbody></table></div>
        {visibleRows.length === 0 && <div className="py-14 text-center"><p className="font-bold text-gray-700">{lang === "en" ? "No updates match this view" : "אין עדכונים שמתאימים לתצוגה"}</p><p className="mt-1 text-sm text-gray-400">{lang === "en" ? "Change the filter or create a new update." : "אפשר לשנות את הסינון או ליצור עדכון חדש."}</p></div>}
      </section>
      {wizardOpen && <CreateUpdateWizard lang={lang} t={t} onClose={() => { setWizardOpen(false); setEditingId(null); }} onCreate={addUpdate} />}
    </div>
  );
}

function Header({ children }: { children: React.ReactNode }) { return <th className="whitespace-nowrap px-4 py-4 text-start text-xs font-bold">{children}</th>; }
function Cell({ children, bold = false }: { children: React.ReactNode; bold?: boolean }) { return <td className={`whitespace-nowrap px-4 py-4 ${bold ? "font-bold" : ""}`}>{children}</td>; }
function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className="micro-hint inline-flex h-11 w-11 items-center justify-center rounded-full bg-raz-teal text-white transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal" aria-label={label}>{children}</button>; }
