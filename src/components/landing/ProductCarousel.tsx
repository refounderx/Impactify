"use client";
import { useEffect, useState } from "react";
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
  const [start, setStart] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  const maxStart = Math.max(0, landingProducts.length - cardsPerView);
  const activeStart = Math.min(start, maxStart);
  const visible = landingProducts.slice(activeStart, activeStart + cardsPerView);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const updateCardsPerView = () => setCardsPerView(media.matches ? 4 : 1);
    updateCardsPerView();
    media.addEventListener("change", updateCardsPerView);
    return () => media.removeEventListener("change", updateCardsPerView);
  }, []);

  function prev() {
    setStart((s) => Math.max(0, s - 1));
  }
  function next() {
    setStart((s) => Math.min(maxStart, s + 1));
  }

  return (
    <section className="bg-raz-surface py-14">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8"><EditableText tKey="landing.products.heading" /></h2>

        <div className="flex items-center gap-3 sm:gap-4">
          <button type="button" onClick={prev} disabled={activeStart === 0} className="micro-hint interactive-control text-gray-400 hover:text-gray-700 flex-shrink-0 disabled:opacity-35" aria-label={t("hint.previous")}>
            <ChevronLeft size={28} />
          </button>

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 md:grid-cols-4">
            {visible.map((p) => (
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

          <button type="button" onClick={next} disabled={activeStart >= maxStart} className="micro-hint interactive-control text-gray-400 hover:text-gray-700 flex-shrink-0 disabled:opacity-35" aria-label={t("hint.next")}>
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
    </section>
  );
}
