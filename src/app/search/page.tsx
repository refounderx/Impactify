"use client";
import { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/layout/BottomNav";
import CampaignCard from "@/components/campaign/CampaignCard";
import { searchCampaigns } from "@/lib/supabase/queries";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import EditableText from "@/components/admin/EditableText";

export default function SearchPage() {
  const { lang, t } = useLang();
  const { data: sharedData } = useSiteDataset("shared");
  const categories = sharedData?.categories ?? [];
  const sortOptions = ["relevance", "newest", "funded", "ending"] as const;
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSort, setActiveSort] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchCampaigns>>>([]);
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const runSearch = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    const data = await searchCampaigns(q, cat);
    setResults(data);
    setLoading(false);
  }, []);

  // Debounce search as user types
  useEffect(() => {
    const timer = setTimeout(() => runSearch(query, activeCategory), 300);
    return () => clearTimeout(timer);
  }, [query, activeCategory, runSearch]);

  return (
    <div className="flex flex-col min-h-screen bg-raz-surface">
      {/* Header */}
      <div className="bg-raz-teal px-6 pt-6 pb-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-white font-bold text-2xl mb-4"><EditableText tKey="search.title" /></h1>
          <div className="flex gap-3">
            <div className="flex-1 bg-white rounded-xl flex items-center px-4 gap-2">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder={t("search.placeholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 py-3 text-sm outline-none bg-transparent text-right"
              />
              {query && <button onClick={() => setQuery("")} className="micro-hint" aria-label={t("hint.clearSearch")}><X size={16} className="text-gray-400" /></button>}
            </div>
            <button type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} aria-controls="search-filters" className="bg-white/20 text-white px-4 rounded-xl flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal size={18} /> <EditableText tKey="search.filter" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-6 -mt-4">
        {/* Category chips */}
        {filtersOpen && <section id="search-filters" aria-label={t("search.filter")} className="mt-5 rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-raz-dark">{t("search.filter")}</p><button type="button" onClick={() => { setActiveCategory("all"); setActiveSort(""); }} className="text-xs font-bold text-raz-teal hover:underline">{t("all")}</button></div><p className="mb-2 mt-4 text-xs font-bold text-gray-500">{lang === "en" ? "Category" : "קטגוריה"}</p><div className="flex flex-wrap gap-2">{categories.map((cat) => <button key={cat.id} type="button" onClick={() => { setActiveCategory(cat.id); setFiltersOpen(false); }} className={`rounded-full px-3 py-1.5 text-sm ${activeCategory === cat.id ? "bg-raz-teal text-white" : "bg-raz-surface text-gray-600"}`}>{cat.emoji} {t(`cat.${cat.id}`)}</button>)}</div><p className="mb-2 mt-4 text-xs font-bold text-gray-500">{lang === "en" ? "Order results by" : "מיון תוצאות לפי"}</p><div className="flex flex-wrap gap-2">{sortOptions.map((sort) => <button key={sort} type="button" onClick={() => { setActiveSort(sort); setFiltersOpen(false); }} className={`rounded-full px-3 py-1.5 text-sm ${activeSort === sort ? "bg-raz-teal text-white" : "bg-raz-surface text-gray-600"}`}>{t(`sort.${sort}`)}</button>)}</div></section>}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                activeCategory === cat.id ? "bg-raz-teal text-white" : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {cat.emoji} {t(`cat.${cat.id}`)}
            </button>
          ))}
        </div>

        {/* Sort + count */}
        <div className="flex items-center justify-between py-3 mt-1">
          <div className="flex gap-1">
            {sortOptions.map((s) => (
              <button key={s} onClick={() => setActiveSort(s)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  activeSort === s ? "bg-white text-raz-teal font-bold shadow-sm" : "text-gray-500 hover:bg-white"
                }`}
              >{t(`sort.${s}`)}</button>
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {loading ? "..." : `${results.length} ${t("search.campaigns")}`}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-52 animate-pulse" />)}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
            {[...results].sort((a, b) => activeSort === "newest" ? Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)) : activeSort === "funded" ? b.raised - a.raised : activeSort === "ending" ? a.daysLeft - b.daysLeft : 0).map((c) => <CampaignCard key={c.id} campaign={c} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-6xl mb-4">🔍</span>
            <p className="text-gray-600 font-medium text-lg"><EditableText tKey="search.empty" /></p>
            <p className="text-gray-400 mt-1"><EditableText tKey="search.emptySub" /></p>
          </div>
        )}
      </div>

      <BottomNav variant="donor" />
    </div>
  );
}
