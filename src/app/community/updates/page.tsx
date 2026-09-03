"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Clock3, X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { decidePartnershipRequest, getPartnershipNotifications, getPartnershipRequests, type PartnershipNotification, type PartnershipRequest } from "@/lib/supabase/queries-partnerships";

export default function CommunityUpdatesPage() {
  const { lang } = useLang();
  const [inbox, setInbox] = useState<PartnershipRequest[]>([]);
  const [backlog, setBacklog] = useState<PartnershipRequest[]>([]);
  const [notifications, setNotifications] = useState<PartnershipNotification[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [nextInbox, nextBacklog, nextNotifications] = await Promise.all([getPartnershipRequests("inbox"), getPartnershipRequests("backlog"), getPartnershipNotifications()]);
      setInbox(nextInbox); setBacklog(nextBacklog); setNotifications(nextNotifications);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load partnership requests"); }
  }
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);

  async function decide(request: PartnershipRequest, action: "approve" | "reject") {
    setBusy(request.id); setError("");
    try { await decidePartnershipRequest(request.id, action); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save decision"); }
    finally { setBusy(null); }
  }

  return <div className="mx-auto max-w-5xl space-y-8">
    <header><p className="text-sm font-bold text-raz-teal">{lang === "en" ? "Calm partnership inbox" : "תיבת שותפויות רגועה"}</p><h1 className="mt-2 text-3xl font-black text-raz-dark">{lang === "en" ? "Partnership requests" : "בקשות שותפות"}</h1><p className="mt-2 text-slate-500">{lang === "en" ? "Review up to three invitations at a time. The queue stays available when you want to look ahead." : "בודקים עד שלוש הזמנות בכל פעם. התור המלא זמין כשרוצים להביט קדימה."}</p></header>
    {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
    {notifications[0] && <div className="flex items-center gap-3 rounded-2xl border border-raz-teal/20 bg-raz-teal/5 p-4 text-sm text-raz-dark"><Bell className="text-raz-teal" size={20} /><span>{lang === "en" ? `${notifications[0].total_waiting} requests are waiting; ${notifications[0].new_waiting} are new.` : `ממתינות ${notifications[0].total_waiting} בקשות, מתוכן ${notifications[0].new_waiting} חדשות.`}</span></div>}
    <section><h2 className="mb-4 text-xl font-black text-raz-dark">{lang === "en" ? "Your active review" : "בתיבה הפעילה"}</h2><div className="grid gap-4 md:grid-cols-3">{inbox.map((request) => <RequestCard key={request.id} request={request} busy={busy === request.id} lang={lang} onDecide={decide} />)}{Array.from({ length: Math.max(0, 3 - inbox.length) }, (_, index) => <div key={index} className="flex min-h-48 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">{lang === "en" ? "A free review slot" : "מקום פנוי בתיבה"}</div>)}</div></section>
    <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black text-raz-dark">{lang === "en" ? "Outreach backlog" : "תור הממתינים"}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{backlog.length}</span></div>{backlog.length ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{backlog.map((request) => <div key={request.id} className="flex items-center justify-between gap-4 border-b border-slate-100 p-4 last:border-0"><div><p className="font-bold text-raz-dark">{request.org_name}</p><p className="mt-1 text-sm text-slate-500">{request.campaign_title}</p></div><button type="button" onClick={() => void decide(request, "approve")} disabled={busy === request.id} className="interactive-control rounded-xl border border-raz-teal px-4 py-2 text-sm font-bold text-raz-teal">{lang === "en" ? "Approve now" : "אישור מיידי"}</button></div>)}</div> : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">{lang === "en" ? "Nothing else is waiting." : "אין בקשות נוספות בתור."}</p>}</section>
  </div>;
}

function RequestCard({ request, busy, lang, onDecide }: { request: PartnershipRequest; busy: boolean; lang: "he" | "en"; onDecide: (request: PartnershipRequest, action: "approve" | "reject") => Promise<void> }) {
  return <article className="onboarding-card min-h-48 rounded-2xl border border-slate-200 bg-white p-5"><Clock3 className="text-raz-teal" size={22} /><h3 className="mt-5 font-black text-raz-dark">{request.org_name}</h3><p className="mt-1 text-sm text-slate-500">{request.campaign_title}</p><div className="mt-5 flex gap-2"><button type="button" onClick={() => void onDecide(request, "reject")} disabled={busy} className="interactive-control inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600" aria-label={lang === "en" ? "Reject" : "דחייה"}><X size={18} /></button><button type="button" onClick={() => void onDecide(request, "approve")} disabled={busy} className="interactive-control flex-1 rounded-xl bg-raz-teal px-3 text-sm font-bold text-white"><Check className="mx-auto" size={18} /></button></div></article>;
}
