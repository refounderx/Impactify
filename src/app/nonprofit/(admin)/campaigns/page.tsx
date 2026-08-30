"use client";
import { useState } from "react";
import Link from "next/link";
import { Pencil, Eye, X } from "lucide-react";
import DonutChart from "@/components/nonprofit-admin/DonutChart";
import CampaignDetailPanel from "@/components/nonprofit-admin/CampaignDetailPanel";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import { useNgoAdminView } from "@/hooks/useNgoAdminView";
import AdminDataStatus from "@/components/nonprofit-admin/AdminDataStatus";
import EditableText from "@/components/admin/EditableText";

export default function CampaignsGridPage() {
  const { lang } = useLang();
  const { data, loading, error, reload } = useNgoAdminView();
  const [viewingCampaignId, setViewingCampaignId] = useState<string | null>(null);

  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;

  return (
    <div>
      <h1 className="mb-9 text-4xl font-extrabold tracking-tight text-raz-dark sm:text-5xl"><EditableText tKey="adm.campaignsGridTitle" /></h1>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3">
        {(data?.adminCampaignCards ?? []).map((c) => (
          <article key={c.id} className="relative flex min-h-[39rem] flex-col overflow-hidden rounded-[2rem] bg-white px-8 pb-7 pt-7 shadow-[0_12px_28px_rgba(15,23,42,0.12)] ring-1 ring-slate-100 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,23,42,0.14)]">
            <div className="absolute end-6 top-8 z-10 flex flex-col gap-3">
              <Link href={`/nonprofit/create-campaign?edit=${c.id}`} className="micro-hint flex h-11 w-11 items-center justify-center rounded-full bg-raz-teal text-white transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal" aria-label={lang === "en" ? `Edit ${c.titleEn}` : `עריכת ${c.title}`}>
                <Pencil size={17} aria-hidden="true" />
              </Link>
              <button type="button" onClick={() => setViewingCampaignId(c.id)} className="micro-hint flex h-11 w-11 items-center justify-center rounded-full bg-raz-teal text-white transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal" aria-label={lang === "en" ? `View details for ${c.titleEn}` : `פרטי ${c.title}`}>
                <Eye size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="flex h-52 items-center justify-center border-b border-slate-200 pe-12 text-8xl" aria-hidden="true">
              {c.emoji}
            </div>
            <div className="flex flex-1 flex-col items-center pt-7 text-center">
              <h2 className="text-3xl font-extrabold leading-tight text-raz-dark">{lang === "en" ? c.titleEn : c.title}</h2>
              <p className="mt-7 text-xl font-bold text-raz-dark">{lang === "en" ? "Total donations to this campaign:" : "סה\"כ תרומות לקמפיין זה:"}</p>
              <DonutChart
                filled={c.raised}
                total={c.goal}
                centerValue={formatNIS(c.goal)}
                filledLabel={formatNIS(c.raised)}
                remainingLabel={formatNIS(c.goal - c.raised)}
              />
            </div>
            <p className="flex items-center justify-center gap-1.5 pt-3 text-sm font-bold text-raz-teal">
              <span className={`w-2 h-2 rounded-full ${c.ended ? "bg-gray-300" : "bg-raz-success"}`} />
              {c.ended
                ? (lang === "en" ? `Ended on ${c.endDate}` : `הסתיים בתאריך ${c.endDate}`)
                : (lang === "en" ? `Ends on ${c.endDate}` : `מסתיים בתאריך ${c.endDate}`)}
            </p>
          </article>
        ))}
        {(data?.adminCampaignCards ?? []).length === 0 && <p className="col-span-full rounded-2xl bg-white p-10 text-center text-gray-500">{lang === "en" ? "No campaigns yet." : "אין קמפיינים עדיין."}</p>}
      </div>
      {viewingCampaignId && data?.adminCampaignDetails[viewingCampaignId] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={lang === "en" ? "Campaign details" : "פרטי קמפיין"}>
          <button type="button" className="absolute inset-0 bg-black/45" onClick={() => setViewingCampaignId(null)} aria-label={lang === "en" ? "Close" : "סגירה"} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <button type="button" onClick={() => setViewingCampaignId(null)} className="micro-hint mb-3 flex h-11 w-11 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100" aria-label={lang === "en" ? "Close window" : "סגירת החלון"}><X size={20} /></button>
            <CampaignDetailPanel detail={data.adminCampaignDetails[viewingCampaignId]} />
          </div>
        </div>
      )}
    </div>
  );
}
