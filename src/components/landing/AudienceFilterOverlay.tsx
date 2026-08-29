"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import type { AudienceKind } from "@/lib/landing-data";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import ProductCard from "./ProductCard";
import CheckoutModal from "./checkout/CheckoutModal";
import EditableText from "@/components/admin/EditableText";

export default function AudienceFilterOverlay({
  kind,
  onClose,
}: {
  kind: AudienceKind;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const { data } = useSiteDataset("landing");
  const [chosenId, setChosenId] = useState<string | null>(null);
  const products = data?.audienceProducts[kind] ?? [];
  const chosenProduct = products.find((p) => p.id === chosenId);

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-raz-dark/95"
        onClick={onClose}
        aria-label={t("landing.filter.close")}
      />
      <div className="relative z-50 mt-8 rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-5 flex justify-end">
          <button onClick={onClose} className="interactive-control flex items-center gap-1 text-sm text-gray-600" aria-label={t("landing.filter.close")}>
            <X size={20} /> <EditableText tKey="landing.filter.close" />
          </button>
        </div>
          <h2 className="text-2xl font-bold text-raz-teal text-center mb-8">
            <EditableText tKey="landing.filter.heading" /> <EditableText tKey={`landing.aud.${kind}.plural`} />
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

      {chosenProduct && (
        <CheckoutModal
          product={chosenProduct}
          otherProducts={products.filter((p) => p.id !== chosenProduct.id)}
          onClose={() => setChosenId(null)}
        />
      )}
    </>
  );
}
