"use client";
import { useState } from "react";
import { Search, Printer, Copy, ChevronDown, ArrowDown } from "lucide-react";
import { formatNIS, type ProductDonation } from "@/lib/mock-data";
import { downloadDonationReceipt } from "@/lib/donation-documents";
import type { SharedSiteData } from "@/lib/site-dataset-types";
import QuarterlyView from "./QuarterlyView";

interface Props {
  lang: string;
  t: (key: string) => string;
  onTaxRefund: () => void;
  productDonations?: ProductDonation[];
  quarterlyData?: SharedSiteData["quarterlyDonationData"];
}

type SubTab = "all" | "quarterly";

const TODAY = "07/02/23";

export default function ManagePanel({ lang, t, onTaxRefund, productDonations, quarterlyData }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("all");
  const [search, setSearch] = useState("");

  const donations = productDonations ?? [];
  const allRows = donations.flatMap((pd) =>
    pd.receipts.map((r) => ({
      ...r,
      product: pd,
      productName: pd.productName,
      productNameEn: pd.productNameEn,
      org: "לחיות בכבוד",
    }))
  );
  const TOTAL = allRows.reduce((s, r) => s + r.amount, 0);

  const filtered = allRows.filter((r) =>
    r.productName.includes(search) ||
    r.productNameEn.toLowerCase().includes(search.toLowerCase()) ||
    r.date.includes(search)
  );

  return (
    <div className="mb-24">
      {/* Title */}
      <h1 className="text-4xl font-black text-gray-800 text-end mb-6">
        {lang === "en" ? "Donation Management" : "ניהול תרומות"}
      </h1>

      {/* Tab bar — RTL: first in DOM = rightmost on screen */}
      <div className="flex items-center justify-between mb-4">
        {/* RIGHT: grouped view tabs (segmented control) */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setSubTab("all")}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              subTab === "all" ? "bg-white shadow text-gray-800" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {lang === "en" ? "All Donations" : "צפייה בכל התרומות"}
          </button>
          <button
            onClick={() => setSubTab("quarterly")}
            className={`text-sm font-bold px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              subTab === "quarterly" ? "bg-white shadow text-gray-800" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {lang === "en" ? "Quarterly View" : "צפייה רבעונית בתרומות"}
          </button>
        </div>

        {/* LEFT: החזרי מס (teal filled, standalone) */}
        <button
          onClick={onTaxRefund}
          className="bg-raz-teal text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-teal-500 transition-colors"
        >
          {lang === "en" ? "Tax Refunds" : "החזרי מס"}
        </button>
      </div>

      {/* Content card */}
      <div className="bg-white rounded-2xl shadow-sm p-5">

        {/* ── ALL DONATIONS ── */}
        {subTab === "all" && (
          <>
            {/* Row 1: summary (RIGHT) + icons (LEFT) */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-end gap-8">
                <div className="text-start">
                  <p className="text-xs text-gray-400 mb-0.5">{lang === "en" ? "Total donated to date" : "עד היום תרמת"}</p>
                  <p className="text-3xl font-black text-raz-teal font-numeric">{formatNIS(TOTAL || 5678)}</p>
                </div>
                <div className="text-start">
                  <p className="text-xs text-gray-400 mb-0.5">{lang === "en" ? "As of date" : "נכון לתאריך"}</p>
                  <p className="text-3xl font-black text-gray-800">{TODAY}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-400 pt-1">
                <button className="micro-hint hover:text-gray-600" aria-label={t("hint.copy")}><Copy size={17} /></button>
                <button className="micro-hint hover:text-gray-600" aria-label={t("hint.print")}><Printer size={17} /></button>
              </div>
            </div>

            {/* Row 2: search + filters */}
            <div className="flex items-center gap-3 mb-5 flex-wrap justify-start">
              <div className="relative">
                <Search size={13} className="absolute end-2.5 top-2.5 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={lang === "en" ? "Search" : "חיפוש"}
                  className="border border-gray-200 rounded-lg pe-8 ps-3 py-2 text-sm w-32 focus:outline-none focus:border-raz-teal"
                  dir={lang === "en" ? "ltr" : "rtl"}
                />
              </div>
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-pointer hover:border-gray-300">
                <span className="text-gray-400 text-xs">{lang === "en" ? "Filter by" : "סנן לפי"}</span>
                <span className="font-medium">{lang === "en" ? "Dates" : "תאריכים"}</span>
                <ChevronDown size={13} className="text-gray-400" />
              </div>
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-pointer hover:border-gray-300">
                <span>{lang === "en" ? "Lowest donations" : "התרומות הנמוכות ביותר"}</span>
                <ChevronDown size={13} className="text-gray-400" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir={lang === "en" ? "ltr" : "rtl"}>
                <thead>
                  <tr className="border-b border-gray-100">
                    {["תאריך", "מוצר תרומה", "סכום", "סוג תרומה", "ע", "אמצעי תשלום", "הורדת קבלה"].map((h) => (
                      <th key={h} className="pb-3 pt-1 text-raz-teal text-sm font-bold text-start px-2 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-2 text-gray-700 whitespace-nowrap">{r.date}</td>
                      <td className="py-3.5 px-2 text-gray-800 max-w-[180px] truncate">
                        {lang === "en" ? r.productNameEn : r.productName}
                      </td>
                      <td className="py-3.5 px-2 font-bold text-gray-800 font-numeric">₪{r.amount}</td>
                      <td className="py-3.5 px-2 text-gray-600">{r.type}</td>
                      <td className="py-3.5 px-2 text-gray-500 whitespace-nowrap">{r.org}</td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-400 flex-shrink-0" />
                          <span className="text-gray-600">{r.paymentLast4}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <button type="button" onClick={() => downloadDonationReceipt(r.product, r)} className="micro-hint w-8 h-8 bg-raz-teal rounded-full flex items-center justify-center text-white hover:bg-teal-500 transition-colors" aria-label={t("hint.downloadReceipt")}>
                          <ArrowDown size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {subTab === "quarterly" && <QuarterlyView lang={lang} t={t} quarterlyData={quarterlyData} />}
      </div>
    </div>
  );
}
