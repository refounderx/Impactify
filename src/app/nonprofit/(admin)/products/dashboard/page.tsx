"use client";

import { useLang } from "@/contexts/LanguageContext";
import { useNgoAdminView } from "@/hooks/useNgoAdminView";
import AdminDataStatus from "@/components/nonprofit-admin/AdminDataStatus";
import { formatNIS } from "@/lib/mock-data";

export default function ProductsDashboardPage() {
  const { lang } = useLang();
  const { data, loading, error, reload } = useNgoAdminView();
  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;
  const products = data?.adminProductRows ?? [];
  return <div>
    <h1 className="text-3xl font-bold text-gray-800 mb-6">{lang === "en" ? "Products dashboard" : "לוח בקרת מוצרים"}</h1>
    <div className="grid sm:grid-cols-2 gap-4 mb-6">
      <div className="bg-white rounded-2xl p-5"><p className="text-gray-500 text-sm">{lang === "en" ? "Active products" : "מוצרים פעילים"}</p><p className="text-2xl font-bold">{data?.adminProductsActiveCount ?? 0}</p></div>
      <div className="bg-white rounded-2xl p-5"><p className="text-gray-500 text-sm">{lang === "en" ? "Units donated" : "יחידות שנתרמו"}</p><p className="text-2xl font-bold">{data?.adminProductsTotalUnits ?? 0}</p></div>
    </div>
    <div className="bg-white rounded-2xl overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="border-b bg-gray-50"><th className="p-3 text-start">{lang === "en" ? "Product" : "מוצר"}</th><th className="p-3 text-start">{lang === "en" ? "Unit price" : "מחיר יחידה"}</th><th className="p-3 text-start">{lang === "en" ? "Campaigns" : "קמפיינים"}</th><th className="p-3 text-start">{lang === "en" ? "Raised" : "גויס"}</th></tr></thead>
      <tbody>{products.map((product) => <tr key={product.id} className="border-b last:border-0"><td className="p-3 font-medium">{lang === "en" ? product.nameEn : product.name}</td><td className="p-3">{formatNIS(product.unitPrice)}</td><td className="p-3">{product.campaignsCount}</td><td className="p-3">{formatNIS(product.totalRaised)}</td></tr>)}</tbody>
    </table>{products.length === 0 && <p className="p-8 text-center text-gray-500">{lang === "en" ? "No products yet." : "אין מוצרים עדיין."}</p>}</div>
  </div>;
}
