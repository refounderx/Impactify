"use client";

import { useMemo, useState } from "react";
import { Calculator, Download, ExternalLink, Send } from "lucide-react";
import { downloadTaxDonationReport, type TaxDonationRecord } from "@/lib/donation-documents";

interface Props {
  lang: string;
  donations: TaxDonationRecord[];
}

const TAX_AUTHORITY_DONATION_CHECK_URL = "https://www.gov.il/he/service/confirmation-of-donations";

export default function TaxRefundView({ lang, donations }: Props) {
  const [email, setEmail] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState("");
  const [status, setStatus] = useState("");
  const isEnglish = lang === "en";
  const selectedTotal = useMemo(() => donations
    .filter((donation) => !year || donation.date.includes(year))
    .reduce((total, donation) => total + donation.amount, 0), [donations, year]);
  const simulationAmount = Number(calculatorAmount) || selectedTotal;
  const estimatedCredit = Math.round(simulationAmount * 0.35);

  function downloadReport() {
    downloadTaxDonationReport(year, donations);
    setStatus(isEnglish ? "The report was downloaded." : "הדוח הורד למכשיר.");
  }

  function sendReportByEmail() {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus(isEnglish ? "Enter a valid email address." : "יש להזין כתובת דוא״ל תקינה.");
      return;
    }
    downloadTaxDonationReport(year, donations);
    const subject = encodeURIComponent(isEnglish ? `Impactify donation report ${year}` : `ריכוז תרומות Impactify לשנת ${year}`);
    const body = encodeURIComponent(isEnglish
      ? "Your donation report was downloaded. Attach it to this email before sending."
      : "דוח התרומות הורד למכשיר. יש לצרף אותו להודעה זו לפני השליחה.");
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
    setStatus(isEnglish ? "Your email app was opened with the report instructions." : "נפתחה תוכנת הדוא״ל עם הנחיות לצירוף הדוח.");
  }

  return (
    <div className="mb-24">
      <h1 className="mb-8 text-end text-4xl font-black text-gray-800">{isEnglish ? "My Tax Refunds" : "החזרי המס שלי"}</h1>

      <div className="flex flex-col items-start gap-8 lg:flex-row">
        <div className="flex w-full flex-col gap-4 lg:w-72 lg:flex-shrink-0">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <select value={year} onChange={(event) => setYear(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-raz-teal focus:outline-none" dir={isEnglish ? "ltr" : "rtl"}>
                {Array.from({ length: 5 }, (_, index) => String(new Date().getFullYear() - index)).map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <p className="text-end text-sm font-bold text-gray-700">{isEnglish ? "Tax donation report" : "דו״ח תרומות לצורכי מס"}</p>
            </div>
            <p className="mb-3 text-sm text-gray-500">{isEnglish ? `Found donations: ₪${selectedTotal.toLocaleString()}` : `נמצאו תרומות בסך ₪${selectedTotal.toLocaleString("he-IL")}`}</p>
            <button type="button" onClick={downloadReport} className="flex w-full items-center justify-center gap-2 rounded-xl bg-raz-teal py-3 text-sm font-bold text-white transition-colors hover:bg-teal-500"><Download size={16} />{isEnglish ? "Download report" : "הורדת הדו״ח"}</button>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex gap-2">
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={isEnglish ? "Email address" : "כתובת דוא״ל"} type="email" dir="ltr" className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-raz-teal focus:outline-none" />
              <button type="button" onClick={sendReportByEmail} className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-gray-800 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-gray-700"><Send size={13} />{isEnglish ? "Email" : "שליחה למייל"}</button>
            </div>
          </div>
        </div>

        <div className="w-full flex-1 rounded-2xl bg-white p-7 shadow-sm">
          <h2 className="mb-5 text-center text-xl font-black text-gray-800">{isEnglish ? "Your right to know" : "זכותכם לדעת"}</h2>
          <p className="text-sm leading-relaxed text-gray-600">{isEnglish ? "Tax credit for donations depends on the organization’s approval and your personal tax data. Keep the official receipts and check the organization’s eligibility before filing." : "זיכוי מס על תרומות תלוי באישור העמותה ובנתוני המס האישיים שלכם. שמרו את אישורי התרומה ובדקו את זכאות העמותה לפני הגשת בקשה."}</p>
          <a href={TAX_AUTHORITY_DONATION_CHECK_URL} target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-1 text-sm font-medium text-raz-teal hover:underline"><ExternalLink size={15} />{isEnglish ? "Check an organization’s Section 46 eligibility" : "לבדיקת זכאות העמותה לפי סעיף 46"}</a>
          <button type="button" onClick={() => setShowCalculator((current) => !current)} className="mt-6 flex items-center gap-2 rounded-xl bg-gray-800 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-700"><Calculator size={16} />{isEnglish ? "Tax credit estimator" : "סימולטור זיכוי מס"}</button>

          {showCalculator && <div className="mt-5 rounded-xl bg-raz-surface p-4"><label className="block text-sm font-bold text-gray-700">{isEnglish ? "Annual eligible donations" : "סך תרומות מוכרות בשנה"}<input value={calculatorAmount} onChange={(event) => setCalculatorAmount(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder={String(selectedTotal)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-right font-numeric focus:border-raz-teal focus:outline-none" /></label><p className="mt-4 text-lg font-bold text-raz-teal">{isEnglish ? `Estimated credit: ₪${estimatedCredit.toLocaleString()}` : `זיכוי מס משוער: ₪${estimatedCredit.toLocaleString("he-IL")}`}</p><p className="mt-2 text-xs leading-relaxed text-gray-500">{isEnglish ? "Estimate only: calculated at 35% and subject to Section 46 eligibility, applicable limits, and your actual tax liability." : "הערכה בלבד: החישוב הוא לפי 35%, בכפוף לזכאות לפי סעיף 46, לתקרות החלות ולחבות המס בפועל."}</p></div>}
        </div>
      </div>
      {status && <p className="mt-4 text-sm text-gray-600" role="status">{status}</p>}
    </div>
  );
}
