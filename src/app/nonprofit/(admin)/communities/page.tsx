"use client";
import { MoreVertical } from "lucide-react";
import StatHeader from "@/components/nonprofit-admin/StatHeader";
import SearchFilterBar from "@/components/nonprofit-admin/SearchFilterBar";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import EditableText from "@/components/admin/EditableText";

const AS_OF = "12/08/23";

export default function CommunitiesPage() {
  const { lang, t } = useLang();
  const { data } = useSiteDataset("nonprofit_admin");
  const adminCommunityRows = data?.adminCommunityRows ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800"><EditableText tKey="adm.communitiesTitle" /></h1>
        <button className="bg-raz-teal text-white rounded-xl px-5 py-2.5 font-bold text-sm hover:bg-raz-teal-dark transition-colors">
          <EditableText tKey="adm.sendUpdateToManagers" />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SearchFilterBar filterLabel={lang === "en" ? "Filter by activity area" : "אזור פעילות הקהילה"} />
          <StatHeader
            stats={[
              { label: t("adm.affiliatedCommunities"), value: String(data?.adminCommunitiesCount ?? 0) },
              { label: `${t("adm.communitiesRaisedToDate")} ${AS_OF})`, value: formatNIS(data?.adminCommunitiesTotalRaised ?? 0) },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir={lang === "en" ? "ltr" : "rtl"}>
            <thead>
              <tr className="border-b border-gray-100">
                {["שם הקהילה", "אזור פעילות", "תאריך שיוך", "קמפיינים פעילים", "מוצרים שנמכרו", "סה\"כ ניוסים", "איש קשר", "פעולות"].map((h) => (
                  <th key={h} className="pb-3 pt-1 text-raz-teal font-bold text-start px-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminCommunityRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-2 font-medium text-gray-800 whitespace-nowrap">{lang === "en" ? row.nameEn : row.name}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{lang === "en" ? row.activityAreaEn : row.activityArea}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{row.joinedDate}</td>
                  <td className="py-3 px-2 text-gray-500 font-numeric">{row.activeCampaigns}</td>
                  <td className="py-3 px-2 text-gray-500 font-numeric">{row.productsSold}</td>
                  <td className="py-3 px-2 font-bold text-gray-800 font-numeric">{formatNIS(row.totalRaised)}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap" dir="ltr">{row.contactPhone} – {row.contactName}</td>
                  <td className="py-3 px-2">
                    <button className="w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20">
                      <MoreVertical size={14} />
                    </button>
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
