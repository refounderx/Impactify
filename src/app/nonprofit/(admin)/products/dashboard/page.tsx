"use client";
import { useState, Fragment } from "react";
import { Printer, FileText, Eye, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import StatHeader from "@/components/nonprofit-admin/StatHeader";
import SearchFilterBar from "@/components/nonprofit-admin/SearchFilterBar";
import ProductDetailPanel from "@/components/nonprofit-admin/ProductDetailPanel";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import { getAdminProductDetail } from "@/lib/nonprofit-admin-data";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import EditableText from "@/components/admin/EditableText";

const AS_OF = "12/08/23";

export default function ProductsDashboardPage() {
  const { lang, t } = useLang();
  const { data } = useSiteDataset("nonprofit_admin");
  const adminProductRows = data?.adminProductRows ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <EditableText tKey="adm.productsDashboardTitle" as="h1" className="text-3xl font-bold text-gray-800 mb-4 block" />
      <div className="flex items-center gap-3 mb-5 text-gray-400">
        <button className="hover:text-raz-teal"><Printer size={18} /></button>
        <button className="hover:text-raz-teal"><FileText size={18} /></button>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SearchFilterBar filterLabel={lang === "en" ? "Filter by activity area" : "אזור פעילות העמותה"} />
          <StatHeader
            stats={[
              { label: t("adm.activeProducts"), value: String(data?.adminProductsActiveCount ?? 0) },
              { label: `${t("adm.unitsDonated")} ${AS_OF})`, value: (data?.adminProductsTotalUnits ?? 0).toLocaleString("he-IL") },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir={lang === "en" ? "ltr" : "rtl"}>
            <thead>
              <tr className="border-b border-gray-100">
                {["שם המוצר", "הקמה", "סיום", "קמפיינים", "קהילות", "יחידה", "סה\"כ נתרם", "נתרמו", "הוקם ע\"י", "צפייה", "עריכה", ""].map((h) => (
                  <th key={h} className="pb-3 pt-1 text-raz-teal font-bold text-start px-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminProductRows.map((row, i) => {
                const expanded = expandedId === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-2 font-medium text-gray-800 whitespace-nowrap">{lang === "en" ? row.nameEn : row.name}</td>
                      <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{row.created}</td>
                      <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{row.ended}</td>
                      <td className="py-3 px-2 text-gray-500 font-numeric">{row.campaignsCount}</td>
                      <td className="py-3 px-2 text-gray-500 font-numeric">{row.communities}</td>
                      <td className="py-3 px-2 text-gray-500 font-numeric">{formatNIS(row.unitPrice)}</td>
                      <td className="py-3 px-2 font-bold text-gray-800 font-numeric">{formatNIS(row.totalRaised)}</td>
                      <td className="py-3 px-2 text-gray-500 font-numeric">{row.unitsDonated}</td>
                      <td className="py-3 px-2">
                        <div className="w-7 h-7 rounded-full bg-raz-teal/15 flex items-center justify-center text-raz-teal font-bold text-xs">
                          {row.ownerInitials}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <button className="w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20">
                          <Eye size={14} />
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button className="w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20">
                          <Pencil size={14} />
                        </button>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => setExpandedId(expanded ? null : row.id)}
                          className="w-7 h-7 rounded-full text-gray-400 flex items-center justify-center hover:bg-gray-100"
                        >
                          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={12} className="p-2">
                          <ProductDetailPanel detail={getAdminProductDetail(i)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
