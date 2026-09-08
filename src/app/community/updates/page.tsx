"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreVertical, Pencil, Plus } from "lucide-react";
import CreateUpdateWizard, { type NewUpdateDraft } from "@/components/nonprofit-admin/CreateUpdateWizard";
import { useLang } from "@/contexts/LanguageContext";
import { useCommunityAdminView } from "@/hooks/useCommunityAdminView";
import { getCommunityUpdates, manageCommunityUpdate, saveCommunityUpdate, type CommunityUpdate } from "@/lib/supabase/queries-community-updates";
import type { NgoUpdateDraft } from "@/lib/supabase/queries-updates";

type ViewRow = CommunityUpdate & { draft: NgoUpdateDraft };

function toViewRow(row: CommunityUpdate): ViewRow {
  return { ...row, draft: { audience: row.audience, targetIds: row.target_ids, channels: { push: row.channels.includes("push"), email: row.channels.includes("email"), sms: row.channels.includes("sms") }, timing: row.timing, scheduledAt: row.scheduled_at ? row.scheduled_at.slice(0, 16) : "", trigger: row.trigger_type ?? "donation", title: row.title, body: row.body, cta: row.cta, imageName: row.image_name } };
}

export default function CommunityUpdatesPage() {
  const { lang, t } = useLang();
  const { data: communityData } = useCommunityAdminView();
  const [rows, setRows] = useState<ViewRow[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try { setRows((await getCommunityUpdates()).map(toViewRow)); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load community updates"); }
  }
  useEffect(() => { void load(); }, []);

  async function save(draft: NewUpdateDraft) {
    setBusy(true); setError("");
    try {
      await saveCommunityUpdate({ ...draft, audience: draft.audience === "all" ? "all" : "campaigns", targetIds: draft.audience === "all" ? [] : draft.targetIds }, editingId);
      setWizardOpen(false); setEditingId(null); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save community update"); }
    finally { setBusy(false); }
  }

  async function manage(row: ViewRow, action: "duplicate" | "pause" | "resume" | "delete") {
    setBusy(true); setMenuId(null); setError("");
    try { await manageCommunityUpdate(row.id, action); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update item"); }
    finally { setBusy(false); }
  }

  const campaignOptions = useMemo(() => (communityData?.communityCampaignRows ?? []).map((campaign) => ({ id: campaign.id, name: campaign.name, nameEn: campaign.nameEn })), [communityData]);
  return <div className="mx-auto w-full max-w-[1500px] pb-10">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 text-sm font-bold text-raz-teal">{lang === "en" ? "Keep your community donors informed" : "שומרים על קשר עם תורמי הקהילה"}</p><h1 className="text-4xl font-bold text-raz-dark md:text-6xl">{lang === "en" ? "Community updates" : "עדכוני קהילה"}</h1><p className="mt-2 text-slate-500">{lang === "en" ? "Send only to donors attributed to your community or its linked campaigns." : "שולחים רק לתורמים שמיוחסים לקהילה או לקמפיינים המקושרים אליה."}</p></div><button type="button" onClick={() => { setEditingId(null); setWizardOpen(true); }} className="flex min-h-11 items-center gap-2 rounded-xl bg-raz-teal px-6 py-3 font-bold text-white transition-transform hover:scale-[1.03]"><Plus size={18} />{lang === "en" ? "Create community update" : "יצירת עדכון קהילה"}</button></div>
    {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
    <section className="rounded-2xl bg-white px-5 py-6 shadow-sm md:px-8"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-b border-gray-200 text-raz-teal"><tr><th className="px-4 py-4 text-start">{lang === "en" ? "Audience" : "קהל"}</th><th className="px-4 py-4 text-start">{lang === "en" ? "Message" : "הודעה"}</th><th className="px-4 py-4 text-start">{lang === "en" ? "Timing" : "תזמון"}</th><th className="px-4 py-4 text-start">{lang === "en" ? "Sent" : "נשלח"}</th><th className="px-4 py-4 text-start">{lang === "en" ? "Status" : "סטטוס"}</th><th className="px-4 py-4 text-start">{lang === "en" ? "Actions" : "פעולות"}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-gray-200 text-gray-800"><td className="px-4 py-4 font-bold">{row.audience === "all" ? (lang === "en" ? "All community donors" : "כל תורמי הקהילה") : (lang === "en" ? `${row.target_ids.length} linked campaigns` : `${row.target_ids.length} קמפיינים מקושרים`)}</td><td className="px-4 py-4"><p className="font-bold">{row.title}</p><p className="mt-1 line-clamp-1 text-xs text-gray-500">{row.body}</p></td><td className="px-4 py-4">{row.timing === "now" ? (lang === "en" ? "Immediate" : "מיידי") : row.timing === "scheduled" ? (lang === "en" ? "Scheduled" : "מתוזמן") : (lang === "en" ? "Trigger" : "טריגר")}</td><td className="px-4 py-4">{row.sent_so_far}</td><td className="px-4 py-4">{row.status === "sent" ? (lang === "en" ? "Sent" : "נשלח") : row.status === "paused" ? (lang === "en" ? "Paused" : "מושהה") : (lang === "en" ? "Active" : "פעיל")}</td><td className="relative px-4 py-4"><button type="button" onClick={() => { setEditingId(row.id); setWizardOpen(true); }} className="me-2 rounded-full bg-raz-teal p-2 text-white" aria-label={lang === "en" ? "Edit" : "עריכה"}><Pencil size={15} /></button><button type="button" onClick={() => setMenuId(menuId === row.id ? null : row.id)} className="rounded-full bg-slate-100 p-2 text-slate-600" aria-label={lang === "en" ? "More actions" : "פעולות נוספות"}><MoreVertical size={15} /></button>{menuId === row.id && <div className="absolute end-4 top-14 z-20 w-36 rounded-xl border border-gray-100 bg-white py-1 text-xs shadow-xl"><button disabled={busy} onClick={() => void manage(row, "duplicate")} className="block w-full px-4 py-2 text-start hover:bg-gray-50">{lang === "en" ? "Duplicate" : "שכפול"}</button>{row.status !== "sent" && <button disabled={busy} onClick={() => void manage(row, row.status === "paused" ? "resume" : "pause")} className="block w-full px-4 py-2 text-start hover:bg-gray-50">{row.status === "paused" ? (lang === "en" ? "Resume" : "הפעלה") : (lang === "en" ? "Pause" : "השהיה")}</button>}<button disabled={busy} onClick={() => void manage(row, "delete")} className="block w-full px-4 py-2 text-start text-red-600 hover:bg-red-50">{lang === "en" ? "Remove" : "הסרה"}</button></div>}</td></tr>)}</tbody></table></div>{rows.length === 0 && <div className="py-14 text-center"><p className="font-bold text-gray-700">{lang === "en" ? "No community updates yet" : "אין עדיין עדכוני קהילה"}</p><p className="mt-1 text-sm text-gray-400">{lang === "en" ? "Create an update for your linked campaign donors." : "אפשר ליצור עדכון לתורמי הקמפיינים המקושרים."}</p></div>}</section>
    {wizardOpen && <CreateUpdateWizard lang={lang} t={t} initialDraft={rows.find((row) => row.id === editingId)?.draft} targetOptions={{ campaigns: campaignOptions }} audiences={["campaigns", "all"]} busy={busy} error={error} onClose={() => { setWizardOpen(false); setEditingId(null); setError(""); }} onCreate={(draft) => void save(draft)} />}
  </div>;
}
