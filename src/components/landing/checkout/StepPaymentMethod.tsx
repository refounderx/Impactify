"use client";
import EditableText from "@/components/admin/EditableText";

export type PaymentMethod = "bit" | "card";

export default function StepPaymentMethod({ onChoose }: { onChoose: (m: PaymentMethod) => void }) {
  return (
    <div className="text-center">
      <EditableText tKey="landing.checkout.paymentTitle" as="h3" className="font-bold text-gray-900 mb-6 block" />
      <div className="flex flex-col gap-3">
        <button
          onClick={() => onChoose("bit")}
          className="bg-gradient-to-l from-[#0d3b66] to-[#1a9dab] text-white font-bold py-3 rounded-full"
        >
          <EditableText tKey="landing.checkout.payBit" />
        </button>
        <button onClick={() => onChoose("card")} className="border border-gray-200 text-gray-700 font-bold py-3 rounded-full">
          <EditableText tKey="landing.checkout.payCard" />
        </button>
      </div>
    </div>
  );
}
