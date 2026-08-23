"use client";
import EditableText from "@/components/admin/EditableText";

export type Frequency = "recurring" | "onetime";

export default function StepFrequency({ onChoose }: { onChoose: (f: Frequency) => void }) {
  return (
    <div className="text-center">
      <h3 className="font-bold text-gray-900 mb-6"><EditableText tKey="landing.checkout.frequencyTitle" /></h3>
      <div className="flex flex-col gap-3">
        <button onClick={() => onChoose("recurring")} className="bg-raz-teal text-white font-bold py-3 rounded-full">
          <EditableText tKey="landing.checkout.recurring" />
        </button>
        <button onClick={() => onChoose("onetime")} className="border border-gray-200 text-gray-700 font-bold py-3 rounded-full">
          <EditableText tKey="landing.checkout.onetime" />
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-4"><EditableText tKey="myDon.cancelAnytime" /></p>
    </div>
  );
}
