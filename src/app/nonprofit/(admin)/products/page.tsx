"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, Pencil, Plus, X } from "lucide-react";
import EditableText from "@/components/admin/EditableText";
import AdminDataStatus from "@/components/nonprofit-admin/AdminDataStatus";
import CreateProductModal from "@/components/nonprofit-admin/CreateProductModal";
import DonutChart from "@/components/nonprofit-admin/DonutChart";
import ProductDetailPanel from "@/components/nonprofit-admin/ProductDetailPanel";
import { useLang } from "@/contexts/LanguageContext";
import { useNgoAdminView } from "@/hooks/useNgoAdminView";
import { type AdminProductCard, type AdminProductRow } from "@/lib/nonprofit-admin-data";

function ProductCard({ card, onEdit, onView }: { card: AdminProductCard; onEdit: () => void; onView: () => void }) {
  const { lang, t } = useLang();
  return (
    <article className="relative flex min-h-[39rem] flex-col overflow-hidden rounded-[2rem] bg-white px-8 pb-7 pt-7 shadow-[0_12px_28px_rgba(15,23,42,0.12)] ring-1 ring-slate-100 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,23,42,0.14)]">
      <div className="absolute end-6 top-8 z-10 flex flex-col gap-3">
        <button type="button" onClick={onEdit} className="micro-hint flex h-11 w-11 items-center justify-center rounded-full bg-raz-teal text-white transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal" aria-label={t("hint.edit")}>
          <Pencil size={17} />
        </button>
        <button type="button" onClick={onView} className="micro-hint flex h-11 w-11 items-center justify-center rounded-full bg-raz-teal text-white transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal" aria-label={t("hint.view")}>
          <Eye size={18} />
        </button>
      </div>
      <div className="relative flex h-52 items-center justify-center overflow-hidden border-b border-slate-200 pe-12 text-8xl" aria-hidden="true">{card.imageUrl ? <Image src={card.imageUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" /> : card.emoji}</div>
      <div className="flex flex-1 flex-col items-center pt-7 text-center">
        <h2 className="text-3xl font-extrabold leading-tight text-raz-dark">{lang === "en" ? card.nameEn : card.name}</h2>
        <p className="mt-6 text-base text-gray-500">
          {lang === "en" ? `Featured in ${card.campaignsCount} campaigns` : `מופיע ב־${card.campaignsCount} קמפיינים`}
        </p>
        <p className="mt-7 text-xl font-bold text-raz-dark">{lang === "en" ? "Total products donated:" : "סה״כ מוצרים שנתרמו:"}</p>
        <DonutChart filled={card.donated} total={card.goal} centerValue={card.goal.toLocaleString("he-IL")} filledLabel={card.donated.toLocaleString("he-IL")} remainingLabel={Math.max(0, card.goal - card.donated).toLocaleString("he-IL")} />
      </div>
    </article>
  );
}

function ManagementCard({ preview }: { preview?: AdminProductCard }) {
  return (
    <Link href="/nonprofit/products/dashboard" className="group relative flex min-h-[39rem] overflow-hidden rounded-[2rem] bg-raz-dark text-white shadow-[0_12px_28px_rgba(15,23,42,0.2)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,23,42,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-raz-teal">
      <div className="absolute inset-0 flex flex-col items-center opacity-15 transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none">
        <div className="flex h-44 w-full items-center justify-center border-b border-white/30 text-7xl" aria-hidden="true">{preview?.emoji ?? "💙"}</div>
        <div className="mt-20 h-40 w-40 rounded-full border-[30px] border-raz-teal" />
      </div>
      <div className="relative z-10 m-auto max-w-[16rem] px-6 text-center">
        <EditableText tKey="adm.backToDashboard" as="span" className="block text-3xl font-extrabold leading-tight" />
      </div>
    </Link>
  );
}

export default function ProductsGridPage() {
  const { lang } = useLang();
  const { data, loading, error, reload } = useNgoAdminView();
  const [editingProduct, setEditingProduct] = useState<AdminProductRow | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;

  const cards = data?.adminProductCards ?? [];
  const rows = data?.adminProductRows ?? [];
  const orderedCards = [...cards.slice(0, 2), "management" as const, ...cards.slice(2)];
  const productRow = (id: string) => rows.find((row) => row.id === id) ?? null;
  const saved = () => { setEditingProduct(null); setCreatingProduct(false); reload(); };

  return (
    <div className="mx-auto w-full max-w-[1500px] pb-10">
      <div className="mb-10 flex items-end justify-between gap-4">
        <EditableText tKey="adm.productsGridTitle" as="h1" className="block text-4xl font-extrabold tracking-tight text-raz-dark sm:text-5xl" />
        {cards.length === 0 && (
          <button type="button" onClick={() => setCreatingProduct(true)} className="flex min-h-11 items-center gap-2 rounded-xl bg-raz-teal px-5 py-3 font-bold text-white hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raz-teal">
            <Plus size={18} /> {lang === "en" ? "Create product" : "יצירת מוצר"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3">
        {orderedCards.map((item, index) => item === "management" ? (
          <ManagementCard key="management" preview={cards[0]} />
        ) : (
          <ProductCard key={item.id} card={item} onEdit={() => setEditingProduct(productRow(item.id))} onView={() => setViewingIndex(index > 2 ? index - 1 : index)} />
        ))}
      </div>

      {(creatingProduct || editingProduct) && <CreateProductModal product={editingProduct} onClose={() => { setEditingProduct(null); setCreatingProduct(false); }} onCreated={saved} />}
      {viewingIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={lang === "en" ? "Product details" : "פרטי מוצר"}>
          <button type="button" className="absolute inset-0 bg-black/45" onClick={() => setViewingIndex(null)} aria-label={lang === "en" ? "Close" : "סגירה"} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <button type="button" onClick={() => setViewingIndex(null)} className="micro-hint mb-3 flex h-11 w-11 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100" aria-label={lang === "en" ? "Close window" : "סגירת החלון"}><X size={20} /></button>
            {data?.adminProductDetails[rows[viewingIndex]?.id] && <ProductDetailPanel detail={data.adminProductDetails[rows[viewingIndex].id]} />}
          </div>
        </div>
      )}
    </div>
  );
}
