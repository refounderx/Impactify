"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import DonutChart from "./DonutChart";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import type { AdminCampaignDetail } from "@/lib/nonprofit-admin-data";

const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר", "כל החודשים"];
const YEARS = ["2023", "2022", "2021", "כל השנים"];

export default function CampaignDetailPanel({ detail }: { detail: AdminCampaignDetail }) {
  const { lang } = useLang();
  const [month, setMonth] = useState(detail.monthLabel);
  const [year, setYear] = useState(YEARS[0]);
  const [openDropdown, setOpenDropdown] = useState<"month" | "year" | null>(null);
  const AS_OF = "12/08/23";

  return (
    <div className="bg-teal-50/50 rounded-xl p-5">
      <p className="text-sm font-bold text-gray-500 mb-4">
        {lang === "en" ? "Campaign SKU:" : "מק\"ט קמפיין:"} {detail.sku}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product breakdown */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex flex-col gap-2.5 mb-4">
            {detail.productBreakdown.map((p) => {
              const pct = Math.min(100, Math.round((p.donated / p.total) * 100));
              return (
                <div key={p.name} className="flex items-center gap-3 text-xs">
                  <span className="w-28 flex-shrink-0 text-gray-600 truncate">{lang === "en" ? p.nameEn : p.name}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
                    <div className="h-full bg-gray-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-end font-numeric text-gray-500">{p.donated}</span>
                  <span className="w-6 text-end font-numeric text-gray-400">{p.total}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <button
                onClick={() => setOpenDropdown(openDropdown === "month" ? null : "month")}
                className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 hover:border-gray-300"
              >
                {month}
                <ChevronDown size={13} className="text-gray-400" />
              </button>
              {openDropdown === "month" && (
                <div className="absolute z-10 top-9 start-0 end-0 bg-white border border-gray-100 rounded-lg shadow-lg py-1 max-h-52 overflow-y-auto">
                  {MONTHS.map((m) => (
                    <button
                      key={m}
                      onClick={() => { setMonth(m); setOpenDropdown(null); }}
                      className="block w-full text-start px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative flex-1">
              <button
                onClick={() => setOpenDropdown(openDropdown === "year" ? null : "year")}
                className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 hover:border-gray-300"
              >
                {year}
                <ChevronDown size={13} className="text-gray-400" />
              </button>
              {openDropdown === "year" && (
                <div className="absolute z-10 top-9 start-0 end-0 bg-white border border-gray-100 rounded-lg shadow-lg py-1">
                  {YEARS.map((y) => (
                    <button
                      key={y}
                      onClick={() => { setYear(y); setOpenDropdown(null); }}
                      className="block w-full text-start px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {lang === "en" ? "Total donations received in " : "סה\"כ תרומות שהתקבלו בקמפיין "}
            <span className="text-raz-teal font-bold">{lang === "en" ? detail.monthLabelEn : `בחודש ${month}`}</span>
          </p>
          <p className="text-xs text-gray-400 mb-1">({lang === "en" ? "as of" : "נכון לתאריך"} {AS_OF})</p>
          <p className="text-xl font-bold text-gray-800 font-numeric">{formatNIS(detail.monthlyTotal)}</p>
        </div>

        {/* Donut */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">
            {lang === "en" ? "Total donations received for this campaign" : "סה\"כ תרומות שהתקבלו בקמפיין"}
          </p>
          <p className="text-xs text-gray-400 mb-1">({lang === "en" ? "as of" : "נכון לתאריך"} {AS_OF})</p>
          <DonutChart
            filled={detail.raised}
            total={detail.goal}
            centerValue={formatNIS(detail.goal)}
            filledLabel={formatNIS(detail.raised)}
            remainingLabel={formatNIS(detail.goal - detail.raised)}
          />
          <div className="flex items-center justify-center gap-5 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-raz-teal" />{lang === "en" ? "Donations received" : "תרומות שהתקבלו"}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300" />{lang === "en" ? "Remaining to goal" : "נותר ליעד"}</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-bold text-gray-700 mb-3">
          {lang === "en" ? "Communities linked to this campaign" : "קהילות המקושרות לקמפיין זה"}
        </p>
        <div className="flex flex-wrap gap-3">
          {detail.communities.map((c) => (
            <span key={c} className="flex items-center gap-2 bg-white border border-gray-100 rounded-full ps-1.5 pe-3 py-1.5 text-xs text-gray-600">
              <span className="w-6 h-6 rounded-full bg-raz-teal flex-shrink-0" />
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
