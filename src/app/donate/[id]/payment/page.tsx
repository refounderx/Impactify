"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getCampaignById } from "@/lib/supabase/queries";
import { getCampaign, getOrg, formatNIS } from "@/lib/mock-data";
import { CreditCard, Building2, Shield, Lock, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import EditableText from "@/components/admin/EditableText";

export default function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ amount?: string }>;
}) {
  const { id } = use(params);
  const { amount: amountParam } = use(searchParams);
  const router = useRouter();
  const { lang, t } = useLang();
  const [campaignData, setCampaignData] = useState<Awaited<ReturnType<typeof getCampaignById>>>(
    getCampaign(id) as never
  );

  useEffect(() => {
    getCampaignById(id).then((c) => { if (c) setCampaignData(c); });
  }, [id]);

  const campaign = campaignData ?? getCampaign(id) ?? getCampaign("1")!;
  const org = campaign._org ?? getOrg((campaign as {orgId?: string}).orgId ?? "");
  const amount = parseInt(amountParam ?? "100") || 100;
  const orgName = lang === "en"
    ? ((org as {name_en?: string})?.name_en ?? (org as {nameEn?: string})?.nameEn ?? org?.name)
    : org?.name;
  const campaignTitle = lang === "en" ? (campaign.titleEn ?? campaign.title) : campaign.title;
  const [method, setMethod] = useState<"card" | "bank">("card");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [saveCard, setSaveCard] = useState(false);

  function formatCard(v: string) { return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); }
  function formatExpiry(v: string) { return v.replace(/\D/g, "").slice(0, 4).replace(/^(.{2})/, "$1/"); }

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
            <div className="bg-white rounded-2xl p-1 flex mb-4">
              <button onClick={() => setMethod("card")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${method === "card" ? "bg-raz-teal text-white" : "text-gray-500"}`}>
                <CreditCard size={18} /> <EditableText tKey="payment.card" />
              </button>
              <button onClick={() => setMethod("bank")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${method === "bank" ? "bg-raz-teal text-white" : "text-gray-500"}`}>
                <Building2 size={18} /> <EditableText tKey="payment.bank" />
              </button>
            </div>

            {method === "card" && (
              <div className="bg-white rounded-2xl p-5 flex flex-col gap-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1.5 block"><EditableText tKey="payment.cardNum" /></label>
                  <input type="text" placeholder="0000 0000 0000 0000" value={cardNum}
                    onChange={(e) => setCardNum(formatCard(e.target.value))}
                    dir="ltr"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-raz-teal font-numeric text-left" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 mb-1.5 block"><EditableText tKey="payment.expiry" /></label>
                    <input type="text" placeholder="MM/YY" value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      dir="ltr"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-raz-teal font-numeric text-center" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 mb-1.5 block"><EditableText tKey="payment.cvv" /></label>
                    <input type="text" placeholder="000" value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g,"").slice(0,3))}
                      dir="ltr"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-raz-teal font-numeric text-center" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1.5 block"><EditableText tKey="payment.holder" /></label>
                  <input type="text" placeholder={t("payment.holderPH")} value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-raz-teal" />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} className="accent-raz-teal w-4 h-4" />
                  <EditableText tKey="payment.saveCard" />
                </label>
              </div>
            )}

            {method === "bank" && (
              <div className="bg-white rounded-2xl p-5">
                <p className="text-gray-600 mb-3"><EditableText tKey="payment.bankTitle" /></p>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 font-numeric" dir="ltr">
                  <div className="flex justify-between"><span className="text-gray-500">{lang === "en" ? "Bank:" : "בנק:"}</span><span className="font-medium">Bank Hapoalim (12)</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">{lang === "en" ? "Branch:" : "סניף:"}</span><span className="font-medium">512</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">{lang === "en" ? "Account:" : "חשבון:"}</span><span className="font-medium">123456-78</span></div>
                </div>
                <p className="text-sm text-gray-400 mt-3"><EditableText tKey="payment.bankNote" /></p>
              </div>
            )}

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
                <p className="text-white/70 text-sm mt-1"><EditableText tKey="payment.oneTime" /></p>
              </div>
              <button
                onClick={async () => {
                  // Write donation to DB (best-effort — demo still works if this fails)
                  const orgId = (campaign as {org_id?:string})?.org_id
                    ?? (campaign as {orgId?:string})?.orgId
                    ?? org?.id ?? "";
                  await fetch("/api/donations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ campaign_id: campaign.id, org_id: orgId, amount }),
                  }).catch(() => {});
                  router.push(`/donate/${campaign.id}/thanks?amount=${amount}`);
                }}
                className="w-full bg-raz-teal text-white rounded-xl py-4 font-bold text-lg hover:bg-raz-teal-dark transition-colors"
              >
                <EditableText tKey="payment.confirm" />
              </button>
              <p className="text-center text-xs text-gray-400 mt-3"><EditableText tKey="payment.terms" /></p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
