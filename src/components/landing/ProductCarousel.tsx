"use client";
import { useEffect, useRef, useState } from "react";
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
  const mobileCarouselRef = useRef<HTMLDivElement>(null);
  const mobileDrag = useRef<{ pointerId: number; lastX: number; moved: boolean } | null>(null);
  const suppressMobileClick = useRef(false);
  useEffect(() => { void getDiscoverableProducts().then(setLandingProducts); }, []);
  const maxDesktopStart = Math.max(0, landingProducts.length - 4);
  const desktopVisible = landingProducts.slice(desktopStart, desktopStart + 4);
  const hasMobileCarousel = landingProducts.length > 1;
  const mobileCarouselItems = hasMobileCarousel
    ? Array.from({ length: 3 }, (_, copyIndex) => landingProducts.map((product) => ({ product, copyIndex }))).flat()
    : landingProducts.map((product) => ({ product, copyIndex: 1 }));

  useEffect(() => {
    if (!hasMobileCarousel) return;
    const carousel = mobileCarouselRef.current;
    const first = carousel?.querySelector<HTMLDivElement>('[data-loop-copy="0"]');
    const middle = carousel?.querySelector<HTMLDivElement>('[data-loop-copy="1"]');
    if (carousel && first && middle) carousel.scrollLeft = middle.offsetLeft - first.offsetLeft;
  }, [hasMobileCarousel, landingProducts.length]);

  function normalizeMobileLoop() {
    if (!hasMobileCarousel) return;
    const carousel = mobileCarouselRef.current;
    const middle = carousel?.querySelector<HTMLDivElement>('[data-loop-copy="1"]');
    const third = carousel?.querySelector<HTMLDivElement>('[data-loop-copy="2"]');
    if (!carousel || !middle || !third) return;
    const groupWidth = third.offsetLeft - middle.offsetLeft;
    if (groupWidth <= 0) return;
    if (carousel.scrollLeft < groupWidth * 0.25) carousel.scrollLeft += groupWidth;
    else if (carousel.scrollLeft > groupWidth * 1.75) carousel.scrollLeft -= groupWidth;
  }

  function previousDesktop() {
    setDesktopStart((current) => maxDesktopStart === 0 ? 0 : current === 0 ? maxDesktopStart : current - 1);
  }
  function nextDesktop() {
    setDesktopStart((current) => maxDesktopStart === 0 ? 0 : current === maxDesktopStart ? 0 : current + 1);
  }
  function scrollMobile(direction: -1 | 1) {
    const carousel = mobileCarouselRef.current;
    if (carousel) carousel.scrollBy({ left: direction * carousel.clientWidth * 0.8, behavior: "smooth" });
  }
  function startMobileDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    mobileDrag.current = { pointerId: event.pointerId, lastX: event.clientX, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveMobileDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = mobileDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.lastX;
    if (Math.abs(distance) > 3) drag.moved = true;
    event.currentTarget.scrollBy({ left: -distance, behavior: "instant" });
    drag.lastX = event.clientX;
  }
  function endMobileDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = mobileDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    mobileDrag.current = null;
    if (drag.moved) {
      suppressMobileClick.current = true;
      window.setTimeout(() => { suppressMobileClick.current = false; }, 0);
    }
  }

  return (
    <section id="popular-products" className="bg-raz-surface py-14">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8"><EditableText tKey="landing.products.heading" /></h2>

        <div className="flex items-center gap-3 md:hidden" dir="rtl" aria-roledescription="carousel">
          <button type="button" onClick={() => scrollMobile(1)} disabled={!hasMobileCarousel} className="micro-hint interactive-control flex-shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-35" aria-label={t("hint.next")}>
            <ChevronRight size={28} />
          </button>

          <div ref={mobileCarouselRef} dir="ltr" onScroll={normalizeMobileLoop} onPointerDown={startMobileDrag} onPointerMove={moveMobileDrag} onPointerUp={endMobileDrag} onPointerCancel={endMobileDrag} onClickCapture={(event) => { if (suppressMobileClick.current) { event.preventDefault(); event.stopPropagation(); } }} className="no-scrollbar flex min-w-0 flex-1 touch-pan-y select-none gap-3 overflow-x-auto pb-2">
              {mobileCarouselItems.map(({ product: p, copyIndex }, index) => (
                <div data-loop-copy={copyIndex} className="w-[78vw] max-w-sm shrink-0" key={`${p.productId}-${p.campaignId}-${copyIndex}-${index}`}>
                  <ProductCard
                    title={lang === "en" ? (p.nameEn ?? p.name) : p.name}
                    price={p.price}
                    emoji={p.emoji}
                    imageUrl={p.imageUrl}
                    videoUrl={p.videoUrl}
                    donationCount={p.donationCount}
                    donorPersona={p.donorPersona}
                    donorSubcategory={lang === "en" ? p.donorSubcategoryEn : p.donorSubcategory}
                    onOpenDetails={() => router.push(`/product/${p.productId}`)}
                    onChoose={() => setSelectedProduct(p)}
                  />
                </div>
              ))}
          </div>

          <button type="button" onClick={() => scrollMobile(-1)} disabled={!hasMobileCarousel} className="micro-hint interactive-control flex-shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-35" aria-label={t("hint.previous")}>
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
                imageUrl={p.imageUrl}
                videoUrl={p.videoUrl}
                donationCount={p.donationCount}
                donorPersona={p.donorPersona}
                donorSubcategory={lang === "en" ? p.donorSubcategoryEn : p.donorSubcategory}
                onOpenDetails={() => router.push(`/product/${p.productId}`)}
                onChoose={() => setSelectedProduct(p)}
              />
            ))}
          </div>

          <button type="button" onClick={nextDesktop} disabled={maxDesktopStart === 0} className="micro-hint interactive-control flex-shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-35" aria-label={t("hint.next")}>
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
      {selectedProduct && <LiveProductDonationModal product={selectedProduct} otherProducts={landingProducts.filter((product) => product !== selectedProduct)} onChooseProduct={setSelectedProduct} onContinue={() => router.push(`/donate/${selectedProduct.productId}/payment?direct_product=1&amount=${selectedProduct.price}&product_id=${selectedProduct.productId}`)} onClose={() => setSelectedProduct(null)} />}
    </section>
  );
}
