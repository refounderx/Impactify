"use client";
import { X, Download, CreditCard, Plus } from "lucide-react";
import { formatNIS, type ProductDonation } from "@/lib/mock-data";
import { downloadDonationCertificate, downloadDonationReceipt, downloadDonationReceipts } from "@/lib/donation-documents";
import { addPaymentMethod, getPaymentMethods, type PaymentMethod } from "@/lib/supabase/queries-profile";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type PopupName =
  | "certificate"
  | "receipts"
  | "donate-more"
  | "standing-order"
  | "tax-refund"
  | "new-donation"
  | null;

interface BaseProps {
  onClose: () => void;
  lang: string;
  t: (key: string) => string;
}

function Backdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function CertificatePopup({ pd, onClose, t }: { pd: ProductDonation; onClose: () => void; t: (k: string) => string }) {
  return (
    <Backdrop onClose={onClose}>
      <div className="p-6 text-center relative">
        <button onClick={onClose} className="micro-hint micro-hint-below absolute top-4 end-4 text-gray-400 hover:text-gray-600" aria-label={t("hint.close")}><X size={20} /></button>
        <div className="text-6xl mb-4">🏅</div>
        <p className="text-gray-500 text-sm mb-1">{t("myDon.certSub")}</p>
        <button type="button" onClick={() => downloadDonationCertificate(pd)} className="mt-4 bg-raz-teal text-white rounded-xl px-6 py-3 text-sm font-bold flex items-center gap-2 mx-auto">
          <Download size={16} />
          {t("myDon.certDownload")}
        </button>
        <button onClick={onClose} className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline block mx-auto">
          {t("myDon.taxInfoLink")}
        </button>
      </div>
    </Backdrop>
  );
}

function ReceiptsPopup({ pd, onClose, t, lang }: { pd: ProductDonation; onClose: () => void; t: (k: string) => string; lang: string }) {
  const name = lang === "en" ? pd.productNameEn : pd.productName;
  return (
    <Backdrop onClose={onClose}>
      <div className="p-5 relative">
        <button onClick={onClose} className="micro-hint micro-hint-below absolute top-4 end-4 text-gray-400 hover:text-gray-600" aria-label={t("hint.close")}><X size={20} /></button>
        <h3 className="font-bold text-gray-800 text-base mb-1">{name}</h3>
        <p className="text-xs text-gray-400 mb-4">{pd.orgCode} · {pd.orgName}</p>
        <button type="button" onClick={() => downloadDonationReceipts(pd)} className="flex items-center gap-2 text-sm text-raz-teal font-medium mb-4">
          <Download size={15} />
          {t("myDon.downloadAllReceipts")}
        </button>
        <table className="w-full text-sm" dir={lang === "en" ? "ltr" : "rtl"}>
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400">
              {[t("myDon.date"), t("myDon.amount"), t("myDon.type"), t("myDon.payment"), ""].map((h, i) => (
                <th key={i} className="pb-2 font-medium text-start">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pd.receipts.map((r) => (
              <tr key={r.id}>
                <td className="py-2 text-gray-600">{r.date}</td>
                <td className="py-2 font-bold font-numeric">{formatNIS(r.amount)}</td>
                <td className="py-2 text-gray-500">{r.type}</td>
                <td className="py-2 text-gray-500">••••{r.paymentLast4}</td>
                <td className="py-2"><button type="button" onClick={() => downloadDonationReceipt(pd, r)} className="micro-hint text-raz-teal" aria-label={t("hint.downloadReceipt")}><Download size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={onClose} className="mt-4 w-full border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">
          {t("back")}
        </button>
      </div>
    </Backdrop>
  );
}

function DonateMorePopup({ pd, onClose, onActivateRecurring, t, lang }: { pd: ProductDonation; onClose: () => void; onActivateRecurring: (id: string) => void; t: (k: string) => string; lang: string }) {
  const name = lang === "en" ? pd.productNameEn : pd.productName;
  return (
    <Backdrop onClose={onClose}>
      <div className="p-5 relative">
        <button onClick={onClose} className="micro-hint micro-hint-below absolute top-4 end-4 text-gray-400 hover:text-gray-600" aria-label={t("hint.close")}><X size={20} /></button>
        <h3 className="font-bold text-gray-800 text-lg mb-1 text-center">{t("myDon.donateMoreTitle")}</h3>
        <p className="text-sm text-gray-500 text-center mb-5">{name}</p>
        <div className="flex flex-col gap-3">
          <Link
            href={pd.campaignId ? `/donate/${encodeURIComponent(pd.campaignId)}/amount?amount=${pd.lastDonationAmount}` : "/search"}
            className="flex items-center justify-between border-2 border-gray-200 rounded-xl p-4 hover:border-raz-teal transition-colors group"
          >
            <div>
              <p className="font-bold text-gray-800 group-hover:text-raz-teal">{t("myDon.singleDonation")}</p>
              <p className="text-xs text-gray-400 mt-0.5">{lang === "en" ? "One-time payment" : "תשלום חד פעמי"}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-raz-teal/10 flex items-center justify-center text-xl">
              💳
            </div>
          </Link>
          <button
            onClick={() => onActivateRecurring(pd.id)}
            className="flex items-center justify-between border-2 border-gray-200 rounded-xl p-4 hover:border-raz-teal transition-colors group text-start w-full"
          >
            <div>
              <p className="font-bold text-gray-800 group-hover:text-raz-teal">{t("rec.title")}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t("recurring.sub")}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-raz-teal/10 flex items-center justify-center text-xl">
              🔁
            </div>
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

function StandingOrderPopup({ pd, paymentMethods, onAddPaymentMethod, onClose, t, lang, userId }: { pd: ProductDonation; paymentMethods: PaymentMethod[]; onAddPaymentMethod: (method: PaymentMethod) => void; onClose: () => void; t: (k: string) => string; lang: string; userId?: string }) {
  const router = useRouter();
  const [selectedPm, setSelectedPm] = useState<string | null>(null);
  const [addingPayment, setAddingPayment] = useState(false);
  const [brand, setBrand] = useState("Visa");
  const [last4, setLast4] = useState("");
  const [status, setStatus] = useState("");
  const name = lang === "en" ? pd.productNameEn : pd.productName;

  async function savePaymentMethod() {
    if (!userId) { setStatus(lang === "en" ? "Sign in to save a payment method." : "יש להתחבר כדי לשמור אמצעי תשלום."); return; }
    if (!/^\d{4}$/.test(last4)) { setStatus(lang === "en" ? "Enter exactly four digits." : "יש להזין ארבע ספרות בדיוק."); return; }
    const saved = await addPaymentMethod(brand.trim() || "Card", last4);
    if (!saved) { setStatus(lang === "en" ? "Could not save the payment method." : "לא ניתן לשמור את אמצעי התשלום."); return; }
    onAddPaymentMethod(saved);
    setSelectedPm(saved.id);
    setAddingPayment(false);
    setLast4("");
    setStatus(lang === "en" ? "Payment method saved." : "אמצעי התשלום נשמר.");
  }

  function activateRecurring() {
    if (!pd.campaignId) { setStatus(lang === "en" ? "This donation is not linked to an active campaign." : "התרומה הזו אינה מקושרת לקמפיין פעיל."); return; }
    if (!selectedPm) return;
    router.push(`/donate/${encodeURIComponent(pd.campaignId)}/amount?amount=${pd.lastDonationAmount}&recurring=1`);
  }
  return (
    <Backdrop onClose={onClose}>
      <div className="p-5 relative">
        <button onClick={onClose} className="micro-hint micro-hint-below absolute top-4 end-4 text-gray-400 hover:text-gray-600" aria-label={t("hint.close")}><X size={20} /></button>
        <h3 className="font-bold text-gray-800 text-base text-center mb-1">{t("myDon.activateRecurring")}</h3>
        <p className="text-sm text-gray-500 text-center mb-1">
          {t("myDon.forProduct")} {name}
        </p>
        <p className="text-sm text-gray-500 text-center mb-5">
          {t("myDon.forAmount")} <span className="font-bold text-gray-800">{formatNIS(pd.lastDonationAmount)}</span> {t("perMonth")}
        </p>

        <p className="text-sm font-bold text-gray-700 mb-3">{t("myDon.choosePayment")}</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {paymentMethods.map((pm) => (
            <button
              key={pm.id}
              onClick={() => setSelectedPm(pm.id)}
              className={`border-2 rounded-xl p-3 flex items-center gap-2 transition-colors ${
                selectedPm === pm.id ? "border-raz-teal bg-raz-teal/5" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <CreditCard size={16} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium">••••{pm.last4}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setAddingPayment((current) => !current)} className="w-full border border-dashed border-gray-300 rounded-xl py-2.5 text-sm text-gray-500 hover:border-raz-teal hover:text-raz-teal flex items-center justify-center gap-2 mb-3 transition-colors">
          <Plus size={15} />
          {t("myDon.addPayment")}
        </button>
        {addingPayment && <div className="mb-4 grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-gray-50 p-3"><input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder={lang === "en" ? "Card brand" : "סוג כרטיס"} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-raz-teal focus:outline-none" /><input value={last4} onChange={(event) => setLast4(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" dir="ltr" placeholder="1234" className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm focus:border-raz-teal focus:outline-none" /><button type="button" onClick={savePaymentMethod} className="col-span-2 rounded-lg bg-raz-teal px-3 py-2 text-sm font-bold text-white">{lang === "en" ? "Save payment method" : "שמירת אמצעי תשלום"}</button></div>}

        <button
          type="button"
          onClick={activateRecurring}
          disabled={!selectedPm}
          className="w-full bg-raz-dark text-white rounded-xl py-3 text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {t("myDon.activateBtn")}
        </button>
        <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
          * {t("myDon.cancelAnytime")}
        </p>
        {status && <p className="mt-3 text-center text-xs text-gray-600" role="status">{status}</p>}
      </div>
    </Backdrop>
  );
}

function TaxRefundPopup({ onClose, t, lang }: { onClose: () => void; t: (k: string) => string; lang: string }) {
  return (
    <Backdrop onClose={onClose}>
      <div className="p-5 relative">
        <button onClick={onClose} className="micro-hint micro-hint-below absolute top-4 end-4 text-gray-400 hover:text-gray-600" aria-label={t("hint.close")}><X size={20} /></button>
        <h3 className="font-bold text-gray-800 text-base mb-4 text-center">{t("myDon.taxRefundTitle")}</h3>
        <div className="flex justify-center mb-4 text-5xl">🏛️</div>
        <p className="text-sm text-gray-600 leading-relaxed mb-4" dir={lang === "en" ? "ltr" : "rtl"}>
          {t("myDon.taxInfo")}
        </p>
        <a href="https://www.gov.il/he/service/confirmation-of-donations" target="_blank" rel="noreferrer" className="text-raz-teal text-sm underline block text-center mb-4">
          {t("myDon.taxInfoLink")}
        </a>
        <button
          onClick={onClose}
          className="w-full bg-raz-teal text-white rounded-xl py-3 text-sm font-bold"
        >
          {t("confirm")}
        </button>
      </div>
    </Backdrop>
  );
}

interface PopupsProps extends BaseProps {
  popup: PopupName;
  productId: string | null;
  donations: ProductDonation[];
  onActivateRecurring: (id: string) => void;
}

export function Popups({ popup, productId, donations, onClose, onActivateRecurring, lang, t }: PopupsProps) {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const pd = donations.find((d) => d.id === productId) ?? donations[0];

  useEffect(() => {
    if (user) getPaymentMethods(user.id).then(setPaymentMethods);
  }, [user]);

  if (!pd) return null;

  if (popup === "certificate") return <CertificatePopup pd={pd} onClose={onClose} t={t} />;
  if (popup === "receipts") return <ReceiptsPopup pd={pd} onClose={onClose} t={t} lang={lang} />;
  if (popup === "donate-more") return <DonateMorePopup pd={pd} onClose={onClose} onActivateRecurring={onActivateRecurring} t={t} lang={lang} />;
  if (popup === "standing-order") return <StandingOrderPopup pd={pd} paymentMethods={paymentMethods} onAddPaymentMethod={(method) => setPaymentMethods((current) => [method, ...current])} onClose={onClose} t={t} lang={lang} userId={user?.id} />;
  if (popup === "tax-refund") return <TaxRefundPopup onClose={onClose} t={t} lang={lang} />;
  return null;
}
