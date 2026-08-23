"use client";
import { useState } from "react";
import { authProviders } from "@/lib/landing-data";
import EditableText from "@/components/admin/EditableText";

export default function SignupSection() {
  const [phone, setPhone] = useState("");

  return (
    <section className="max-w-md mx-auto px-6 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-8"><EditableText tKey="landing.signup.heading" /></h2>

      <label className="block text-sm text-gray-500 mb-2 text-start"><EditableText tKey="landing.signup.phoneLabel" /></label>
      <div className="flex gap-2 mb-6">
        <select className="border border-gray-200 rounded-xl px-3 py-3 text-sm" defaultValue="054">
          <option value="054">054</option>
          <option value="050">050</option>
          <option value="052">052</option>
        </select>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="545987654"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-sm"
        />
      </div>

      <p className="text-gray-400 text-sm mb-4"><EditableText tKey="landing.signup.orConnect" /></p>
      <div className="flex justify-center gap-4 mb-6">
        {authProviders.map((p) => (
          <button key={p.id} className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-700">
            {p.label}
          </button>
        ))}
      </div>

      <a href="/auth" className="text-raz-teal text-sm font-medium underline"><EditableText tKey="landing.signup.haveAccount" /></a>
    </section>
  );
}
