"use client";
import { useLang } from "@/contexts/LanguageContext";

export type PaymentMethod = "bit" | "card";

export default function StepPaymentMethod({ onChoose }: { onChoose: (m: PaymentMethod) => void }) {
  const { t } = useLang();

  return (
    <div className="text-center">
      <h3 className="font-bold text-gray-900 mb-6">{t("landing.checkout.paymentTitle")}</h3>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => onChoose("bit")}
          className="bg-gradient-to-l from-[#0d3b66] to-[#1a9dab] text-white font-bold py-3 rounded-full"
        >
          {t("landing.checkout.payBit")}
        </button>
        <button onClick={() => onChoose("card")} className="border border-gray-200 text-gray-700 font-bold py-3 rounded-full">
          {t("landing.checkout.payCard")}
        </button>
      </div>
    </div>
  );
}
