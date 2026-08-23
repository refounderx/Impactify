"use client";
import type { Frequency } from "./StepFrequency";
import EditableText from "@/components/admin/EditableText";

export default function StepFinal({ frequency }: { frequency: Frequency }) {
  const isRecurring = frequency === "recurring";

  return (
    <div className="text-center py-10">
      <h3 className="font-bold text-gray-900 mb-8">
        {isRecurring ? <EditableText tKey="landing.checkout.finalRecurringTitle" /> : <EditableText tKey="landing.checkout.finalOnetimeTitle" />}
      </h3>
      <p className="text-3xl font-bold text-raz-dark">
        {isRecurring ? <EditableText tKey="landing.checkout.standingOrderFormPlaceholder" /> : <EditableText tKey="landing.checkout.cardFormPlaceholder" />}
      </p>
    </div>
  );
}
