"use client";
import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import EditableText from "@/components/admin/EditableText";

export type PersonalDetails = { name: string; email: string; phone: string; declineUpdates: boolean };

export default function StepPersonalDetails({
  total,
  itemCount,
  productLabel,
  onContinue,
}: {
  total: number;
  itemCount: number;
  productLabel: string;
  onContinue: (details: PersonalDetails) => void;
}) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [declineUpdates, setDeclineUpdates] = useState(false);

  return (
    <div>
      <div className="text-center mb-6">
        <p className="text-3xl font-bold font-numeric text-gray-900">{formatNIS(total)}</p>
        <p className="text-sm text-gray-500 mt-1">{itemCount} {productLabel}</p>
      </div>

      <EditableText tKey="landing.checkout.personalTitle" as="h3" className="font-bold text-gray-900 mb-1 block" />
      <EditableText tKey="landing.checkout.personalSub" as="p" className="text-xs text-gray-400 mb-4 block" />

      <div className="flex flex-col gap-3 mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("landing.checkout.namePH")} className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={t("landing.checkout.emailPH")} className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder={t("landing.checkout.phonePH")} className="border border-gray-200 rounded-xl px-4 py-3 text-sm" />
      </div>

      <button
        onClick={() => onContinue({ name, email, phone, declineUpdates })}
        className="w-full bg-raz-teal text-white font-bold py-3 rounded-full mb-3"
      >
        <EditableText tKey="landing.checkout.continueFrequency" />
      </button>

      <label className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <input type="checkbox" checked={declineUpdates} onChange={(e) => setDeclineUpdates(e.target.checked)} />
        <EditableText tKey="landing.checkout.declineUpdates" />
      </label>
    </div>
  );
}
