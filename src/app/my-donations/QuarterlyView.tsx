"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { SharedSiteData } from "@/lib/site-dataset-types";

const BAR_COLORS = ["bg-yellow-400", "bg-teal-200", "bg-raz-teal"];
const BAR_H = 120;
const YEARS = ["2023", "2022", "2021", "כל השנים"];

export default function QuarterlyView({ lang, t, quarterlyData }: { lang: string; t: (key: string) => string; quarterlyData?: SharedSiteData["quarterlyDonationData"] }) {
  const [selectedYear, setSelectedYear] = useState("2023");
  const { total, period, months } = quarterlyData ?? { total: 0, period: "", months: [] };
  const MAX_BAR = Math.max(...months.flatMap(m => m.bars.map(b => b.amount)), 1);

  return (
    <div className="flex gap-8 items-start">

      {/* RIGHT (first in DOM): year selector + summary */}
      <div className="w-52 flex-shrink-0">
        <div className="flex flex-col gap-1 mb-5">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`text-sm text-end py-0.5 transition-colors ${
                selectedYear === y ? "font-bold text-gray-800" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mb-1">
          {lang === "en" ? "In selected dates you donated" : "בתאריכים הנבחרים תרמת"}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-raz-teal">₪</span>
          <span className="text-4xl font-black text-raz-teal font-numeric">
            {total.toLocaleString("he-IL")}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {lang === "en" ? "Between dates" : "בין התאריכים"}
        </p>
        <p className="text-base font-bold text-raz-teal mt-0.5">{period}</p>
      </div>

      {/* LEFT (last in DOM): bar charts */}
      <div className="flex-1 min-w-0">
        {/* Quarter navigation — RTL: > on right = go back, < on left = go forward */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button className="micro-hint text-gray-400 hover:text-gray-600" aria-label={t("hint.previous")}><ChevronRight size={18} /></button>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <span>{lang === "en" ? "This quarter" : "הרבעון הזה"}</span>
            <Calendar size={15} className="text-gray-400" />
          </div>
          <button className="micro-hint text-gray-400 hover:text-gray-600" aria-label={t("hint.next")}><ChevronLeft size={18} /></button>
        </div>

        {/* Monthly bar groups — months in chronological RTL order (פברואר rightmost) */}
        <div className="flex gap-10 justify-center" dir="rtl">
          {months.map((m) => (
            <div key={m.label} className="flex flex-col items-center gap-2">
              {/* Bars: הו"ק first in DOM = rightmost in RTL */}
              <div className="flex items-end gap-3" style={{ height: BAR_H + 44 }} dir="rtl">
                {m.bars.map((bar, i) => {
                  const h = Math.max(8, Math.round((bar.amount / MAX_BAR) * BAR_H));
                  return (
                    <div key={bar.type} className="flex flex-col items-center">
                      {/* Rotated value label */}
                      <div style={{ height: 44, display: "flex", alignItems: "flex-end", marginBottom: 4 }}>
                        <span
                          className="text-gray-500 font-medium"
                          style={{ fontSize: 11, writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                        >
                          ₪{bar.amount.toLocaleString("he-IL")}
                        </span>
                      </div>
                      {/* Bar */}
                      <div className={`w-7 rounded-t ${BAR_COLORS[i]}`} style={{ height: h }} />
                      {/* Type label */}
                      <span className="text-gray-500 mt-2 text-center" style={{ fontSize: 10 }}>{bar.type}</span>
                    </div>
                  );
                })}
              </div>
              <span className="text-xs text-gray-600 font-semibold mt-1">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
