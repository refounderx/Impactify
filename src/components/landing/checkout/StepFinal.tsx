"use client";
import { useLang } from "@/contexts/LanguageContext";
import type { Frequency } from "./StepFrequency";

export default function StepFinal({ frequency }: { frequency: Frequency }) {
  const { t } = useLang();
  const isRecurring = frequency === "recurring";

  return (
    <div className="text-center py-10">
      <h3 className="font-bold text-gray-900 mb-8">
        {isRecurring ? t("landing.checkout.finalRecurringTitle") : t("landing.checkout.finalOnetimeTitle")}
      </h3>
      <p className="text-3xl font-bold text-raz-dark">
        {isRecurring ? t("landing.checkout.standingOrderFormPlaceholder") : t("landing.checkout.cardFormPlaceholder")}
      </p>
    </div>
  );
}
