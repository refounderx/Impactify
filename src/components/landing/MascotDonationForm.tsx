"use client";
import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import EditableText from "@/components/admin/EditableText";
import { useAuth } from "@/contexts/AuthContext";

export default function MascotDonationForm() {
  const { t } = useLang();
  const { user, loading: authLoading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  if (authLoading || user) return null;

  return (
    <section className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="w-24 h-24 rounded-full bg-raz-teal/20 mx-auto mb-6 flex items-center justify-center text-4xl">😊</div>
      <h3 className="text-xl font-bold text-gray-900 mb-1"><EditableText tKey="landing.cta.mascotHeading1" /></h3>
      <p className="text-xl font-bold text-gray-900 mb-8"><EditableText tKey="landing.cta.mascotHeading2" /></p>

      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setSending(true); setError("");
          const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
          if (response.ok) setSubmitted(true); else setError(t("landing.cta.messagePH"));
          setSending(false);
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} type="email" placeholder={t("landing.cta.emailPH")} className="interactive-field border border-gray-200 rounded-xl px-4 py-3 text-sm" />
          <input value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} type="tel" placeholder={t("landing.cta.phonePH")} className="interactive-field border border-gray-200 rounded-xl px-4 py-3 text-sm" />
        </div>
        <input required value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} type="text" placeholder={t("landing.cta.namePH")} className="interactive-field border border-gray-200 rounded-xl px-4 py-3 text-sm" />
        <textarea required value={form.message} onChange={(e) => setForm((v) => ({ ...v, message: e.target.value }))} placeholder={t("landing.cta.messagePH")} rows={4} className="interactive-field border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none" />
        <button disabled={sending || submitted} type="submit" className="interactive-control bg-raz-teal text-white font-bold py-3 rounded-xl disabled:opacity-50">
          {submitted ? "✓" : sending ? "…" : <EditableText tKey="landing.cta.submit" />}
        </button>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </form>
    </section>
  );
}
