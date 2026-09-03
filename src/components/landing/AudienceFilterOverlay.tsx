"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import type { AudienceKind } from "@/lib/landing-data";
import { getDiscoverableProductsForAudience, type DiscoverableProduct } from "@/lib/supabase/queries";
import { useRouter } from "next/navigation";
import ProductCard from "./ProductCard";
import LiveProductDonationModal from "./LiveProductDonationModal";
import EditableText from "@/components/admin/EditableText";

export default function AudienceFilterOverlay({
  kind,
  onClose,
}: {
  kind: AudienceKind;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const [products, setProducts] = useState<DiscoverableProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<DiscoverableProduct | null>(null);

  useEffect(() => {
    void getDiscoverableProductsForAudience(kind).then(setProducts);
  }, [kind]);

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
                key={`${p.productId}-${p.campaignId}`}
                title={lang === "en" ? (p.nameEn ?? p.name) : p.name}
                price={p.price}
                emoji={p.emoji}
                imageUrl={p.imageUrl}
                videoUrl={p.videoUrl}
                onChoose={() => setSelectedProduct(p)}
              />
            ))}
          </div>
      </div>

      {selectedProduct && <LiveProductDonationModal product={selectedProduct} otherProducts={products.filter((product) => product !== selectedProduct)} onChooseProduct={setSelectedProduct} onContinue={() => router.push(`/donate/${selectedProduct.campaignId}/payment?amount=${selectedProduct.price}&product_id=${selectedProduct.productId}`)} onClose={() => setSelectedProduct(null)} />}

    </>
  );
}
