"use client";
import { useState } from "react";
import { Download, Send } from "lucide-react";

interface Props { lang: string }

const TAX_TEXT = `גובה מס הכנסה שעל עובדים לשלם מחושב על בסיס שנתי (כלומר: על פי סך הכנסותיהם בשנת המס). בפועל, מנוכה משכורם מדי חודש בחודש באמצעות תלוש השכר. הסכומים החודשיים המנוכים בחס הכנסה מדי חודש נקראים "ניכוי במקור", והם מבוססים על חישוב משוער לגבי הכנסתם השנתית של העובדים. היות שרק בסוף שנה ניתן לדעת במדויק מה היתה ההכנסה השנתית, ייתכנו פערים בין הסכום המדויק שהיה על העובדים לשלם למס הכנסה לבין הסכומים שנוכו משכרו.

ם במהלך השנה והתבססו על הכנסה משוערת. עצמאים משלמים במהלך השנה "מקדמות" שמבוססות אף הן על הכנסה שנתית משוערת. פערים בין הסכום המדויק שהיה על העובדים לשלם למס למים מקדמות למים פערים בין הסכום המדויק שהיה על העובדים לשלם למס.

פערים בין הסכום המדויק שהיה על העובדים לשלם למס למים למים פערים בין הסכום המדויק שהיה על העובדים לשלם למס`;

const TAX_TEXT_EN = `Income tax that employees must pay is calculated on an annual basis (i.e., based on their total annual income). In practice, it is deducted monthly via their payslip. Monthly deductions are called "withholding tax" and are based on an estimated annual income calculation.

Since only at year-end is the exact annual income known, there may be gaps between the exact amount employees should pay and what was withheld during the year. Self-employed individuals pay advance payments based on estimated annual income.`;

export default function TaxRefundView({ lang }: Props) {
  const [email, setEmail] = useState("");
  const [year, setYear] = useState("");

  const text = lang === "en" ? TAX_TEXT_EN : TAX_TEXT;

  return (
    <div className="mb-24">
      {/* Title */}
      <h1 className="text-4xl font-black text-gray-800 text-end mb-8">
        {lang === "en" ? "My Tax Refunds" : "החזרי המס שלי"}
      </h1>

      {/* Two columns — RTL: first in DOM = right on screen */}
      <div className="flex gap-8 items-start">

        {/* RIGHT column: controls + chat */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-4">

          {/* Year selector + download */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-raz-teal"
                dir={lang === "en" ? "ltr" : "rtl"}
              >
                <option value="">{lang === "en" ? "Select year" : "בחר שנה"}</option>
                {["2023", "2022", "2021", "2020"].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
              <p className="text-sm font-bold text-gray-700 text-end">
                {lang === "en" ? "Tax refund report by year" : 'דו"ח להחזרי מס לפי שנה'}
              </p>
            </div>
            <button className="w-full bg-raz-teal text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal-500 transition-colors text-sm">
              <Download size={16} />
              {lang === "en" ? "Download Report" : 'הורדת הדו"ח'}
            </button>
          </div>

          {/* Email send */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex gap-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang === "en" ? "Email address" : 'כתובת דוא"ל'}
                type="email"
                dir="ltr"
                className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-raz-teal"
              />
              <button className="bg-gray-800 text-white font-bold text-xs px-3 py-2 rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                <Send size={13} />
                {lang === "en" ? "Send" : "שליחה למייל"}
              </button>
            </div>
          </div>

          {/* Chat / help card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center gap-3 text-center">
            <div className="relative flex items-center justify-center gap-2">
              <span className="text-3xl">💬</span>
              <div className="w-16 h-16 bg-raz-teal rounded-full flex items-center justify-center text-3xl shadow">
                🐢
              </div>
            </div>
            <p className="text-sm font-bold text-gray-700">
              {lang === "en" ? "Do you have more questions?" : "?יש לכם עוד שאלות"}
            </p>
          </div>
        </div>

        {/* LEFT column: tax info text */}
        <div className="flex-1 bg-white rounded-2xl p-7 shadow-sm">
          <h2 className="text-xl font-black text-gray-800 mb-5 text-center">
            {lang === "en" ? "Your right to know!" : "!זכותכם לדעת"}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line" dir="rtl">
            {text}
          </p>
          <a href="#" className="text-raz-teal text-sm font-medium mt-5 block hover:underline">
            {lang === "en" ? "Continue reading — click here ›" : "להמשך קריאה לחץ כאן ›"}
          </a>
          <button className="mt-6 bg-gray-800 text-white font-bold px-8 py-3 rounded-xl hover:bg-gray-700 transition-colors text-sm">
            {lang === "en" ? "Tax Calculator" : "לחישוב סימולטור"}
          </button>
        </div>

      </div>
    </div>
  );
}
