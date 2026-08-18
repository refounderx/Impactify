"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import type { AudienceProduct } from "@/lib/landing-data";
import StepProduct from "./StepProduct";
import StepPersonalDetails from "./StepPersonalDetails";
import StepFrequency, { type Frequency } from "./StepFrequency";
import StepPaymentMethod from "./StepPaymentMethod";
import StepFinal from "./StepFinal";

type Step = "product" | "personal" | "frequency" | "payment" | "final";

export default function CheckoutModal({
  product,
  otherProducts,
  onClose,
}: {
  product: AudienceProduct;
  otherProducts: AudienceProduct[];
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const [step, setStep] = useState<Step>("product");
  const [qty, setQty] = useState(1);
  const [otherQty, setOtherQty] = useState<Record<string, number>>({});
  const [frequency, setFrequency] = useState<Frequency>("onetime");

  const total =
    product.price * qty +
    otherProducts.reduce((sum, p) => sum + p.price * (otherQty[p.id] ?? 0), 0);
  const itemCount = qty + Object.values(otherQty).reduce((a, b) => a + b, 0);

  const stepBadge: Partial<Record<Step, number>> =
    frequency === "recurring"
      ? { personal: 1, frequency: 2, final: 3 }
      : { personal: 1, frequency: 2, payment: 3, final: 4 };

  return (
    <div className="fixed inset-0 z-50 bg-raz-dark/95 overflow-y-auto flex items-start justify-center py-10 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 start-4 text-gray-400" aria-label={t("landing.filter.close")}>
          <X size={22} />
        </button>

        {step !== "product" && (
          <span className="absolute top-4 end-4 w-6 h-6 rounded-full bg-raz-teal text-white text-xs font-bold flex items-center justify-center">
            {stepBadge[step]}
          </span>
        )}

        <div className="mt-8">
          {step === "product" && (
            <StepProduct
              product={product}
              qty={qty}
              onQtyChange={setQty}
              otherProducts={otherProducts}
              otherQty={otherQty}
              onOtherQtyChange={(id, q) => setOtherQty((prev) => ({ ...prev, [id]: q }))}
              total={total}
              onContinue={() => setStep("personal")}
            />
          )}
          {step === "personal" && (
            <StepPersonalDetails
              total={total}
              itemCount={itemCount}
              productLabel={lang === "en" ? product.titleEn : product.title}
              onContinue={() => setStep("frequency")}
            />
          )}
          {step === "frequency" && (
            <StepFrequency
              onChoose={(f) => {
                setFrequency(f);
                setStep(f === "recurring" ? "final" : "payment");
              }}
            />
          )}
          {step === "payment" && <StepPaymentMethod onChoose={() => setStep("final")} />}
          {step === "final" && <StepFinal frequency={frequency} />}
        </div>
      </div>
    </div>
  );
}
