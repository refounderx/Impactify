"use client";
import { Bell, Download, FileText, ArrowLeft, CheckCircle, Edit2, XCircle } from "lucide-react";
import type { ProductDonation } from "@/lib/mock-data";

interface Props {
  donation: ProductDonation;
  lang: string;
  t: (key: string) => string;
  onDonateAgain: () => void;
  onShowReceipts: () => void;
  onShowCertificate: () => void;
}

export default function DonationCard({ donation, lang, t, onDonateAgain, onShowReceipts, onShowCertificate }: Props) {
  const isDark = donation.variant === "dark";
  const name = lang === "en" ? donation.productNameEn : donation.productName;
  const detail = lang === "en" ? donation.productDetailEn : donation.productDetail;

  const bg     = isDark ? "bg-gray-900"   : "bg-white";
  const text   = isDark ? "text-white"    : "text-gray-800";
  const sub    = isDark ? "text-gray-300" : "text-gray-500";
  const border = isDark ? "border-gray-700" : "border-gray-100";

  return (
    <div className={`${bg} rounded-2xl shadow-sm overflow-hidden flex flex-col border ${border}`}>

      {/* Header row */}
      <div className={`flex items-center justify-between px-4 pt-3 pb-2`}>
        <p className={`text-xs ${sub}`}>
          {lang === "en" ? "Last donation:" : "תרומה אחרונה:"}{" "}
          {donation.lastDonationDate}
          {donation.lastDonationTime && ` | ${donation.lastDonationTime}`}
        </p>
        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
          <Bell size={11} />
          {lang === "en" ? "Updates" : "עדכונים"}
        </span>
      </div>

      {/* Content: image + quantity + info */}
      <div className="flex items-start gap-3 px-4 pb-3 flex-1">
        {/* Product image placeholder (RIGHT in RTL = first in DOM) */}
        <div className={`w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-4xl overflow-hidden ${isDark ? "bg-white/10" : "bg-gray-50"}`}>
          {donation.emoji ?? "📦"}
        </div>

        {/* Quantity + text (LEFT in RTL) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-raz-teal leading-none font-numeric">
              {donation.quantity}
            </span>
          </div>
          <p className={`font-bold text-sm leading-snug mt-0.5 ${text}`}>{name}</p>
          <p className={`text-xs mt-0.5 ${sub}`}>{detail}</p>
          <p className={`text-xs mt-0.5 ${sub}`}>{donation.orgCode}{donation.orgName}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-red-400 text-xs">❤️</span>
            <span className="text-xs" style={{ fontSize: 11 }}>😊</span>
            <span className={`text-xs ${sub}`}>{donation.donorCount} {lang === "en" ? "donors" : "בחרו לתרום"}</span>
          </div>
        </div>
      </div>

      {/* CTA button row */}
      <div className="px-4 pb-3">
        {donation.hasStandingOrder ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle size={14} />
              {lang === "en" ? "I have a standing order" : "יש לי הוראת קבע"}
            </span>
            <button className={`flex items-center gap-1 text-xs ${sub} hover:text-raz-teal`}>
              <Edit2 size={12} />
              {lang === "en" ? "Edit" : "עריכה"}
            </button>
            <button className={`flex items-center gap-1 text-xs ${sub} hover:text-red-500`}>
              <XCircle size={12} />
              {lang === "en" ? "Stop" : "עצירה"}
            </button>
          </div>
        ) : isDark ? (
          <div className="flex flex-col gap-2">
            <button className={`text-xs text-raz-teal font-medium text-start`}>
              {lang === "en" ? "Go to product page →" : "מעבר לעמוד המוצר"}
            </button>
            <button
              onClick={onDonateAgain}
              className="w-full border-2 border-raz-teal text-raz-teal rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-raz-teal/10 transition-colors"
            >
              <ArrowLeft size={15} />
              {lang === "en" ? "I want a standing order!" : "אני רוצה לתרום קבוע!"}
            </button>
          </div>
        ) : (
          <button
            onClick={onDonateAgain}
            className="w-full bg-raz-teal text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-teal-500 transition-colors"
          >
            <ArrowLeft size={15} />
            {t("myDon.donateAgain")}
          </button>
        )}
      </div>

      {/* Bottom action buttons */}
      <div className={`border-t ${border} grid grid-cols-2 divide-x ${border}`} dir="ltr">
        <button
          onClick={onShowCertificate}
          className={`flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-raz-teal"}`}
        >
          <Download size={13} />
          {t("myDon.downloadCert")}
        </button>
        <button
          onClick={onShowReceipts}
          className={`flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-raz-teal"}`}
        >
          <FileText size={13} />
          {lang === "en" ? "Show receipts" : "הצג את הקבלות למוצר זה"}
        </button>
      </div>
    </div>
  );
}
