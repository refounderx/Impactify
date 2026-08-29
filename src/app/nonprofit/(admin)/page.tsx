"use client";

import Link from "next/link";
import { ChevronDown, FileText, Pencil, Printer, Search } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useNgoAdminView } from "@/hooks/useNgoAdminView";
import AdminDataStatus from "@/components/nonprofit-admin/AdminDataStatus";
import { formatNIS } from "@/lib/mock-data";
import CampaignDetailPanel from "@/components/nonprofit-admin/CampaignDetailPanel";
import { getNgoCampaignRequests, manageNgoCampaignRequest, type CampaignJoinRequest } from "@/lib/supabase/queries-campaign-requests";

export default function NgoDashboardPage() {
  const { lang } = useLang();
  const { data, loading, error, reload } = useNgoAdminView();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [requests, setRequests] = useState<CampaignJoinRequest[]>([]);
  const [requestBusy, setRequestBusy] = useState<string | null>(null);
  useEffect(() => { void getNgoCampaignRequests().then(setRequests).catch(() => setRequests([])); }, []);
  async function decideRequest(request: CampaignJoinRequest, action: "approve" | "reject") { setRequestBusy(request.community_campaign_id); try { await manageNgoCampaignRequest(request.community_campaign_id, action); setRequests((current) => current.filter((item) => item.community_campaign_id !== request.community_campaign_id)); } finally { setRequestBusy(null); } }
  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;
  const campaigns = (data?.adminCampaignRows ?? []).filter((campaign) => !query.trim() || `${campaign.name} ${campaign.nameEn}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <div>
    <div className="mb-8 flex items-end justify-between gap-4">
      <div><p className="mb-2 text-sm font-bold text-raz-teal">{lang === "en" ? "Campaign catalog" : "קטלוג הקמפיינים של העמותה"}</p><h1 className="text-4xl font-extrabold tracking-tight text-gray-950 lg:text-5xl">{lang === "en" ? "My campaign management" : "ניהול הקמפיינים שלי"}</h1><p className="mt-3 text-sm text-gray-500">{lang === "en" ? "Manage campaigns and donation activity in one place." : "ניהול קמפיינים, חיבורים וביצועי תרומות במקום אחד."}</p></div>
      <Link href="/nonprofit/create-campaign" className="inline-flex items-center gap-2 rounded-full bg-raz-dark px-5 py-3 text-sm font-bold text-white"><span>＋</span>{lang === "en" ? "Create campaign" : "יצירת קמפיין"}</Link>
    </div>
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      {requests.length > 0 && <div className="border-b border-slate-200 bg-teal-50/60 px-8 py-5"><h2 className="font-bold text-slate-900">{lang === "en" ? "Campaign join requests" : "בקשות הצטרפות לקמפיינים"}</h2><div className="mt-3 space-y-2">{requests.map((request) => <div key={request.community_campaign_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm"><span>{request.community_name} · {request.campaign_title}</span><span className="flex gap-2"><button disabled={requestBusy === request.community_campaign_id} onClick={() => void decideRequest(request, "reject")} className="rounded-lg px-3 py-1.5 text-red-600 hover:bg-red-50">{lang === "en" ? "Reject" : "דחייה"}</button><button disabled={requestBusy === request.community_campaign_id} onClick={() => void decideRequest(request, "approve")} className="rounded-lg bg-raz-teal px-3 py-1.5 font-bold text-white">{lang === "en" ? "Approve" : "אישור"}</button></span></div>)}</div></div>}
      <div className="grid border-b border-slate-200 sm:grid-cols-2"><Metric label={lang === "en" ? "Active campaigns" : "קמפיינים פעילים"} value={String(data?.adminCampaignsActiveCount ?? 0)} /><Metric label={lang === "en" ? "Total raised" : "סך הכול גויס"} value={formatNIS(data?.adminCampaignsTotalRaised ?? 0)} bordered /></div>
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-8 py-5"><div className="relative w-full max-w-md"><Search size={17} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lang === "en" ? "Search campaigns" : "חיפוש קמפיינים"} className="min-h-10 w-full rounded-full border border-slate-200 bg-slate-50 ps-10 pe-4 text-sm outline-none focus:border-raz-teal" /></div><div className="flex gap-3 text-slate-400"><Printer size={17} /><FileText size={17} /></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-sm"><thead><tr className="border-b border-slate-200 text-raz-teal">{["Campaign","Created","End","Products","Donated","Raised","Communities","Owner","View","Edit",""].map((header) => <th key={header} className="whitespace-nowrap px-4 py-4 text-start text-xs font-bold">{lang === "en" ? header : ({ Campaign:"שם הקמפיין",Created:"הקמה",End:"סיום",Products:"מוצרים",Donated:"מוצרים שגויסו",Raised:"סכום שגויס",Communities:"קהילות",Owner:"הוקם ע״י",View:"צפייה",Edit:"עריכה" } as Record<string,string>)[header]}</th>)}</tr></thead><tbody>{campaigns.map((campaign) => { const expanded = expandedId === campaign.id; return <Fragment key={campaign.id}><tr className="border-b border-slate-200 hover:bg-slate-50"><td className="px-4 py-4 font-bold">{lang === "en" ? campaign.nameEn : campaign.name}</td><td className="px-4 py-4">{campaign.created}</td><td className="px-4 py-4">{campaign.ended}</td><td className="px-4 py-4">{campaign.productsCount}</td><td className="px-4 py-4">{campaign.productsRaisedCount}</td><td className="px-4 py-4 font-numeric">{formatNIS(campaign.amountRaised)}</td><td className="px-4 py-4">{campaign.communities}</td><td className="px-4 py-4"><span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-raz-teal text-xs font-bold text-white">{campaign.ownerInitials}</span></td><td className="px-4 py-4"><Link href={`/campaign/${campaign.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-raz-teal text-white" aria-label={lang === "en" ? "View campaign" : "צפייה בקמפיין"}>◉</Link></td><td className="px-4 py-4"><Link href={`/nonprofit/create-campaign?edit=${campaign.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-raz-teal text-white" aria-label={lang === "en" ? "Edit campaign" : "עריכת קמפיין"}><Pencil size={15} /></Link></td><td className="px-4 py-4"><button type="button" onClick={() => setExpandedId(expanded ? null : campaign.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-raz-teal hover:bg-raz-teal/10" aria-expanded={expanded} aria-label={expanded ? "סגירת פרטי הקמפיין" : "פתיחת פרטי הקמפיין"}><ChevronDown size={17} className={expanded ? "rotate-180" : ""} /></button></td></tr>{expanded && data?.adminCampaignDetails[campaign.id] && <tr><td colSpan={11} className="p-0"><CampaignDetailPanel detail={data.adminCampaignDetails[campaign.id]} /></td></tr>}</Fragment>; })}</tbody></table>{campaigns.length === 0 && <p className="p-10 text-center text-gray-500">{lang === "en" ? "No campaigns yet." : "אין קמפיינים עדיין."}</p>}</div>
    </section>
  </div>;
}

function Metric({ label, value, bordered = false }: { label: string; value: string; bordered?: boolean }) {
  return <div className={`px-8 py-6 sm:px-10 ${bordered ? "border-t border-slate-200 sm:border-t-0 sm:border-s" : ""}`}><p className="text-sm font-bold text-slate-800">{label}</p><p className="mt-1 font-numeric text-4xl font-bold text-raz-teal lg:text-5xl">{value}</p></div>;
}
