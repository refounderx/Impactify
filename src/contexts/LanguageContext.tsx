"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, type Lang } from "@/lib/translations";
import { getSiteContentOverrides, type ContentOverrides } from "@/lib/supabase/queries-content";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
  overrides: ContentOverrides;
  refreshOverrides: () => void;
}

const LanguageContext = createContext<LangCtx>({
  lang: "he",
  setLang: () => {},
  t: (k) => k,
  dir: "rtl",
  overrides: {},
  refreshOverrides: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("he");
  const [overrides, setOverrides] = useState<ContentOverrides>({});

  useEffect(() => {
    const saved = localStorage.getItem("it-lang") as Lang | null;
    if (saved === "en" || saved === "he") apply(saved);
    refreshOverrides();
  }, []);

  function refreshOverrides() {
    getSiteContentOverrides().then(setOverrides);
  }

  function apply(l: Lang) {
    setLangState(l);
    localStorage.setItem("it-lang", l);
    document.documentElement.dir = l === "he" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }

  const t = useCallback(
    (key: string) => {
      const override = overrides[key]?.[lang];
      if (override) return override;
      return translations[lang][key] ?? translations["he"][key] ?? key;
    },
    [lang, overrides]
  );

  return (
    <LanguageContext.Provider
      value={{ lang, setLang: apply, t, dir: lang === "he" ? "rtl" : "ltr", overrides, refreshOverrides }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
