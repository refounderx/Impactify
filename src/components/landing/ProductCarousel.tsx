"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { landingProducts } from "@/lib/landing-data";
import ProductCard from "./ProductCard";
import EditableText from "@/components/admin/EditableText";

export default function ProductCarousel() {
  const { t } = useLang();
  const [start, setStart] = useState(0);
  const visible = landingProducts.slice(start, start + 4);

  function prev() {
    setStart((s) => Math.max(0, s - 1));
  }
  function next() {
    setStart((s) => Math.min(landingProducts.length - 4, s + 1));
  }

  return (
    <section className="bg-raz-surface py-14">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8"><EditableText tKey="landing.products.heading" /></h2>

        <div className="flex items-center gap-4">
          <button onClick={prev} className="text-gray-400 hover:text-gray-700 flex-shrink-0" aria-label="prev">
            <ChevronLeft size={28} />
          </button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 flex-1">
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                title={t(p.titleKey)}
                price={p.price}
                priceRange={p.priceRange}
                emoji={p.emoji}
                campaignCta={p.cta === "campaign"}
              />
            ))}
          </div>

          <button onClick={next} className="text-gray-400 hover:text-gray-700 flex-shrink-0" aria-label="next">
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
    </section>
  );
}
