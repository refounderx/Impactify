"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { formatNIS } from "@/lib/mock-data";
import { useLang } from "@/contexts/LanguageContext";
import EditableText from "@/components/admin/EditableText";

const PRESETS = [50, 100, 200, 500];

interface DonateAmountModalProps {
  campaignId: string;
  title: string;
  gradient: string;
  emoji: string;
  communityId?: string;
  product?: { id: string; name: string; price: number } | null;
  onClose: () => void;
}

export default function DonateAmountModal({ campaignId, title, gradient, emoji, communityId, product = null, onClose }: DonateAmountModalProps) {
  const router = useRouter();
  const { t } = useLang();
  const [selected, setSelected] = useState<number | null>(product?.price ?? 100);
  const [custom, setCustom] = useState("");
  const amount = product ? product.price : (custom ? parseInt(custom) : selected);

  function goToDonate() {
    if (!amount || amount <= 0) return;
    const params = new URLSearchParams({ amount: String(amount) });
    if (product) params.set("product_id", product.id);
    if (communityId) params.set("community_id", communityId);
    router.push(`/donate/${campaignId}/payment?${params.toString()}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-2xl p-6 relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="micro-hint micro-hint-below absolute top-4 end-4 text-gray-400 hover:text-gray-600" aria-label={t("hint.close")}>
          <X size={22} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
            <span className="text-3xl">{emoji}</span>
          </div>
          <p className="font-bold text-gray-800 leading-snug">{title}</p>
        </div>

        {product ? (
          <div className="mb-5 rounded-xl bg-raz-teal/10 px-4 py-3 text-center text-sm font-medium text-raz-dark">
            {product.name} · {formatNIS(product.price)}
          </div>
        ) : <>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => { setSelected(p); setCustom(""); }}
              className={`py-4 rounded-xl text-base font-bold font-numeric transition-all ${
                selected === p && !custom
                  ? "bg-raz-teal text-white shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-100 hover:border-raz-teal"
              }`}
            >
              {formatNIS(p)}
            </button>
          ))}
        </div>

        <div className="bg-gray-50 rounded-xl border-2 border-gray-100 flex items-center px-4 py-3 mb-5">
          <span className="text-gray-700 font-bold text-lg">₪</span>
          <input
            type="number"
            placeholder={t("amount.placeholder")}
            value={custom}
            onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
            className="flex-1 outline-none text-end font-bold text-lg font-numeric text-gray-800 bg-transparent"
          />
        </div>
        </>}

        <button
          onClick={goToDonate}
          disabled={!amount || amount <= 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            amount && amount > 0 ? "bg-raz-teal text-white hover:bg-raz-teal-dark" : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          <EditableText tKey="campaign.continueDonate" />
        </button>
      </div>
    </div>
  );
}
