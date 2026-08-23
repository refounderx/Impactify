"use client";
import Link from "next/link";
import { Pencil, Eye } from "lucide-react";
import DonutChart from "@/components/nonprofit-admin/DonutChart";
import { useLang } from "@/contexts/LanguageContext";
import { useNgoAdminView } from "@/hooks/useNgoAdminView";
import AdminDataStatus from "@/components/nonprofit-admin/AdminDataStatus";
import EditableText from "@/components/admin/EditableText";

export default function ProductsGridPage() {
  const { lang } = useLang();
  const { data, loading, error, reload } = useNgoAdminView();

  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;

  return (
    <div>
      <EditableText tKey="adm.productsGridTitle" as="h1" className="text-3xl font-bold text-gray-800 mb-6 block" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          href="/nonprofit/products/dashboard"
          className="bg-raz-dark rounded-2xl p-5 flex flex-col items-center justify-center text-center text-white min-h-[19rem] hover:bg-gray-800 transition-colors"
        >
          <EditableText tKey="adm.backToDashboard" as="p" className="font-bold text-lg leading-snug mb-2 block" />
        </Link>
        {(data?.adminProductCards ?? []).map((c) => (
          <div key={c.id} className="bg-white rounded-2xl p-4 relative">
            <div className="absolute top-4 end-4 flex flex-col gap-2">
              <button className="w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20">
                <Pencil size={13} />
              </button>
              <button className="w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20">
                <Eye size={13} />
              </button>
            </div>
            <div className="w-24 h-24 rounded-xl bg-gray-50 flex items-center justify-center text-5xl mb-3">
              {c.emoji}
            </div>
            <h3 className="font-bold text-gray-800 mb-1">{lang === "en" ? c.nameEn : c.name}</h3>
            <p className="text-xs text-gray-500 mb-1">
              {lang === "en" ? `Featured in ${c.campaignsCount} campaigns` : `מופיע ב-${c.campaignsCount} קמפיינים`}
            </p>
            <p className="text-xs text-gray-500 mb-1">{lang === "en" ? "Total units donated:" : "סה\"כ מוצרים שנתרמו:"}</p>
            <DonutChart
              filled={c.donated}
              total={c.goal}
              centerValue={c.goal.toLocaleString("he-IL")}
              filledLabel={c.donated.toLocaleString("he-IL")}
              remainingLabel={(c.goal - c.donated).toLocaleString("he-IL")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
