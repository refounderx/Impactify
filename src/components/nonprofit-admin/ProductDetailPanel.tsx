"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import DonutChart from "./DonutChart";
import { useLang } from "@/contexts/LanguageContext";
import type { AdminProductDetail } from "@/lib/nonprofit-admin-data";

const YEARS = ["2023", "2022", "2021", "כל השנים"];

export default function ProductDetailPanel({ detail }: { detail: AdminProductDetail }) {
  const { lang } = useLang();
  const [year, setYear] = useState(detail.year);
  const [campaign, setCampaign] = useState(detail.selectedCampaign);
  const [openDropdown, setOpenDropdown] = useState<"year" | "campaign" | null>(null);
  const AS_OF = "12/08/23";

  return (
    <div className="bg-teal-50/50 rounded-xl p-5">
      <p className="text-sm font-bold text-gray-500 mb-4">
        {lang === "en" ? "Product SKU:" : "מק\"ט מוצר:"} {detail.sku}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly breakdown */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex flex-col gap-2.5 mb-4">
            {detail.monthly.map((m) => {
              const pct = Math.min(100, Math.round((m.donated / m.total) * 100));
              return (
                <div key={m.month} className="flex items-center gap-3 text-xs">
                  <span className="w-16 flex-shrink-0 text-gray-600 truncate">{lang === "en" ? m.monthEn : m.month}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
                    <div className="h-full bg-gray-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-end font-numeric text-gray-500">{m.donated}</span>
                  <span className="w-6 text-end font-numeric text-gray-400">{m.total}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mb-4">
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
            <div className="relative flex-1">
              <button
                onClick={() => setOpenDropdown(openDropdown === "campaign" ? null : "campaign")}
                className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 hover:border-gray-300 truncate"
              >
                <span className="truncate">{campaign}</span>
                <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
              </button>
              {openDropdown === "campaign" && (
                <div className="absolute z-10 top-9 start-0 end-0 bg-white border border-gray-100 rounded-lg shadow-lg py-1">
                  {detail.campaignOptions.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCampaign(c); setOpenDropdown(null); }}
                      className="block w-full text-start px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 truncate"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {lang === "en" ? "Total units donated in " : "סה\"כ מוצרים שנתרמו בשנת "}
            <span className="text-raz-teal font-bold">{year}</span>
          </p>
          <p className="text-xs text-gray-400 mb-1">({lang === "en" ? "as of" : "נכון לתאריך"} {AS_OF})</p>
          <p className="text-xl font-bold text-gray-800 font-numeric">{detail.yearlyTotal.toLocaleString("he-IL")}</p>
        </div>

        {/* Donut */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">
            {lang === "en" ? "Total donations received for this product" : "סה\"כ תרומות שהתקבלו למוצר"}
          </p>
          <p className="text-xs text-gray-400 mb-1">({lang === "en" ? "as of" : "נכון לתאריך"} {AS_OF})</p>
          <DonutChart
            filled={detail.donated}
            total={detail.goal}
            centerValue={detail.goal.toLocaleString("he-IL")}
            filledLabel={detail.donated.toLocaleString("he-IL")}
            remainingLabel={(detail.goal - detail.donated).toLocaleString("he-IL")}
          />
          <div className="flex items-center justify-center gap-5 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-raz-teal" />{lang === "en" ? "Units donated" : "מוצרים שנתרמו"}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300" />{lang === "en" ? "Remaining to goal" : "נותר ליעד"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
