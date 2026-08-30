"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getCampaignById } from "@/lib/supabase/queries";
import { formatNIS } from "@/lib/mock-data";
import { Shield, Lock, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import EditableText from "@/components/admin/EditableText";

export default function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ amount?: string; product_id?: string; recurring?: string }>;
}) {
  const { id } = use(params);
  const { amount: amountParam, product_id: productId, recurring: recurringParam } = use(searchParams);
  const router = useRouter();
  const { lang } = useLang();
  const [campaignData, setCampaignData] = useState<Awaited<ReturnType<typeof getCampaignById>>>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    getCampaignById(id).then((c) => { if (c) setCampaignData(c); });
  }, [id]);

  if (!campaignData) return <div className="min-h-screen bg-raz-surface animate-pulse" />;
  const campaign = campaignData;
  const org = campaign._org;
  const amount = parseInt(amountParam ?? "100") || 100;
  const isRecurring = recurringParam === "1";
  const isSimulation = process.env.NODE_ENV === "development";
  const orgName = lang === "en"
    ? (org?.name_en ?? org?.name)
    : org?.name;
  const campaignTitle = lang === "en" ? (campaign.titleEn ?? campaign.title) : campaign.title;

  return (
    <div className="flex flex-col min-h-screen bg-raz-surface">
      {/* Header */}
      <div className="bg-raz-dark px-6 pt-6 pb-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
            <ArrowRight size={24} />
          </button>
          <h1 className="text-white font-bold text-xl"><EditableText tKey="payment.title" /></h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-6 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Payment form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-white p-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-raz-teal/10 text-raz-teal">
                <Lock size={26} />
              </div>
              <h2 className="mt-4 text-center text-lg font-bold text-raz-dark">
                {lang === "en" ? "Secure hosted payment" : "סליקה מאובטחת באתר הספק"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-center text-sm leading-6 text-gray-600">
                {lang === "en"
                  ? "Impactify does not collect card numbers or CVV. Payment will become available after the nonprofit connects and verifies Cardcom or Grow."
                  : "Impactify אינה אוספת מספרי כרטיס או CVV. התשלום יהיה זמין לאחר שהעמותה תחבר ותאמת מסוף Cardcom או Grow."}
              </p>
              {isSimulation && (
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-800">
                  {lang === "en" ? "Development mode: the button simulates a completed payment." : "מצב פיתוח: הכפתור מדמה תשלום שהושלם."}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 py-3">
              <div className="flex items-center gap-1.5 text-sm text-gray-400"><Shield size={14} /> <EditableText tKey="payment.ssl" /></div>
              <div className="flex items-center gap-1.5 text-sm text-gray-400"><Lock size={14} /> <EditableText tKey="payment.pci" /></div>
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-5 sticky top-24">
              <h3 className="font-bold text-gray-700 mb-4"><EditableText tKey="payment.summary" /></h3>
              <div className={`bg-gradient-to-br ${campaign.gradient} rounded-xl p-4 text-white mb-4`}>
                <p className="text-white/80 text-sm">{orgName}</p>
                <p className="font-bold mt-1">{campaignTitle}</p>
                <p className="text-3xl font-bold font-numeric mt-3">{formatNIS(amount)}</p>
                <p className="text-white/70 text-sm mt-1">{isRecurring ? <EditableText tKey="recurring.title" /> : <EditableText tKey="payment.oneTime" />}</p>
              </div>
              <button
                onClick={async () => {
                  setSubmitting(true);
                  setPaymentError("");
                  const orgId = (campaign as {org_id?:string})?.org_id
                    ?? (campaign as {orgId?:string})?.orgId
                    ?? org?.id ?? "";
                  try {
                    const response = await fetch("/api/donations", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ campaign_id: campaign.id, org_id: orgId, amount, is_recurring: isRecurring, product_id: productId ?? undefined, quantity: productId ? 1 : undefined, simulation: isSimulation }),
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error ?? "Donation could not be saved");
                    router.push(`/donate/${campaign.id}/thanks?id=${result.donation.id}&receipt=${encodeURIComponent(result.receiptId)}`);
                  } catch (error) {
                    setPaymentError(error instanceof Error ? error.message : "Donation could not be saved");
                    setSubmitting(false);
                  }
                }}
                disabled={submitting || !isSimulation}
                className="w-full bg-raz-teal text-white rounded-xl py-4 font-bold text-lg hover:bg-raz-teal-dark transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "..." : isSimulation ? <EditableText tKey="payment.confirm" /> : (lang === "en" ? "Payment provider not connected" : "ספק הסליקה טרם חובר")}
              </button>
              {paymentError && <p className="text-center text-sm text-red-500 mt-2">{paymentError}</p>}
              <p className="text-center text-xs text-gray-400 mt-3"><EditableText tKey="payment.terms" /></p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
