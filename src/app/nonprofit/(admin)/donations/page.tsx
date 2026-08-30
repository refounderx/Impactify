"use client";
import { Download, RotateCcw } from "lucide-react";
import StatHeader from "@/components/nonprofit-admin/StatHeader";
import SearchFilterBar from "@/components/nonprofit-admin/SearchFilterBar";
import { useLang } from "@/contexts/LanguageContext";
import { formatNIS } from "@/lib/mock-data";
import { useNgoAdminView } from "@/hooks/useNgoAdminView";
import AdminDataStatus from "@/components/nonprofit-admin/AdminDataStatus";
import EditableText from "@/components/admin/EditableText";
import { useState } from "react";
import { downloadDonationConfirmation } from "@/lib/donation-receipt";

const AS_OF = "12/08/23";

export default function DonationsPage() {
  const { lang, t } = useLang();
  const { data, loading, error, reload } = useNgoAdminView();
  const adminDonationRows = data?.adminDonationRows ?? [];
  const [refunds, setRefunds] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState("");

  async function requestRefund(donationId: string) {
    setActionError("");
    try {
      const response = await fetch("/api/refunds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ donation_id: donationId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to request refund");
      setRefunds((current) => ({ ...current, [donationId]: true }));
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Unable to request refund");
    }
  }

  if (loading || error) return <AdminDataStatus loading={loading} error={error} reload={reload} />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6"><EditableText tKey="adm.donationsTitle" /></h1>

      <div className="bg-white rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <SearchFilterBar filterLabel={lang === "en" ? "Filter by activity area" : "אזור פעילות העמותה"} />
          <StatHeader
            stats={[
              { label: t("adm.depositsCount"), value: (data?.adminDonationsCount ?? 0).toLocaleString("he-IL") },
              { label: `${t("adm.totalDonated")} (${lang === "en" ? "as of" : "נכון לתאריך"} ${AS_OF})`, value: formatNIS(data?.adminDonationsTotal ?? 0) },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          {actionError && <p role="alert" className="mb-3 text-sm text-red-600">{actionError}</p>}
          <table className="w-full text-sm" dir={lang === "en" ? "ltr" : "rtl"}>
            <thead>
              <tr className="border-b border-gray-100">
                {["תאריך", "שם התורם/ת", "קמפיין", "מוצר", "כמות", "סכום התרומה", "תדירות", "אמצעי תשלום", "קבלה", "החזר כספי"].map((h) => (
                  <th key={h} className="pb-3 pt-1 text-raz-teal font-bold text-start px-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminDonationRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{row.date}</td>
                  <td className="py-3 px-2 font-medium text-gray-800 whitespace-nowrap">{row.donorName}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{row.campaign}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{row.product}</td>
                  <td className="py-3 px-2 text-gray-500 font-numeric">{row.quantity}</td>
                  <td className="py-3 px-2 font-bold text-gray-800 font-numeric">{formatNIS(row.amount)}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{lang === "en" ? row.frequencyEn : row.frequency}</td>
                  <td className="py-3 px-2 text-gray-500 font-numeric" dir="ltr">{"*".repeat(6)}{row.paymentLast4}</td>
                  <td className="py-3 px-2">
                    <button type="button" onClick={() => downloadDonationConfirmation({ receiptId: row.receiptId, receiptUrl: row.receiptUrl, amount: row.amount, date: row.date, campaign: row.campaign, organization: data?.organization.name ?? "" })} className="micro-hint w-7 h-7 rounded-full bg-raz-teal/10 text-raz-teal flex items-center justify-center hover:bg-raz-teal/20" aria-label={t("hint.downloadReceipt")}>
                      <Download size={14} />
                    </button>
                  </td>
                  <td className="py-3 px-2">
                    <button type="button" disabled={refunds[row.id]} onClick={() => void requestRefund(row.id)} className="micro-hint w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50" aria-label={refunds[row.id] ? "בקשת ההחזר נרשמה" : t("hint.refund")}>
                      <RotateCcw size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
