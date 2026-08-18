"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, type Lang } from "@/lib/translations";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LangCtx>({
  lang: "he",
  setLang: () => {},
  t: (k) => k,
  dir: "rtl",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("he");

  useEffect(() => {
    const saved = localStorage.getItem("it-lang") as Lang | null;
    if (saved === "en" || saved === "he") apply(saved);
  }, []);

  function apply(l: Lang) {
    setLangState(l);
    localStorage.setItem("it-lang", l);
    document.documentElement.dir = l === "he" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }

  const t = useCallback(
    (key: string) => translations[lang][key] ?? translations["he"][key] ?? key,
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{ lang, setLang: apply, t, dir: lang === "he" ? "rtl" : "ltr" }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
