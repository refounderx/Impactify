"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import ProductCard from "./ProductCard";
import EditableText from "@/components/admin/EditableText";

export default function ProductCarousel() {
  const { t } = useLang();
  const router = useRouter();
  const { data } = useSiteDataset("landing");
  const landingProducts = data?.landingProducts ?? [];
  const [desktopStart, setDesktopStart] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [skipMobileTransition, setSkipMobileTransition] = useState(false);
  const maxDesktopStart = Math.max(0, landingProducts.length - 4);
  const desktopVisible = landingProducts.slice(desktopStart, desktopStart + 4);
  const hasMobileCarousel = landingProducts.length > 1;

  function previousDesktop() {
    setDesktopStart((current) => maxDesktopStart === 0 ? 0 : current === 0 ? maxDesktopStart : current - 1);
  }
  function nextDesktop() {
    setDesktopStart((current) => maxDesktopStart === 0 ? 0 : current === maxDesktopStart ? 0 : current + 1);
  }
  function skipTransitionForWrap() {
    setSkipMobileTransition(true);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setSkipMobileTransition(false));
    });
  }
  function previousMobile() {
    if (!hasMobileCarousel) return;
    if (mobileIndex === 0) skipTransitionForWrap();
    setMobileIndex((current) => (current - 1 + landingProducts.length) % landingProducts.length);
  }
  function nextMobile() {
    if (!hasMobileCarousel) return;
    if (mobileIndex === landingProducts.length - 1) skipTransitionForWrap();
    setMobileIndex((current) => (current + 1) % landingProducts.length);
  }

  return (
    <section className="bg-raz-surface py-14">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8"><EditableText tKey="landing.products.heading" /></h2>

        <div className="flex items-center gap-3 md:hidden" dir="rtl" aria-roledescription="carousel">
          <button type="button" onClick={nextMobile} disabled={!hasMobileCarousel} className="micro-hint interactive-control flex-shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-35" aria-label={t("hint.next")}>
            <ChevronRight size={28} />
          </button>

          <div className="min-w-0 flex-1 overflow-hidden">
            <div className={`flex ${skipMobileTransition ? "" : "transition-transform duration-300 ease-out"}`} style={{ transform: `translateX(${mobileIndex * 100}%)` }}>
              {landingProducts.map((p) => (
                <div className="w-full flex-none" key={p.id}>
                  <ProductCard
                    title={t(p.titleKey)}
                    price={p.price}
                    priceRange={p.priceRange}
                    emoji={p.emoji}
                    campaignCta={p.cta === "campaign"}
                    onChoose={() => router.push("/search")}
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="button" onClick={previousMobile} disabled={!hasMobileCarousel} className="micro-hint interactive-control flex-shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-35" aria-label={t("hint.previous")}>
            <ChevronLeft size={28} />
          </button>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <button type="button" onClick={previousDesktop} disabled={maxDesktopStart === 0} className="micro-hint interactive-control flex-shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-35" aria-label={t("hint.previous")}>
            <ChevronLeft size={28} />
          </button>

          <div className="grid min-w-0 flex-1 grid-cols-4 gap-5">
            {desktopVisible.map((p) => (
              <ProductCard
                key={p.id}
                title={t(p.titleKey)}
                price={p.price}
                priceRange={p.priceRange}
                emoji={p.emoji}
                campaignCta={p.cta === "campaign"}
                onChoose={() => router.push("/search")}
              />
            ))}
          </div>

          <button type="button" onClick={nextDesktop} disabled={maxDesktopStart === 0} className="micro-hint interactive-control flex-shrink-0 text-gray-400 hover:text-gray-700 disabled:opacity-35" aria-label={t("hint.next")}>
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
    </section>
  );
}
