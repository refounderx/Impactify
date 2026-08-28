"use client";

import { useState } from "react";
import DonutChart from "./DonutChart";
import { useLang } from "@/contexts/LanguageContext";
import type { AdminProductDetail } from "@/lib/nonprofit-admin-data";

const YEARS = ["2023", "2022", "2021", "כל השנים"];
const AS_OF = "12/08/23";

export default function ProductDetailPanel({ detail }: { detail: AdminProductDetail }) {
  const { lang } = useLang();
  const [year, setYear] = useState(detail.year);
  const [campaign, setCampaign] = useState(detail.selectedCampaign);
  const selectClass = "min-h-11 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 text-xs text-slate-600 outline-none transition focus:border-raz-teal focus:ring-2 focus:ring-raz-teal/10";

  return (
    <section className="bg-[#d5f7f4] px-4 py-6 sm:px-6 lg:px-8" aria-label={lang === "en" ? "Product performance details" : "פרטי ביצועי המוצר"}>
      <p className="mb-6 text-sm font-medium text-slate-500">
        {lang === "en" ? "Product SKU:" : "מק״ט מוצר:"} <span className="font-numeric">{detail.sku}</span>
      </p>

      <div dir="ltr" className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2.2fr)_minmax(270px,0.85fr)]">
        <div dir={lang === "en" ? "ltr" : "rtl"} className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-7">
          <div dir="ltr" className="grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(230px,0.75fr)] xl:items-start">
            <MonthlyChart detail={detail} lang={lang} />

            <div dir={lang === "en" ? "ltr" : "rtl"} className="order-first xl:order-none">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <label className="sr-only" htmlFor={`campaign-${detail.sku}`}>{lang === "en" ? "Campaign" : "קמפיין"}</label>
                <select id={`campaign-${detail.sku}`} value={campaign} onChange={(event) => setCampaign(event.target.value)} className={selectClass}>
                  {detail.campaignOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <label className="sr-only" htmlFor={`year-${detail.sku}`}>{lang === "en" ? "Year" : "שנה"}</label>
                <select id={`year-${detail.sku}`} value={year} onChange={(event) => setYear(event.target.value)} className={selectClass}>
                  {YEARS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>

              <div className="mt-9">
                <p className="text-sm font-extrabold text-slate-900">
                  {lang === "en" ? "Total products donated in " : "סה״כ מוצרים שנתרמו בשנת "}
                  <span className="text-raz-teal">{year}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">({lang === "en" ? "as of" : "נכון לתאריך"} {AS_OF})</p>
                <p className="mt-2 font-numeric text-3xl font-extrabold text-raz-teal">{detail.yearlyTotal.toLocaleString("he-IL")}</p>
              </div>
            </div>
          </div>
        </div>

        <aside dir={lang === "en" ? "ltr" : "rtl"} className="flex min-h-[25rem] flex-col items-center rounded-2xl bg-white p-6 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <h3 className="text-sm font-extrabold text-slate-950">{lang === "en" ? "Total donations received for this product" : "סה״כ תרומות שהתקבלו למוצר"}</h3>
          <p className="mt-1 text-xs text-slate-500">({lang === "en" ? "as of" : "נכון לתאריך"} {AS_OF})</p>
          <div className="my-auto">
            <DonutChart
              filled={detail.donated}
              total={detail.goal}
              centerValue={detail.goal.toLocaleString("he-IL")}
              filledLabel={detail.donated.toLocaleString("he-IL")}
              remainingLabel={Math.max(0, detail.goal - detail.donated).toLocaleString("he-IL")}
            />
          </div>
          <div className="space-y-2 text-xs text-slate-700">
            <Legend color="bg-raz-teal">{lang === "en" ? "Products donated" : "מוצרים שנתרמו"}</Legend>
            <Legend color="bg-gray-500">{lang === "en" ? "Remaining to goal" : "נותר ליעד"}</Legend>
          </div>
        </aside>
      </div>
    </section>
  );
}

function MonthlyChart({ detail, lang }: { detail: AdminProductDetail; lang: "he" | "en" }) {
  return (
    <div dir="ltr" className="space-y-2 py-2">
      {detail.monthly.map((month) => {
        const total = Math.max(month.total, 1);
        const donatedPercent = Math.min(100, Math.round((month.donated / total) * 100));
        return (
          <div key={month.month} className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-3 text-xs">
            <span dir={lang === "en" ? "ltr" : "rtl"} className="truncate text-end font-medium text-slate-800">{lang === "en" ? month.monthEn : month.month}</span>
            <div className="relative flex h-4 max-w-sm overflow-hidden bg-slate-200">
              <div className="flex h-full items-center justify-end bg-[#8d9299] pe-1 text-[10px] text-white" style={{ width: `${donatedPercent}%` }}>{month.donated}</div>
              <div className="flex h-full flex-1 items-center justify-end pe-1 text-[10px] text-slate-500">{month.total}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Legend({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${color}`} aria-hidden="true" />{children}</span>;
}
