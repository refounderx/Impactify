"use client";

import { useEffect, useState } from "react";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { addPaymentMethod, getDonorProfile, getPaymentMethods, removePaymentMethod, updateDonorProfile } from "@/lib/supabase/queries-profile";
import type { DonorProfile, PaymentMethod } from "@/lib/supabase/queries-profile";

const EMPTY: DonorProfile = { fullName: "", phone: "", email: "", idNumber: "", joinDate: "" };

export default function NgoProfileDetails({ userId }: { userId: string }) {
  const { lang } = useLang();
  const [details, setDetails] = useState(EMPTY);
  const [draft, setDraft] = useState(EMPTY);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [editing, setEditing] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [brand, setBrand] = useState("Visa");
  const [last4, setLast4] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([getDonorProfile(userId), getPaymentMethods(userId)]).then(([profile, saved]) => {
      setDetails(profile); setDraft(profile); setMethods(saved);
    });
  }, [userId]);

  async function saveDetails() {
    const ok = await updateDonorProfile(userId, draft);
    if (ok) { setDetails(draft); setEditing(false); }
    setMessage(ok ? (lang === "en" ? "Details saved" : "הפרטים נשמרו") : (lang === "en" ? "Could not save details" : "לא ניתן לשמור את הפרטים"));
  }

  async function addCard() {
    if (!/^\d{4}$/.test(last4)) { setMessage(lang === "en" ? "Enter exactly four digits" : "יש להזין ארבע ספרות בדיוק"); return; }
    const saved = await addPaymentMethod(userId, brand.trim() || "Card", last4);
    if (saved) { setMethods((current) => [saved, ...current]); setLast4(""); setAddingCard(false); }
    setMessage(saved ? (lang === "en" ? "Payment method added" : "אמצעי התשלום נוסף") : (lang === "en" ? "Could not add payment method" : "לא ניתן להוסיף אמצעי תשלום"));
  }

  async function removeCard(id: string) {
    if (await removePaymentMethod(userId, id)) setMethods((current) => current.filter((item) => item.id !== id));
  }

  const fields = [
    ["fullName", lang === "en" ? "Full name" : "שם מלא"],
    ["phone", lang === "en" ? "Phone" : "טלפון"],
    ["email", lang === "en" ? "Email" : "אימייל"],
    ["idNumber", lang === "en" ? "ID number" : "תעודת זהות"],
    ["joinDate", lang === "en" ? "Joined" : "תאריך הצטרפות"],
  ] as const;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-raz-dark">{lang === "en" ? "Personal details" : "פרטים אישיים"}</h2>
        <button type="button" onClick={() => { setDraft(details); setEditing((value) => !value); setMessage(""); }} className="micro-hint flex items-center gap-2 text-sm font-bold text-raz-teal" aria-label={lang === "en" ? "Edit personal details" : "עריכת פרטים אישיים"}><Pencil size={16} />{editing ? (lang === "en" ? "Cancel" : "ביטול") : (lang === "en" ? "Edit" : "עריכה")}</button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {fields.map(([key, label]) => <label key={key} className="text-sm font-medium text-gray-600">{label}<input value={draft[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} disabled={!editing || key === "email" || key === "joinDate"} dir={key === "email" ? "ltr" : undefined} className="mt-2 w-full rounded-xl border border-transparent bg-raz-surface px-3 py-2.5 text-gray-800 outline-none enabled:border-gray-200 enabled:bg-white enabled:focus:border-raz-teal disabled:cursor-default" /></label>)}
      </div>
      {editing && <button type="button" onClick={saveDetails} className="mt-5 rounded-xl bg-raz-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-600">{lang === "en" ? "Save details" : "שמירת פרטים"}</button>}

      <div className="mt-8 border-t border-gray-100 pt-6">
        <h3 className="font-bold text-raz-dark">{lang === "en" ? "Payment methods" : "אמצעי תשלום"}</h3>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {methods.map((method) => <div key={method.id} className="flex min-w-48 items-center gap-3 rounded-xl bg-raz-surface px-4 py-3"><CreditCard size={18} className="text-raz-teal" /><span className="flex-1 text-sm font-medium" dir="ltr">{method.brand} •••• {method.last4}</span><button type="button" onClick={() => removeCard(method.id)} className="micro-hint text-gray-400 hover:text-red-600" aria-label={lang === "en" ? "Remove payment method" : "הסרת אמצעי תשלום"}><Trash2 size={15} /></button></div>)}
          <button type="button" onClick={() => setAddingCard((value) => !value)} className="flex items-center gap-2 rounded-xl bg-raz-teal px-4 py-3 text-sm font-bold text-white"><Plus size={16} />{lang === "en" ? "Add payment method" : "הוספת אמצעי תשלום"}</button>
        </div>
        {addingCard && <div className="mt-4 flex max-w-lg flex-wrap gap-3 rounded-xl border border-gray-100 p-4"><input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder={lang === "en" ? "Card brand" : "סוג כרטיס"} className="min-w-32 flex-1 rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-raz-teal" /><input value={last4} onChange={(event) => setLast4(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" dir="ltr" placeholder="4 digits" className="w-28 rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-raz-teal" /><button type="button" onClick={addCard} className="rounded-xl bg-raz-dark px-4 py-2 text-sm font-bold text-white">{lang === "en" ? "Add" : "הוספה"}</button></div>}
      </div>
      {message && <p className="mt-4 text-sm text-gray-600" role="status">{message}</p>}
    </section>
  );
}
