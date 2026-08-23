"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, Share2 } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useSearchParams } from "next/navigation";
import { formatNIS } from "@/lib/mock-data";
import EditableText from "@/components/admin/EditableText";

type Confirmation = {
  id: string;
  amount: number;
  receipt_id: string;
  created_at: string;
  campaigns: { title: string; title_en: string | null; gradient: string; emoji: string } | null;
  organizations: { name: string; name_en: string | null } | null;
};

export default function ThanksPage() {
  const searchParams = useSearchParams();
  const { lang } = useLang();
  const [donation, setDonation] = useState<Confirmation | null>(null);
  const [error, setError] = useState("");
  const id = searchParams.get("id");
  const receipt = searchParams.get("receipt");
  const missingReference = !id || !receipt;

  useEffect(() => {
    if (!id || !receipt) return;
    fetch(`/api/donations?id=${encodeURIComponent(id)}&receipt=${encodeURIComponent(receipt)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Confirmation not found");
        setDonation(result.donation);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Confirmation not found"));
  }, [id, receipt]);

  if (missingReference) return <div className="min-h-screen flex items-center justify-center text-red-500">Missing confirmation reference</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!donation) return <div className="min-h-screen bg-raz-surface animate-pulse" />;

  const campaignTitle = lang === "en" ? (donation.campaigns?.title_en ?? donation.campaigns?.title) : donation.campaigns?.title;
  const orgName = lang === "en" ? (donation.organizations?.name_en ?? donation.organizations?.name) : donation.organizations?.name;
  const date = new Date(donation.created_at).toLocaleDateString(lang === "en" ? "en-GB" : "he-IL");

  return (
    <div className="flex flex-col min-h-screen bg-raz-surface">
      <div className="max-w-2xl mx-auto w-full px-6 py-12 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-raz-success/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={52} className="text-raz-success" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2"><EditableText tKey="thanks.title" /></h1>
        <p className="text-gray-500 mb-8"><EditableText tKey="thanks.sub" /></p>

        <div className={`bg-gradient-to-br ${donation.campaigns?.gradient ?? "from-teal-400 to-blue-400"} text-white rounded-2xl px-10 py-6 w-full mb-6`}>
          <p className="text-white/80 mb-1">{orgName}</p>
          <p className="font-medium text-lg">{campaignTitle}</p>
          <p className="text-5xl font-bold font-numeric mt-3">{formatNIS(Number(donation.amount))}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 w-full mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm"><EditableText tKey="thanks.receiptNum" /></span>
            <span className="font-medium font-numeric text-sm">{donation.receipt_id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm"><EditableText tKey="thanks.date" /></span>
            <span className="font-medium text-sm">{date}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 w-full mb-6">
          <p className="font-bold text-gray-700 mb-1"><EditableText tKey="thanks.shareTitle" /></p>
          <p className="text-sm text-gray-500 mb-4"><EditableText tKey="thanks.shareSub" /></p>
          <div className="flex gap-3 justify-center">
            <button className="bg-green-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2"><Share2 size={16} /> WhatsApp</button>
            <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2"><Share2 size={16} /> Facebook</button>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button className="flex items-center justify-center gap-2 border border-raz-teal text-raz-teal py-3.5 rounded-xl font-medium"><Download size={18} /> <EditableText tKey="thanks.downloadReceipt" /></button>
          <Link href="/" className="bg-raz-teal text-white py-3.5 rounded-xl font-bold text-center block"><EditableText tKey="thanks.backHome" /></Link>
        </div>
      </div>
    </div>
  );
}
