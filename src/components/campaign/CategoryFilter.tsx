"use client";
import { categories } from "@/lib/mock-data";
import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";

const catKeys: Record<string, string> = {
  all: "cat.all", food: "cat.food", education: "cat.education",
  health: "cat.health", elderly: "cat.elderly", children: "cat.children",
  environment: "cat.environment",
};

export default function CategoryFilter({ onSelect }: { onSelect?: (id: string) => void }) {
  const [active, setActive] = useState("all");
  const { t, dir } = useLang();

  function select(id: string) {
    setActive(id);
    onSelect?.(id);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 px-4 no-scrollbar" dir={dir}>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => select(cat.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
            active === cat.id ? "bg-raz-teal text-white" : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          <span>{cat.emoji}</span>
          <span>{t(catKeys[cat.id] ?? cat.id)}</span>
        </button>
      ))}
    </div>
  );
}
