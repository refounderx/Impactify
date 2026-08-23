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
  onClose: () => void;
}

export default function DonateAmountModal({ campaignId, title, gradient, emoji, onClose }: DonateAmountModalProps) {
  const router = useRouter();
  const { t } = useLang();
  const [selected, setSelected] = useState<number | null>(100);
  const [custom, setCustom] = useState("");
  const amount = custom ? parseInt(custom) : selected;

  function goToDonate() {
    if (!amount || amount <= 0) return;
    router.push(`/donate/${campaignId}/payment?amount=${amount}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 px-0 md:px-4" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 end-4 text-gray-400 hover:text-gray-600">
          <X size={22} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
            <span className="text-3xl">{emoji}</span>
          </div>
          <p className="font-bold text-gray-800 leading-snug">{title}</p>
        </div>

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
