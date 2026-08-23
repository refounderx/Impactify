"use client";

import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { useNgoAdminView } from "@/hooks/useNgoAdminView";
import AdminDataStatus from "@/components/nonprofit-admin/AdminDataStatus";
import { formatNIS } from "@/lib/mock-data";

export default function NgoDashboardPage() {
  const { lang } = useLang();
  const { data, loading, error, reload } = useNgoAdminView();
  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;
  const campaigns = data?.adminCampaignRows ?? [];
  return <div>
    <div className="flex items-center justify-between gap-4 mb-6">
      <div><h1 className="text-3xl font-bold text-gray-800">{lang === "en" ? "NGO dashboard" : "לוח בקרת עמותה"}</h1>
        <p className="text-sm text-gray-500">{lang === "en" ? "Live data from your Supabase tenant" : "נתונים חיים מהעמותה שלך"}</p></div>
      <Link href="/nonprofit/create-campaign" className="bg-raz-teal text-white px-4 py-2.5 rounded-xl font-bold text-sm">
        {lang === "en" ? "New campaign" : "קמפיין חדש"}
      </Link>
    </div>
    <div className="grid sm:grid-cols-3 gap-4 mb-6">
      <Metric label={lang === "en" ? "Active campaigns" : "קמפיינים פעילים"} value={String(data?.adminCampaignsActiveCount ?? 0)} />
      <Metric label={lang === "en" ? "Total raised" : "סך הכול גויס"} value={formatNIS(data?.adminCampaignsTotalRaised ?? 0)} />
      <Metric label={lang === "en" ? "Donations" : "תרומות"} value={String(data?.adminDonationsCount ?? 0)} />
    </div>
    <div className="bg-white rounded-2xl overflow-x-auto">
      <table className="w-full text-sm"><thead><tr className="border-b bg-gray-50 text-start">
        <th className="p-3">{lang === "en" ? "Campaign" : "קמפיין"}</th><th className="p-3">{lang === "en" ? "Raised" : "גויס"}</th>
        <th className="p-3">{lang === "en" ? "Products" : "מוצרים"}</th><th className="p-3">{lang === "en" ? "End date" : "תאריך סיום"}</th>
      </tr></thead><tbody>{campaigns.map((campaign) => <tr key={campaign.id} className="border-b last:border-0">
        <td className="p-3 font-medium">{lang === "en" ? campaign.nameEn : campaign.name}</td>
        <td className="p-3">{formatNIS(campaign.amountRaised)}</td><td className="p-3">{campaign.productsCount}</td><td className="p-3">{campaign.ended}</td>
      </tr>)}</tbody></table>
      {campaigns.length === 0 && <p className="p-8 text-center text-gray-500">{lang === "en" ? "No campaigns yet." : "אין קמפיינים עדיין."}</p>}
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-white rounded-2xl p-5"><p className="text-sm text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-900 mt-1">{value}</p></div>;
}
