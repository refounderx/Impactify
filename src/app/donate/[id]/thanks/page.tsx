"use client";
import Link from "next/link";
import { getCampaign, getOrg, formatNIS } from "@/lib/mock-data";
import { CheckCircle2, Download, Share2 } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useParams, useSearchParams } from "next/navigation";
import EditableText from "@/components/admin/EditableText";

export default function ThanksPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { lang } = useLang();
  const campaign = getCampaign(id) ?? getCampaign("1")!;
  const org = getOrg(campaign.orgId);
  const amount = parseInt(searchParams.get("amount") ?? "100") || 100;
  const receiptNum = `R-2026-${String(Date.now()).slice(-4)}`;
  const campaignTitle = lang === "en" ? (campaign.titleEn ?? campaign.title) : campaign.title;
  const orgName = lang === "en" ? (org?.nameEn ?? org?.name) : org?.name;

  return (
    <div className="flex flex-col min-h-screen bg-raz-surface">
      <div className="max-w-2xl mx-auto w-full px-6 py-12 flex flex-col items-center text-center">
        {/* Success */}
        <div className="w-24 h-24 bg-raz-success/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={52} className="text-raz-success" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2"><EditableText tKey="thanks.title" /></h1>
        <p className="text-gray-500 mb-8"><EditableText tKey="thanks.sub" /></p>

        {/* Amount card */}
        <div className={`bg-gradient-to-br ${campaign.gradient} text-white rounded-2xl px-10 py-6 w-full mb-6`}>
          <p className="text-white/80 mb-1">{orgName}</p>
          <p className="font-medium text-lg">{campaignTitle}</p>
          <p className="text-5xl font-bold font-numeric mt-3">{formatNIS(amount)}</p>
        </div>

        {/* Receipt */}
        <div className="bg-white rounded-2xl p-5 w-full mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm"><EditableText tKey="thanks.receiptNum" /></span>
            <span className="font-medium font-numeric text-sm">{receiptNum}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm"><EditableText tKey="thanks.date" /></span>
            <span className="font-medium text-sm">27.06.2026</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm"><EditableText tKey="thanks.sentTo" /></span>
            <span className="font-medium text-sm" dir="ltr">israel@example.com</span>
          </div>
        </div>

        {/* Share */}
        <div className="bg-white rounded-2xl p-5 w-full mb-6">
          <p className="font-bold text-gray-700 mb-1"><EditableText tKey="thanks.shareTitle" /></p>
          <p className="text-sm text-gray-500 mb-4"><EditableText tKey="thanks.shareSub" /></p>
          <div className="flex gap-3 justify-center">
            <button className="bg-green-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2">
              <Share2 size={16} /> WhatsApp
            </button>
            <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2">
              <Share2 size={16} /> Facebook
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button className="flex items-center justify-center gap-2 border border-raz-teal text-raz-teal py-3.5 rounded-xl font-medium">
            <Download size={18} /> <EditableText tKey="thanks.downloadReceipt" />
          </button>
          <Link href="/" className="bg-raz-teal text-white py-3.5 rounded-xl font-bold text-center block">
            <EditableText tKey="thanks.backHome" />
          </Link>
        </div>
      </div>
    </div>
  );
}
