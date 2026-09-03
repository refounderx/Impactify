"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Building2, CalendarDays, Package, Users } from "lucide-react";
import DonutChart from "@/components/nonprofit-admin/DonutChart";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import type { CommunityCampaignRow } from "@/lib/community-admin-data";

const goalLabel = (goalType: CommunityCampaignRow["goalType"], lang: "he" | "en") => {
  const labels = {
    deadline: ["יעד עד לתאריך", "Deadline goal"],
    monthly: ["יעד חודשי", "Monthly goal"],
    annual: ["יעד שנתי", "Annual goal"],
  } as const;
  return labels[goalType][lang === "en" ? 1 : 0];
};

export default function CommunityCampaignDetailPanel({ row, communityId }: { row: CommunityCampaignRow; communityId: string }) {
  const { lang } = useLang();
  const isEnglish = lang === "en";
  const title = isEnglish ? row.nameEn : row.name;
  const description = isEnglish ? row.descriptionEn : row.description;

  return (
    <div className="bg-teal-50/70 px-4 py-5 sm:px-7 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-raz-teal">{isEnglish ? "Advanced campaign details" : "פרטי קמפיין מתקדמים"}</p>
          <p className="mt-1 text-sm text-slate-500">{title} · {goalLabel(row.goalType, lang)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/campaign/${row.id}?community_id=${encodeURIComponent(communityId)}`} className="rounded-full bg-raz-teal px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-teal-600">
            {isEnglish ? "Open campaign" : "לעמוד הקמפיין"}
          </Link>
          <Link href={`/organization/${row.orgId}`} className="rounded-full border border-raz-teal bg-white px-4 py-2 text-xs font-bold text-raz-teal transition-colors hover:bg-teal-50">
            {isEnglish ? "Nonprofit page" : "לעמוד העמותה"}
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric icon={<Users size={17} />} label={isEnglish ? "Donors through your community" : "תורמים דרך הקהילה"} value={String(row.donorCount)} />
            <Metric icon={<Package size={17} />} label={isEnglish ? "Products donated" : "מוצרים שנתרמו"} value={String(row.productsRaisedCount)} />
            <Metric icon={<Building2 size={17} />} label={isEnglish ? "Raised by your community" : "גויס דרך הקהילה"} value={formatNIS(row.amountRaised)} />
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-sm font-bold text-slate-700">{isEnglish ? "Campaign information" : "מידע על הקמפיין"}</p>
            {description && <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{isEnglish ? "Created" : "הוקם"}: {row.created}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{isEnglish ? "Goal date" : "מועד יעד"}: {row.ended}</span>
              <span className="inline-flex items-center gap-1.5"><Building2 size={15} />{isEnglish ? row.orgNameEn : row.orgName}</span>
            </div>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-sm font-bold text-slate-700">{isEnglish ? "Products supported by your community" : "מוצרים שנתמכו דרך הקהילה"}</p>
            {row.products.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{row.products.map((product) => <div key={product.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs"><span className="font-bold text-slate-700">{isEnglish ? product.nameEn : product.name}</span><span className="font-numeric text-raz-teal">{product.quantity} · {formatNIS(product.amount)}</span></div>)}</div> : <p className="mt-2 text-sm text-slate-500">{isEnglish ? "No product donations have been recorded through the community yet." : "עדיין לא נרשמו תרומות למוצרים דרך הקהילה."}</p>}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <p className="text-xs font-bold text-slate-600">{isEnglish ? "Campaign progress" : "התקדמות הקמפיין"}</p>
          <p className="mt-1 text-xs text-slate-400">{isEnglish ? `${row.campaignDonorCount} total donors` : `${row.campaignDonorCount} תורמים בקמפיין`}</p>
          <DonutChart filled={row.campaignRaised} total={row.campaignGoal} centerValue={formatNIS(row.campaignGoal)} filledLabel={formatNIS(row.campaignRaised)} remainingLabel={formatNIS(Math.max(0, row.campaignGoal - row.campaignRaised))} />
          <p className="text-xs text-slate-500">{isEnglish ? "Total campaign progress" : "התקדמות כללית בקמפיין"}</p>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><span className="flex items-center gap-2 text-xs text-slate-500">{icon}{label}</span><strong className="mt-2 block font-numeric text-xl text-raz-dark">{value}</strong></div>;
}
