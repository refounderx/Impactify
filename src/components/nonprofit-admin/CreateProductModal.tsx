"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { createNgoProduct, updateNgoProduct } from "@/lib/supabase/queries-ngo-admin";
import type { AdminProductRow } from "@/lib/nonprofit-admin-data";

export default function CreateProductModal({ onClose, onCreated, product }: {
  onClose: () => void;
  onCreated: (created?: { name: string; nameEn: string; price: number; emoji: string }) => void;
  product?: AdminProductRow | null;
}) {
  const { lang } = useLang();
  const editing = Boolean(product);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState({
    name: product?.name ?? "",
    nameEn: product?.nameEn ?? "",
    price: product?.unitPrice ? String(product.unitPrice) : "",
    emoji: product?.emoji ?? "",
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const values = {
        name: String(form.get("name") ?? ""),
        nameEn: String(form.get("nameEn") ?? ""),
        description: String(form.get("description") ?? ""),
        descriptionEn: String(form.get("descriptionEn") ?? ""),
        price: Number(form.get("price")),
        emoji: String(form.get("emoji") ?? ""),
      };
      if (product) await updateNgoProduct({ ...values, id: product.id, active: form.get("active") === "on" });
      else await createNgoProduct(values);
      onCreated({ name: values.name, nameEn: values.nameEn, price: values.price, emoji: values.emoji });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : (lang === "en" ? "Unable to save product" : "לא ניתן לשמור את המוצר"));
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-raz-teal";
  const previewName = lang === "en" ? (preview.nameEn || preview.name) : (preview.name || preview.nameEn);
  const previewPrice = Number(preview.price);
  const formattedPrice = Number.isFinite(previewPrice) && previewPrice > 0
    ? new Intl.NumberFormat(lang === "en" ? "en-IL" : "he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 2 }).format(previewPrice)
    : "₪—";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/45" onClick={onClose} aria-label={lang === "en" ? "Close" : "סגירה"} />
      <form onSubmit={submit} className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {lang === "en" ? (editing ? "Edit product" : "Create product") : (editing ? "עריכת מוצר" : "יצירת מוצר")}
          </h2>
          <button type="button" onClick={onClose} className="micro-hint micro-hint-below rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label={lang === "en" ? "Close window" : "סגירת החלון"}>
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            {lang === "en" ? "Product name (Hebrew)" : "שם המוצר בעברית"}
            <input name="name" required maxLength={120} value={preview.name} onChange={(event) => setPreview((current) => ({ ...current, name: event.target.value }))} className={`interactive-field ${inputClass} mt-1`} />
          </label>
          <label className="text-sm font-medium text-gray-700">
            {lang === "en" ? "Product name (English)" : "שם המוצר באנגלית"}
            <input name="nameEn" maxLength={120} value={preview.nameEn} onChange={(event) => setPreview((current) => ({ ...current, nameEn: event.target.value }))} className={`interactive-field ${inputClass} mt-1`} dir="ltr" />
          </label>
          <label className="text-sm font-medium text-gray-700">
            {lang === "en" ? "Unit price (₪)" : "מחיר ליחידה (₪)"}
            <input name="price" type="number" required min="0.01" max="10000000" step="0.01" value={preview.price} onChange={(event) => setPreview((current) => ({ ...current, price: event.target.value }))} className={`interactive-field ${inputClass} mt-1`} dir="ltr" />
          </label>
          <label className="text-sm font-medium text-gray-700">
            {lang === "en" ? "Emoji" : "אימוג׳י"}
            <input name="emoji" maxLength={16} placeholder="💙" value={preview.emoji} onChange={(event) => setPreview((current) => ({ ...current, emoji: event.target.value }))} className={`interactive-field ${inputClass} mt-1`} />
          </label>
          <label className="text-sm font-medium text-gray-700 sm:col-span-2">
            {lang === "en" ? "Description (Hebrew)" : "תיאור בעברית"}
            <textarea name="description" maxLength={1000} rows={3} defaultValue={product?.description} className={`${inputClass} mt-1 resize-y`} />
          </label>
          <label className="text-sm font-medium text-gray-700 sm:col-span-2">
            {lang === "en" ? "Description (English)" : "תיאור באנגלית"}
            <textarea name="descriptionEn" maxLength={1000} rows={3} defaultValue={product?.descriptionEn} className={`${inputClass} mt-1 resize-y`} dir="ltr" />
          </label>
          {editing && (
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 sm:col-span-2">
              <input name="active" type="checkbox" defaultChecked={product?.active} className="h-4 w-4 accent-raz-teal" />
              {lang === "en" ? "Product is active" : "המוצר פעיל"}
            </label>
          )}
          </div>
          <aside className="live-preview-card self-start rounded-2xl border border-gray-100 bg-raz-surface p-4" aria-label={lang === "en" ? "Live product preview" : "תצוגה מקדימה של המוצר"}>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">{lang === "en" ? "Live preview" : "תצוגה חיה"}</p>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm" aria-hidden="true">{preview.emoji || "💙"}</div>
            <h3 className="mt-4 min-h-12 text-lg font-bold leading-6 text-raz-dark">{previewName || (lang === "en" ? "Your product" : "המוצר שלכם")}</h3>
            <p className="mt-4 text-xs text-gray-400">{lang === "en" ? "One unit funds" : "יחידה אחת מממנת"}</p>
            <p className="mt-1 font-numeric text-2xl font-bold text-raz-teal" aria-live="polite">{formattedPrice}</p>
          </aside>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="interactive-control rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 disabled:opacity-50">
            {lang === "en" ? "Cancel" : "ביטול"}
          </button>
          <button type="submit" disabled={saving} className="interactive-control inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-raz-teal px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
            {saving
              ? (lang === "en" ? "Saving…" : "שומר…")
              : (lang === "en" ? (editing ? "Save changes" : "Create product") : (editing ? "שמירת שינויים" : "יצירת מוצר"))}
          </button>
        </div>
      </form>
    </div>
  );
}
