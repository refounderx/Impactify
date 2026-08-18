"use client";
import { useLang } from "@/contexts/LanguageContext";

export type Frequency = "recurring" | "onetime";

export default function StepFrequency({ onChoose }: { onChoose: (f: Frequency) => void }) {
  const { t } = useLang();

  return (
    <div className="text-center">
      <h3 className="font-bold text-gray-900 mb-6">{t("landing.checkout.frequencyTitle")}</h3>
      <div className="flex flex-col gap-3">
        <button onClick={() => onChoose("recurring")} className="bg-raz-teal text-white font-bold py-3 rounded-full">
          {t("landing.checkout.recurring")}
        </button>
        <button onClick={() => onChoose("onetime")} className="border border-gray-200 text-gray-700 font-bold py-3 rounded-full">
          {t("landing.checkout.onetime")}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-4">{t("myDon.cancelAnytime")}</p>
    </div>
  );
}
