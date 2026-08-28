"use client";
import { Play } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import type { AudienceProduct } from "@/lib/landing-data";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import { formatNIS } from "@/lib/mock-data";
import EditableText from "@/components/admin/EditableText";

export default function StepProduct({
  product,
  qty,
  onQtyChange,
  otherProducts,
  otherQty,
  onOtherQtyChange,
  total,
  onContinue,
}: {
  product: AudienceProduct;
  qty: number;
  onQtyChange: (qty: number) => void;
  otherProducts: AudienceProduct[];
  otherQty: Record<string, number>;
  onOtherQtyChange: (id: string, qty: number) => void;
  total: number;
  onContinue: () => void;
}) {
  const { data } = useSiteDataset("landing");
  const checkoutProgress = data?.checkoutProgress ?? { goal: 0, raised: 0 };
  const { lang, t } = useLang();

  return (
    <div>
      <div className="bg-black rounded-2xl h-56 flex items-center justify-center mb-6">
        <button className="micro-hint w-14 h-14 rounded-full bg-white/90 flex items-center justify-center text-gray-700" aria-label={t("hint.play")}>
          <Play size={22} fill="currentColor" />
        </button>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-gray-900 mb-2">{lang === "en" ? product.titleEn : product.title}</h3>
          <p className="text-2xl font-bold font-numeric text-gray-900 mb-2">{formatNIS(product.price * qty)}</p>
          <div className="inline-flex items-center gap-2 border border-raz-teal rounded-full px-2 py-1 text-sm">
            <button onClick={() => onQtyChange(Math.max(1, qty + 1))} className="micro-hint text-raz-teal font-bold" aria-label={t("hint.increase")}>+</button>
            <span className="font-numeric">{qty}</span>
            <button onClick={() => onQtyChange(Math.max(0, qty - 1))} className="micro-hint text-raz-teal font-bold" aria-label={t("hint.decrease")}>-</button>
          </div>
          <p className="text-xs text-gray-400 mt-2">257 ❤ <EditableText tKey="landing.products.chosen" /></p>
        </div>
        <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-4xl flex-shrink-0">{product.emoji}</div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <EditableText tKey="landing.checkout.progressIncludes" as="p" className="text-sm font-bold text-gray-700 mb-1 block" />
        <p className="text-xs text-gray-500 mb-2">
          <EditableText tKey="landing.checkout.progressPrefix" /> {checkoutProgress.goal.toLocaleString()} <EditableText tKey="landing.checkout.progressMid" />{" "}
          <span className="font-bold text-raz-teal">{checkoutProgress.raised.toLocaleString()}</span> <EditableText tKey="landing.checkout.progressUnit" />
        </p>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-raz-teal rounded-full" style={{ width: `${Math.round((checkoutProgress.raised / checkoutProgress.goal) * 100)}%` }} />
        </div>
      </div>

      <EditableText tKey="landing.checkout.crossSellHeading" as="p" className="text-sm font-bold text-gray-700 text-center mb-4 block" />
      <div className="grid grid-cols-3 gap-3 mb-6">
        {otherProducts.map((p) => (
          <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <div className="w-14 h-14 mx-auto rounded-lg bg-gray-50 flex items-center justify-center text-3xl mb-2">{p.emoji}</div>
            <p className="text-xs text-gray-700 mb-1 leading-snug">{lang === "en" ? p.titleEn : p.title}</p>
            <p className="text-sm font-bold font-numeric text-gray-900 mb-2">{formatNIS(p.price)}</p>
            <div className="inline-flex items-center gap-2 border border-raz-teal rounded-full px-2 py-0.5 text-xs">
              <button onClick={() => onOtherQtyChange(p.id, (otherQty[p.id] ?? 0) + 1)} className="micro-hint text-raz-teal font-bold" aria-label={t("hint.increase")}>+</button>
              <span className="font-numeric">{otherQty[p.id] ?? 0}</span>
              <button onClick={() => onOtherQtyChange(p.id, Math.max(0, (otherQty[p.id] ?? 0) - 1))} className="micro-hint text-raz-teal font-bold" aria-label={t("hint.decrease")}>-</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500"><EditableText tKey="landing.checkout.totalLabel" /></span>
        <span className="text-3xl font-bold font-numeric text-gray-900">{formatNIS(total)}</span>
      </div>
      <button onClick={onContinue} className="w-full bg-raz-teal text-white font-bold py-3 rounded-full">
        <EditableText tKey="landing.checkout.continuePersonal" />
      </button>
    </div>
  );
}
