"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import EditableText from "@/components/admin/EditableText";

export default function SignupSection() {
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const { data } = useSiteDataset("landing");
  const authProviders = data?.authProviders ?? [];

  async function signInWithPhone() {
    const normalized = phone.replace(/\D/g, "");
    if (normalized.length < 9) { setMessage("יש להזין מספר טלפון תקין"); return; }
    setSending(true); setMessage("");
    const { error } = await createClient().auth.signInWithOtp({ phone: `+972${normalized.replace(/^0/, "")}` });
    setMessage(error ? error.message : "נשלח קוד אימות לטלפון"); setSending(false);
  }
  async function signInWithProvider(provider: "facebook" | "google" | "apple") {
    const { error } = await createClient().auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) setMessage(error.message);
  }
  return (
    <section className="max-w-md mx-auto px-6 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-8"><EditableText tKey="landing.signup.heading" /></h2>

      <label className="block text-sm text-gray-500 mb-2 text-start"><EditableText tKey="landing.signup.phoneLabel" /></label>
      <div className="flex gap-2 mb-6">
        <select className="interactive-field border border-gray-200 rounded-xl px-3 py-3 text-sm" defaultValue="054">
          <option value="054">054</option>
          <option value="050">050</option>
          <option value="052">052</option>
        </select>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="545987654"
          className="interactive-field flex-1 border border-gray-200 rounded-xl px-3 py-3 text-sm"
        />
        <button type="button" onClick={() => void signInWithPhone()} disabled={sending} className="interactive-control rounded-xl bg-raz-teal px-4 text-sm font-bold text-white disabled:opacity-50">{sending ? "…" : "המשך"}</button>
      </div>

      <p className="text-gray-400 text-sm mb-4"><EditableText tKey="landing.signup.orConnect" /></p>
      <div className="flex justify-center gap-4 mb-6">
        {authProviders.map((p) => (
          <button key={p.id} type="button" onClick={() => void signInWithProvider(p.id as "facebook" | "google" | "apple")} className="interactive-control w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-700">
            {p.label}
          </button>
        ))}
      </div>
      {message && <p className="mb-4 text-sm text-gray-600" role="status">{message}</p>}

      <a href="/auth" className="interactive-control inline-block text-raz-teal text-sm font-medium underline"><EditableText tKey="landing.signup.haveAccount" /></a>
    </section>
  );
}
