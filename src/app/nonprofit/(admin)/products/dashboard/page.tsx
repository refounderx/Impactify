"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Eye, Pencil, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useNgoAdminView } from "@/hooks/useNgoAdminView";
import AdminDataStatus from "@/components/nonprofit-admin/AdminDataStatus";
import CreateProductModal from "@/components/nonprofit-admin/CreateProductModal";
import ProductDetailPanel from "@/components/nonprofit-admin/ProductDetailPanel";
import { formatNIS } from "@/lib/mock-data";
import { type AdminProductRow } from "@/lib/nonprofit-admin-data";

type ActivityFilter = "all" | "active" | "inactive";

export default function ProductsDashboardPage() {
  const { lang } = useLang();
  const { data, loading, error, reload } = useNgoAdminView();
  const [query, setQuery] = useState("");
  const [activity, setActivity] = useState<ActivityFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductRow | null>(null);

  const products = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(lang === "en" ? "en" : "he");
    return (data?.adminProductRows ?? []).filter((product) => {
      const matchesActivity = activity === "all" || (activity === "active" ? product.active : !product.active);
      const matchesQuery = !normalized || `${product.name} ${product.nameEn}`.toLocaleLowerCase().includes(normalized);
      return matchesActivity && matchesQuery;
    });
  }, [activity, data?.adminProductRows, lang, query]);

  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;

  const closeModal = () => { setCreating(false); setEditingProduct(null); };
  const saved = () => { closeModal(); reload(); };

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold text-raz-teal">{lang === "en" ? "Your donation catalog" : "קטלוג התרומות של העמותה"}</p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 lg:text-5xl">{lang === "en" ? "My product management" : "ניהול המוצרים שלי"}</h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-500">{lang === "en" ? "Manage products, campaign connections and donation performance in one place." : "ניהול מוצרים, חיבורים לקמפיינים וביצועי תרומות במקום אחד."}</p>
        </div>
        <button onClick={() => setCreating(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-raz-dark px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal">
          <Plus size={17} aria-hidden="true" />{lang === "en" ? "Create product" : "יצירת מוצר"}
        </button>
      </div>

      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]" aria-label={lang === "en" ? "Product management" : "ניהול מוצרים"}>
        <div className="grid border-b border-slate-200 sm:grid-cols-2">
          <Metric label={lang === "en" ? "Active products" : "מוצרים פעילים"} value={data?.adminProductsActiveCount ?? 0} />
          <Metric label={lang === "en" ? "Units donated" : "יחידות שנתרמו"} value={data?.adminProductsTotalUnits ?? 0} bordered />
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="relative w-full max-w-md">
            <Search size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lang === "en" ? "Search products" : "חיפוש מוצרים"} className="min-h-11 w-full rounded-full border border-slate-200 bg-slate-50 ps-11 pe-4 text-sm outline-none transition focus:border-raz-teal focus:bg-white focus:ring-2 focus:ring-raz-teal/10" />
          </div>
          <label className="flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600">
            <SlidersHorizontal size={16} className="text-raz-teal" aria-hidden="true" /><span>{lang === "en" ? "Status" : "סינון לפי"}</span>
            <select value={activity} onChange={(event) => setActivity(event.target.value as ActivityFilter)} className="bg-transparent font-bold text-slate-800 outline-none">
              <option value="all">{lang === "en" ? "All products" : "כל המוצרים"}</option>
              <option value="active">{lang === "en" ? "Active" : "פעילים"}</option>
              <option value="inactive">{lang === "en" ? "Inactive" : "לא פעילים"}</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="text-raz-teal"><tr className="border-b border-slate-200">
              <th className="w-12 px-3 py-4" aria-label={lang === "en" ? "Details" : "פרטים"} />
              <Header>{lang === "en" ? "Product name" : "שם המוצר"}</Header><Header>{lang === "en" ? "Created" : "הקמה"}</Header><Header>{lang === "en" ? "Ended" : "סיום"}</Header><Header>{lang === "en" ? "Units donated" : "נתרמו"}</Header><Header>{lang === "en" ? "Total raised" : "סה״כ נתרם"}</Header><Header>{lang === "en" ? "Unit" : "יחידה"}</Header><Header>{lang === "en" ? "Campaigns" : "קמפיינים"}</Header><Header>{lang === "en" ? "Communities" : "קהילות"}</Header><Header>{lang === "en" ? "Owner" : "הוקם ע״י"}</Header><Header>{lang === "en" ? "View" : "צפייה"}</Header><Header>{lang === "en" ? "Edit" : "עריכה"}</Header>
            </tr></thead>
            <tbody>{products.map((product) => {
              const expanded = expandedId === product.id;
              return [
                <tr key={product.id} className="border-b border-slate-200 text-slate-800 transition-colors hover:bg-slate-50/80">
                  <td className="px-3 py-4 text-center"><RowToggle product={product} expanded={expanded} onClick={() => setExpandedId(expanded ? null : product.id)} /></td>
                  <td className="px-4 py-4 font-bold"><span className="me-2" aria-hidden="true">{product.emoji}</span>{lang === "en" ? product.nameEn : product.name}{!product.active && <span className="ms-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{lang === "en" ? "Inactive" : "לא פעיל"}</span>}</td>
                  <Cell>{product.created}</Cell><Cell>{product.ended}</Cell><Cell>{product.unitsDonated.toLocaleString()}</Cell><Cell>{formatNIS(product.totalRaised)}</Cell><Cell>{formatNIS(product.unitPrice)}</Cell><Cell>{product.campaignsCount}</Cell><Cell>{product.communities}</Cell>
                  <td className="px-4 py-4"><span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-raz-teal text-xs font-bold text-white">{product.ownerInitials}</span></td>
                  <td className="px-4 py-4"><ActionButton label={lang === "en" ? `View ${product.nameEn}` : `צפייה ב${product.name}`} onClick={() => setExpandedId(expanded ? null : product.id)}><Eye size={16} /></ActionButton></td>
                  <td className="px-4 py-4"><ActionButton label={lang === "en" ? `Edit ${product.nameEn}` : `עריכת ${product.name}`} onClick={() => setEditingProduct(product)}><Pencil size={16} /></ActionButton></td>
                </tr>,
                expanded && data?.adminProductDetails[product.id] && <tr key={`${product.id}-detail`} className="border-b border-slate-200"><td colSpan={12} className="p-0"><ProductDetailPanel detail={data.adminProductDetails[product.id]} /></td></tr>,
              ];
            })}</tbody>
          </table>
          {products.length === 0 && <EmptyState lang={lang} hasQuery={Boolean(query) || activity !== "all"} onCreate={() => setCreating(true)} />}
        </div>
      </section>

      {(creating || editingProduct) && <CreateProductModal product={editingProduct} onClose={closeModal} onCreated={saved} />}
    </div>
  );
}

function Metric({ label, value, bordered = false }: { label: string; value: number; bordered?: boolean }) {
  return <div className={`px-8 py-6 sm:px-10 ${bordered ? "border-t border-slate-200 sm:border-t-0 sm:border-s" : ""}`}><p className="text-sm font-bold text-slate-800">{label}</p><p className="mt-1 font-numeric text-4xl font-bold text-raz-teal lg:text-5xl">{value.toLocaleString("he-IL")}</p></div>;
}
function Header({ children }: { children: React.ReactNode }) { return <th className="whitespace-nowrap px-4 py-4 text-start text-xs font-bold">{children}</th>; }
function Cell({ children }: { children: React.ReactNode }) { return <td className="whitespace-nowrap px-4 py-4 font-numeric">{children}</td>; }
function ActionButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className="micro-hint inline-flex h-11 w-11 items-center justify-center rounded-full bg-raz-teal text-white transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal" aria-label={label}>{children}</button>; }
function RowToggle({ product, expanded, onClick }: { product: AdminProductRow; expanded: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className="micro-hint inline-flex h-11 w-11 items-center justify-center rounded-full text-raz-teal hover:bg-raz-teal/10" aria-expanded={expanded} aria-label={`${expanded ? "סגירת" : "פתיחת"} פרטי ${product.name}`}><ChevronDown size={18} className={`transition-transform ${expanded ? "rotate-180" : ""}`} /></button>; }
function EmptyState({ lang, hasQuery, onCreate }: { lang: "he" | "en"; hasQuery: boolean; onCreate: () => void }) { return <div className="px-6 py-14 text-center"><p className="text-slate-500">{lang === "en" ? (hasQuery ? "No products match this filter." : "No products yet.") : (hasQuery ? "לא נמצאו מוצרים שמתאימים לסינון." : "אין מוצרים עדיין.")}</p>{!hasQuery && <button onClick={onCreate} className="mt-4 rounded-full bg-raz-teal px-5 py-2.5 text-sm font-bold text-white">{lang === "en" ? "Create the first product" : "יצירת המוצר הראשון"}</button>}</div>; }
