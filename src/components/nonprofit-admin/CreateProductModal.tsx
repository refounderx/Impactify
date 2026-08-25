"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { createNgoProduct } from "@/lib/supabase/queries-ngo-admin";

export default function CreateProductModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { lang } = useLang();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await createNgoProduct({
        name: String(form.get("name") ?? ""),
        nameEn: String(form.get("nameEn") ?? ""),
        description: String(form.get("description") ?? ""),
        descriptionEn: String(form.get("descriptionEn") ?? ""),
        price: Number(form.get("price")),
        emoji: String(form.get("emoji") ?? ""),
      });
      onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : (lang === "en" ? "Unable to create product" : "לא ניתן ליצור את המוצר"));
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-raz-teal";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/45" onClick={onClose} aria-label={lang === "en" ? "Close" : "סגירה"} />
      <form onSubmit={submit} className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{lang === "en" ? "Create product" : "יצירת מוצר"}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label={lang === "en" ? "Close" : "סגירה"}>
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            {lang === "en" ? "Product name (Hebrew)" : "שם המוצר בעברית"}
            <input name="name" required maxLength={120} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-sm font-medium text-gray-700">
            {lang === "en" ? "Product name (English)" : "שם המוצר באנגלית"}
            <input name="nameEn" maxLength={120} className={`${inputClass} mt-1`} dir="ltr" />
          </label>
          <label className="text-sm font-medium text-gray-700">
            {lang === "en" ? "Unit price (₪)" : "מחיר ליחידה (₪)"}
            <input name="price" type="number" required min="0.01" max="10000000" step="0.01" className={`${inputClass} mt-1`} dir="ltr" />
          </label>
          <label className="text-sm font-medium text-gray-700">
            {lang === "en" ? "Emoji" : "אימוג׳י"}
            <input name="emoji" maxLength={16} placeholder="💙" className={`${inputClass} mt-1`} />
          </label>
          <label className="text-sm font-medium text-gray-700 sm:col-span-2">
            {lang === "en" ? "Description (Hebrew)" : "תיאור בעברית"}
            <textarea name="description" maxLength={1000} rows={3} className={`${inputClass} mt-1 resize-y`} />
          </label>
          <label className="text-sm font-medium text-gray-700 sm:col-span-2">
            {lang === "en" ? "Description (English)" : "תיאור באנגלית"}
            <textarea name="descriptionEn" maxLength={1000} rows={3} className={`${inputClass} mt-1 resize-y`} dir="ltr" />
          </label>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 disabled:opacity-50">
            {lang === "en" ? "Cancel" : "ביטול"}
          </button>
          <button type="submit" disabled={saving} className="rounded-xl bg-raz-teal px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {saving ? (lang === "en" ? "Creating…" : "יוצר…") : (lang === "en" ? "Create product" : "יצירת מוצר")}
          </button>
        </div>
      </form>
    </div>
  );
}
