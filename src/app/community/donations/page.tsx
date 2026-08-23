"use client";
import { CheckCircle2 } from "lucide-react";
import StatHeader from "@/components/nonprofit-admin/StatHeader";
import SearchFilterBar from "@/components/nonprofit-admin/SearchFilterBar";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import { useCommunityAdminView } from "@/hooks/useCommunityAdminView";
import AdminDataStatus from "@/components/nonprofit-admin/AdminDataStatus";
import EditableText from "@/components/admin/EditableText";

export default function CommunityDonationsPage() {
  const { lang, t } = useLang();
  const { data, loading, error, reload } = useCommunityAdminView();
  const rows = data?.communityDonationRows ?? [];

  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6"><EditableText tKey="adm.donationsTitle" /></h1>

      <div className="bg-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SearchFilterBar filterLabel={lang === "en" ? "Filter by activity area" : "אזור פעילות הקהילה"} />
          <StatHeader
            stats={[
              { label: t("adm.depositsCount"), value: (data?.communityDonationsCount ?? 0).toLocaleString("he-IL") },
              { label: `${t("adm.totalDonated")} (${lang === "en" ? "as of" : "נכון לתאריך"} ${data?.AS_OF ?? ""})`, value: formatNIS(data?.communityDonationsTotal ?? 0) },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir={lang === "en" ? "ltr" : "rtl"}>
            <thead>
              <tr className="border-b border-gray-100">
                {["תאריך", "שם התורם/ת", "קמפיין", "מוצר", "כמות", "סכום התרומה", "תדירות", "קבלה"].map((h) => (
                  <th key={h} className="pb-3 pt-1 text-raz-teal font-bold text-start px-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{row.date}</td>
                  <td className="py-3 px-2 font-medium text-gray-800 whitespace-nowrap">{row.donorName}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{row.campaign}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{row.product}</td>
                  <td className="py-3 px-2 text-gray-500 font-numeric">{row.quantity}</td>
                  <td className="py-3 px-2 font-bold text-gray-800 font-numeric">{formatNIS(row.amount)}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{lang === "en" ? row.frequencyEn : row.frequency}</td>
                  <td className="py-3 px-2">
                    <span className="w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center">
                      <CheckCircle2 size={14} />
                    </span>
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
