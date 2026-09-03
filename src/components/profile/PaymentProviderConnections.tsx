"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, ExternalLink, ShieldCheck } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import {
  getNgoPaymentConnections,
  startNgoPaymentConnection,
  type PaymentConnection,
  type PaymentProvider,
} from "@/lib/supabase/queries-payment-connections";

const PROVIDERS: Record<PaymentProvider, { name: string; url: string }> = {
  cardcom: { name: "Cardcom", url: "https://www.cardcom.solutions/developers/" },
  grow: { name: "Grow", url: "https://developers.grow.business/docs/webhooks" },
};

export default function PaymentProviderConnections({ onConnectionSaved }: { onConnectionSaved?: () => void }) {
  const { lang } = useLang();
  const [connections, setConnections] = useState<PaymentConnection[]>([]);
  const [provider, setProvider] = useState<PaymentProvider>("cardcom");
  const [terminalId, setTerminalId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    const data = await getNgoPaymentConnections();
    setConnections(data);
  }

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void getNgoPaymentConnections().then((data) => {
        if (active) setConnections(data);
      }).catch(() => {
        if (active) setMessage(lang === "en" ? "Could not load payment connections." : "לא ניתן לטעון חיבורי סליקה.");
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [lang]);

  async function startConnection() {
    if (!terminalId.trim()) {
      setMessage(lang === "en" ? "Enter the terminal identifier first." : "יש להזין תחילה מזהה מסוף.");
      return;
    }
    setSaving(true); setMessage("");
    try {
      await startNgoPaymentConnection(provider, terminalId);
      await refresh();
      setTerminalId("");
      onConnectionSaved?.();
      setMessage(lang === "en" ? "Connection setup was saved. Complete the provider activation before accepting donations." : "הגדרת החיבור נשמרה. יש להשלים הפעלה מול הספק לפני קבלת תרומות.");
    } catch {
      setMessage(lang === "en" ? "Could not save the payment connection." : "לא ניתן לשמור את חיבור הסליקה.");
    } finally { setSaving(false); }
  }

  const setupText = provider === "cardcom"
    ? (lang === "en" ? "Prepare the terminal number, API name/password, a production callback URL, and confirm token charges are enabled." : "הכינו מספר מסוף, שם/סיסמת API, כתובת callback לייצור ואישור לחיובי token.")
    : (lang === "en" ? "Prepare the Grow user ID/API key, payment-page configuration, and ask Grow support to enable transaction and recurring-payment webhooks." : "הכינו מזהה משתמש/מפתח API, הגדרת עמוד תשלום ובקשו מ־Grow להפעיל webhooks לעסקאות ולחיובים חוזרים.");

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100" dir={lang === "en" ? "ltr" : "rtl"}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-raz-teal/10 text-raz-teal"><CreditCard size={22} /></span>
        <div>
          <h2 className="font-bold text-raz-dark">{lang === "en" ? "Payment terminal connection" : "חיבור מסוף סליקה"}</h2>
          <p className="mt-1 text-sm text-slate-500">{lang === "en" ? "Donations are charged on your own terminal and settle directly into your organization’s account." : "תרומות מחויבות במסוף של העמותה ומזוכות ישירות לחשבונה."}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2" role="group" aria-label={lang === "en" ? "Choose payment provider" : "בחירת ספק סליקה"}>
        {(Object.entries(PROVIDERS) as [PaymentProvider, (typeof PROVIDERS)[PaymentProvider]][]).map(([key, item]) => (
          <button key={key} type="button" onClick={() => { setProvider(key); setMessage(""); }} aria-pressed={provider === key}
            className={`interactive-control flex min-h-14 items-center justify-between rounded-xl border px-4 text-start ${provider === key ? "border-raz-teal bg-raz-teal/10 text-raz-dark shadow-sm" : "border-slate-200 bg-white text-slate-500"}`}>
            <span className="font-bold">{item.name}</span>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs transition-all ${provider === key ? "border-raz-teal bg-raz-teal text-white" : "border-slate-300 text-transparent"}`} aria-hidden="true">✓</span>
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input value={terminalId} onChange={(event) => setTerminalId(event.target.value)} maxLength={120} placeholder={lang === "en" ? "Terminal identifier" : "מזהה מסוף"} className="interactive-field min-h-11 rounded-xl border border-slate-200 px-3 text-sm" dir="ltr" />
        <button type="button" onClick={() => void startConnection()} disabled={saving} className="interactive-control inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-raz-teal px-5 text-sm font-bold text-white disabled:opacity-50">
          {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
          {saving ? (lang === "en" ? "Saving…" : "שומר…") : (lang === "en" ? "Start connection" : "התחלת חיבור")}
        </button>
      </div>

      <div key={provider} className="flow-reveal mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        <div className="flex gap-2"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-raz-teal" /><p>{setupText}</p></div>
        <a className="mt-3 inline-flex items-center gap-1 font-bold text-raz-teal hover:underline" href={PROVIDERS[provider].url} target="_blank" rel="noreferrer"><ExternalLink size={14} />{lang === "en" ? `${PROVIDERS[provider].name} developer documentation` : `תיעוד מפתחים של ${PROVIDERS[provider].name}`}</a>
      </div>

      {loading ? <p className="mt-5 text-sm text-slate-400">{lang === "en" ? "Loading payment connections…" : "טוען חיבורי סליקה…"}</p> : connections.length > 0 && <div className="mt-5 space-y-2">
        {connections.map((connection) => <div key={connection.id} className="flow-reveal flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm"><span className="font-bold text-raz-dark">{PROVIDERS[connection.provider].name} · <bdi>{connection.terminalId}</bdi></span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${connection.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{connection.status === "active" ? (lang === "en" ? "Active" : "פעיל") : (lang === "en" ? "Setup required" : "נדרשת השלמת הגדרה")}</span></div>)}
      </div>}
      {message && <p className="mt-4 text-sm text-slate-600" role="status">{message}</p>}
      <p className="mt-5 flex gap-2 text-xs text-slate-500"><CheckCircle2 size={16} className="shrink-0 text-raz-teal" />{lang === "en" ? "Impactify does not collect card numbers, CVV, or your provider credentials in this step." : "בשלב זה Impactify אינה אוספת מספרי כרטיס, CVV או פרטי גישה למסוף."}</p>
    </section>
  );
}
