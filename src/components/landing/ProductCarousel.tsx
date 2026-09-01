"use client";
import { type TransitionEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { getDiscoverableProducts, type DiscoverableProduct } from "@/lib/supabase/queries";
import ProductCard from "./ProductCard";
import LiveProductDonationModal from "./LiveProductDonationModal";
import EditableText from "@/components/admin/EditableText";

export default function ProductCarousel() {
  const { t, dir, lang } = useLang();
  const router = useRouter();
  const [landingProducts, setLandingProducts] = useState<DiscoverableProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<DiscoverableProduct | null>(null);
  const [desktopStart, setDesktopStart] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(1);
  const [skipMobileTransition, setSkipMobileTransition] = useState(false);
  useEffect(() => { void getDiscoverableProducts().then(setLandingProducts); }, []);
  const maxDesktopStart = Math.max(0, landingProducts.length - 4);
  const desktopVisible = landingProducts.slice(desktopStart, desktopStart + 4);
  const hasMobileCarousel = landingProducts.length > 1;
  const mobileSlides = hasMobileCarousel
    ? [landingProducts[landingProducts.length - 1], ...landingProducts, landingProducts[0]]
    : landingProducts;
  const mobileOffset = hasMobileCarousel ? mobileIndex : 0;

  function previousDesktop() {
    setDesktopStart((current) => maxDesktopStart === 0 ? 0 : current === 0 ? maxDesktopStart : current - 1);
  }
  function nextDesktop() {
    setDesktopStart((current) => maxDesktopStart === 0 ? 0 : current === maxDesktopStart ? 0 : current + 1);
  }
  function resetMobileLoop(index: number) {
    setSkipMobileTransition(true);
    setMobileIndex(index);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => setSkipMobileTransition(false)));
  }
  function previousMobile() {
    if (!hasMobileCarousel) return;
    setMobileIndex((current) => current - 1);
  }
  function nextMobile() {
    if (!hasMobileCarousel) return;
    setMobileIndex((current) => current + 1);
  }
  function handleMobileTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.propertyName !== "transform" || !hasMobileCarousel) return;
    if (mobileIndex === 0) resetMobileLoop(landingProducts.length);
    if (mobileIndex === landingProducts.length + 1) resetMobileLoop(1);
  }

  return (
    <section id="popular-products" className="bg-raz-surface py-14">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8"><EditableText tKey="landing.products.heading" /></h2>

        <div className="flex items-center gap-3 md:hidden" dir="rtl" aria-roledescription="carousel">
          <button type="button" onClick={nextMobile} disabled={!hasMobileCarousel} className="micro-hint interactive-control flex-shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-35" aria-label={t("hint.next")}>
            <ChevronRight size={28} />
          </button>

          <div className="min-w-0 flex-1 overflow-hidden">
            <div className={`flex ${skipMobileTransition ? "" : "transition-transform duration-300 ease-out"}`} style={{ transform: `translateX(${mobileOffset * 100}%)` }} onTransitionEnd={handleMobileTransitionEnd}>
              {mobileSlides.map((p, index) => (
                <div className="w-full flex-none" key={`${p.productId}-${p.campaignId}-${index}`}>
                  <ProductCard
                    title={lang === "en" ? (p.nameEn ?? p.name) : p.name}
                    price={p.price}
                    emoji={p.emoji}
                    onChoose={() => setSelectedProduct(p)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="button" onClick={previousMobile} disabled={!hasMobileCarousel} className="micro-hint interactive-control flex-shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-35" aria-label={t("hint.previous")}>
            <ChevronLeft size={28} />
          </button>
        </div>

        <div className="hidden items-center gap-4 md:flex" dir="ltr">
          <button type="button" onClick={previousDesktop} disabled={maxDesktopStart === 0} className="micro-hint interactive-control flex-shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-35" aria-label={t("hint.previous")}>
            <ChevronLeft size={28} />
          </button>

          <div className="grid min-w-0 flex-1 grid-cols-4 gap-5" dir={dir}>
            {desktopVisible.map((p) => (
              <ProductCard
                key={`${p.productId}-${p.campaignId}`}
                title={lang === "en" ? (p.nameEn ?? p.name) : p.name}
                price={p.price}
                emoji={p.emoji}
                onChoose={() => setSelectedProduct(p)}
              />
            ))}
          </div>

          <button type="button" onClick={nextDesktop} disabled={maxDesktopStart === 0} className="micro-hint interactive-control flex-shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-35" aria-label={t("hint.next")}>
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
      {selectedProduct && <LiveProductDonationModal product={selectedProduct} otherProducts={landingProducts.filter((product) => product !== selectedProduct)} onChooseProduct={setSelectedProduct} onContinue={() => router.push(`/donate/${selectedProduct.campaignId}/payment?amount=${selectedProduct.price}&product_id=${selectedProduct.productId}`)} onClose={() => setSelectedProduct(null)} />}
    </section>
  );
}
