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
import WizardShell from "@/components/wizard/WizardShell";

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

  const isRecurringFlow = frequency === "recurring";
  const stepIndex: Record<Step, number> = {
    product: 0,
    personal: 1,
    frequency: 2,
    payment: 3,
    final: isRecurringFlow ? 3 : 4,
  };
  const stepCount = isRecurringFlow ? 4 : 5;
  const stepTitle: Record<Step, string> = {
    product: lang === "en" ? product.titleEn : product.title,
    personal: t("landing.checkout.personalTitle"),
    frequency: t("landing.checkout.frequencyTitle"),
    payment: t("landing.checkout.paymentTitle"),
    final: isRecurringFlow ? t("landing.checkout.finalRecurringTitle") : t("landing.checkout.finalOnetimeTitle"),
  };
  const stepDescription: Record<Step, string> = {
    product: lang === "en" ? "Choose quantities and review the impact of this donation." : "בחרו כמויות ובדקו את ההשפעה של התרומה הזו.",
    personal: lang === "en" ? "Add the details needed to complete the donation." : "הוסיפו את הפרטים הדרושים להשלמת התרומה.",
    frequency: lang === "en" ? "Choose whether this is a one-time or recurring gift." : "בחרו אם זו תרומה חד־פעמית או תרומה קבועה.",
    payment: lang === "en" ? "Select the payment method you want to use." : "בחרו את אמצעי התשלום שבו תרצו להשתמש.",
    final: lang === "en" ? "Complete the final payment details securely." : "השלימו את פרטי התשלום האחרונים בצורה מאובטחת.",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-raz-dark/90 p-0 backdrop-blur-[2px] md:p-7">
      <WizardShell
        step={stepIndex[step]}
        stepCount={stepCount}
        title={stepTitle[step]}
        description={stepDescription[step]}
        className="h-full max-w-6xl md:h-[min(780px,calc(100dvh-3.5rem))] md:rounded-[2px]"
        contentClassName="md:px-12"
        topActions={(
          <button onClick={onClose} className="micro-hint micro-hint-below interactive-control rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={t("hint.close")}>
            <X size={18} />
          </button>
        )}
        railContent={(
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/80">
            <div className="flex items-center justify-between gap-3">
              <span>{lang === "en" ? "Donation total" : "סה״כ תרומה"}</span>
              <strong className="text-lg text-white">₪{total.toLocaleString()}</strong>
            </div>
            <p className="mt-2 text-xs text-white/60">{itemCount} {lang === "en" ? "items selected" : "פריטים נבחרו"}</p>
          </div>
        )}
      >
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
      </WizardShell>
    </div>
  );
}
