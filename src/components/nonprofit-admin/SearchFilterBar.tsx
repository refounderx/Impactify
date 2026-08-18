"use client";
import { Search, SlidersHorizontal } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export default function SearchFilterBar({ filterLabel }: { filterLabel: string }) {
  const { lang } = useLang();
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-xs">
        <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
        <input
          type="text"
          placeholder={lang === "en" ? "Search" : "חיפוש"}
          className="w-full border border-gray-200 rounded-lg ps-9 pe-3 py-2 text-sm outline-none focus:border-raz-teal"
        />
      </div>
      <button className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
        <SlidersHorizontal size={14} />
        {filterLabel}
      </button>
    </div>
  );
}
