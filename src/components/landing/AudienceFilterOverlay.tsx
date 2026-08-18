"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { audienceProducts, type AudienceKind } from "@/lib/landing-data";
import AudienceIconRow from "./AudienceIconRow";
import ProductCard from "./ProductCard";
import CheckoutModal from "./checkout/CheckoutModal";

export default function AudienceFilterOverlay({
  kind,
  onSelect,
  onClose,
}: {
  kind: AudienceKind;
  onSelect: (kind: AudienceKind) => void;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const [chosenId, setChosenId] = useState<string | null>(null);
  const products = audienceProducts[kind];
  const chosenProduct = products.find((p) => p.id === chosenId);

  return (
    <div className="fixed inset-0 z-50 bg-raz-dark/95 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-end mb-4">
          <button onClick={onClose} className="flex items-center gap-1 text-sm text-white" aria-label={t("landing.filter.close")}>
            <X size={20} /> {t("landing.filter.close")}
          </button>
        </div>

        <AudienceIconRow selected={kind} onSelect={onSelect} />

        <div className="bg-white rounded-2xl mt-8 p-8">
          <h2 className="text-2xl font-bold text-raz-teal text-center mb-8">
            {t("landing.filter.heading")} {t(`landing.aud.${kind}.plural`)}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                title={lang === "en" ? p.titleEn : p.title}
                price={p.price}
                emoji={p.emoji}
                isChosen={p.id === chosenId}
                onChoose={() => setChosenId(p.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {chosenProduct && (
        <CheckoutModal
          product={chosenProduct}
          otherProducts={products.filter((p) => p.id !== chosenProduct.id)}
          onClose={() => setChosenId(null)}
        />
      )}
    </div>
  );
}
