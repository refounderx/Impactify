"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getCampaignById, getProductsByIds } from "@/lib/supabase/queries";
import { getOrgById } from "@/lib/supabase/queries-orgs";
import { formatNIS } from "@/lib/mock-data";
import { Shield, Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import EditableText from "@/components/admin/EditableText";

export default function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ amount?: string; product_id?: string; recurring?: string; community_id?: string; direct_product?: string }>;
}) {
  const { id } = use(params);
  const { amount: amountParam, product_id: productId, recurring: recurringParam, community_id: communityId, direct_product: directProduct } = use(searchParams);
  const router = useRouter();
  const { lang } = useLang();
  const [campaignData, setCampaignData] = useState<Awaited<ReturnType<typeof getCampaignById>>>(null);
  const [productData, setProductData] = useState<Awaited<ReturnType<typeof getProductsByIds>>[number] | null>(null);
  const [directOrg, setDirectOrg] = useState<Awaited<ReturnType<typeof getOrgById>>>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [customer, setCustomer] = useState({ contact: "", email: "", country: "Israel", zip: "", address: "", city: "" });

  useEffect(() => {
    if (directProduct === "1") { getProductsByIds([productId ?? id]).then(async ([product]) => { setProductData(product ?? null); if (product?.orgId) setDirectOrg(await getOrgById(product.orgId)); }); }
    else getCampaignById(id).then((c) => { if (c) setCampaignData(c); });
  }, [id, productId, directProduct]);

  if ((directProduct === "1" && !productData) || (directProduct !== "1" && !campaignData)) return <div className="min-h-screen bg-raz-surface animate-pulse" />;
  const campaign = campaignData;
  const org = campaign?._org ?? directOrg;
  const amount = parseInt(amountParam ?? "100") || 100;
  const isRecurring = recurringParam === "1";
  const isSimulation = process.env.NODE_ENV === "development";
  const missingCustomerDetails = [
    !customer.contact.trim() && (lang === "en" ? "full name" : "שם מלא"),
    !customer.email.trim() ? (lang === "en" ? "email" : "אימייל") : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim()) && (lang === "en" ? "valid email" : "אימייל תקין"),
    !customer.address.trim() && (lang === "en" ? "address" : "כתובת"),
    !customer.city.trim() && (lang === "en" ? "city" : "עיר"),
    !customer.zip.trim() && (lang === "en" ? "postal code" : "מיקוד"),
    !customer.country.trim() && (lang === "en" ? "country" : "מדינה"),
  ].filter((detail): detail is string => Boolean(detail));
  const startHostedCheckout = (orgId: string) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/payments/checkout";
    const values: Record<string, string> = {
      org_id: orgId, campaign_id: campaign?.id ?? "", product_id: productData?.id ?? productId ?? "",
      amount: amount.toString(), return_url: window.location.href, cancel_url: window.location.href, ...customer,
    };
    Object.entries(values).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };
  const orgName = lang === "en"
    ? ((org as { name_en?: string; nameEn?: string; name?: string } | null)?.name_en ?? (org as { nameEn?: string } | null)?.nameEn ?? org?.name)
    : org?.name;
  const campaignTitle = campaign ? (lang === "en" ? (campaign.titleEn ?? campaign.title) : campaign.title) : (lang === "en" ? (productData?.nameEn ?? productData?.name) : productData?.name);
  const gradient = campaign?.gradient ?? "from-teal-400 to-blue-400";

  return (
    <div className="flex flex-col min-h-screen bg-raz-surface">
      {/* Header */}
      <div className="bg-raz-dark px-6 pt-6 pb-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button type="button" onClick={() => router.back()} aria-label={lang === "en" ? "Back" : "חזרה"} className="interactive-control group flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-gray-300 transition-all hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/15 hover:text-white focus-visible:outline-white">
            {lang === "en" ? <ArrowLeft size={22} className="transition-transform group-hover:-translate-x-0.5" /> : <ArrowRight size={22} className="transition-transform group-hover:translate-x-0.5" />}
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
                  ? "Impactify does not collect card numbers or CVV. Payment will become available after the nonprofit connects and verifies a payment terminal."
                  : "Impactify אינה אוספת מספרי כרטיס או CVV. התשלום יהיה זמין לאחר שהעמותה תחבר ותאמת מסוף סליקה."}
              </p>
              {isSimulation && (
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-800">
                  {lang === "en" ? "Development mode: the button simulates a completed payment." : "מצב פיתוח: הכפתור מדמה תשלום שהושלם."}
                </p>
              )}
              {!isSimulation && (
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <p className="sm:col-span-2 text-center text-xs font-medium text-gray-500">{lang === "en" ? "All details below are required to continue to secure payment." : "יש למלא את כל הפרטים הבאים כדי להמשיך לתשלום מאובטח."}</p>
                  <input value={customer.contact} onChange={(event) => setCustomer({ ...customer, contact: event.target.value })} placeholder={lang === "en" ? "Full name" : "שם מלא"} className="interactive-field rounded-xl border border-gray-200 px-4 py-3 text-sm" />
                  <input value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} type="email" placeholder={lang === "en" ? "Email" : "אימייל"} className="interactive-field rounded-xl border border-gray-200 px-4 py-3 text-sm" />
                  <input value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} placeholder={lang === "en" ? "Address" : "כתובת"} className="interactive-field rounded-xl border border-gray-200 px-4 py-3 text-sm" />
                  <input value={customer.city} onChange={(event) => setCustomer({ ...customer, city: event.target.value })} placeholder={lang === "en" ? "City" : "עיר"} className="interactive-field rounded-xl border border-gray-200 px-4 py-3 text-sm" />
                  <input value={customer.zip} onChange={(event) => setCustomer({ ...customer, zip: event.target.value })} placeholder={lang === "en" ? "Postal code" : "מיקוד"} className="interactive-field rounded-xl border border-gray-200 px-4 py-3 text-sm" />
                  <input value={customer.country} onChange={(event) => setCustomer({ ...customer, country: event.target.value })} placeholder={lang === "en" ? "Country" : "מדינה"} className="interactive-field rounded-xl border border-gray-200 px-4 py-3 text-sm" />
                </div>
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
              <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 text-white mb-4`}>
                <p className="text-white/80 text-sm">{orgName}</p>
                <p className="font-bold mt-1">{campaignTitle}</p>
                <p className="text-3xl font-bold font-numeric mt-3">{formatNIS(amount)}</p>
                <p className="text-white/70 text-sm mt-1">{isRecurring ? <EditableText tKey="recurring.title" /> : <EditableText tKey="payment.oneTime" />}</p>
              </div>
              <button
                onClick={async () => {
                  setPaymentError("");
                  if (!isSimulation && missingCustomerDetails.length) {
                    setPaymentError(lang === "en" ? `Missing or invalid: ${missingCustomerDetails.join(", ")}.` : `חסרים או שגויים הפרטים הבאים: ${missingCustomerDetails.join(", ")}.`);
                    return;
                  }
                  setSubmitting(true);
                  try {
                    const orgId = (campaign as {org_id?:string})?.org_id
                      ?? (campaign as {orgId?:string})?.orgId
                      ?? org?.id ?? productData?.orgId ?? "";
                    if (!isSimulation) { startHostedCheckout(orgId); return; }
                    const response = await fetch("/api/donations", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ campaign_id: campaign?.id, org_id: orgId, amount, is_recurring: isRecurring, product_id: directProduct === "1" ? productData?.id : productId ?? undefined, quantity: (directProduct === "1" || productId) ? 1 : undefined, community_id: communityId ?? undefined, simulation: isSimulation }),
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error ?? "Donation could not be saved");
                    router.push(`/donate/${id}/thanks?id=${result.donation.id}&receipt=${encodeURIComponent(result.receiptId)}`);
                  } catch (error) {
                    setPaymentError(error instanceof Error ? error.message : "Donation could not be saved");
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                className="w-full bg-raz-teal text-white rounded-xl py-4 font-bold text-lg hover:bg-raz-teal-dark transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "..." : <EditableText tKey="payment.confirm" />}
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
