"use client";

import { usePathname } from "next/navigation";
import { useLang } from "@/contexts/LanguageContext";

function loadingCopy(pathname: string, lang: "he" | "en") {
  const subject = pathname.includes("/communities") ? (lang === "en" ? "your communities" : "הקהילות שלך")
    : pathname.includes("/products") ? (lang === "en" ? "your products" : "המוצרים שלך")
    : pathname.includes("/donations") ? (lang === "en" ? "your donations" : "התרומות שלך")
    : pathname.includes("/nonprofits") ? (lang === "en" ? "nonprofits" : "העמותות")
    : pathname.includes("/campaigns") ? (lang === "en" ? "your campaigns" : "הקמפיינים שלך")
    : (lang === "en" ? "your dashboard" : "לוח הבקרה שלך");
  return lang === "en" ? `Loading ${subject}…` : `טוען את ${subject}…`;
}

export default function AdminDataStatus({ loading, error, reload }: {
  loading: boolean;
  error: string | null;
  reload: () => void;
}) {
  const pathname = usePathname();
  const { lang } = useLang();
  if (loading) return <div className="flex min-h-44 items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm">
    <div>
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-raz-teal/20 border-t-raz-teal" aria-hidden="true" />
      <p className="text-base font-bold text-raz-teal"><span className="font-extrabold">Impactify</span> · {loadingCopy(pathname, lang)}</p>
      <p className="mt-2 text-sm text-gray-500">{lang === "en" ? "We are securely retrieving the latest information." : "אנחנו מושכים עבורך את המידע העדכני ביותר בצורה מאובטחת."}</p>
    </div>
  </div>;
  if (!error) return null;
  return <div className="bg-white rounded-2xl p-8">
    <p className="font-bold text-red-700 mb-2">{lang === "en" ? "Couldn’t load your data" : "לא הצלחנו לטעון את הנתונים"}</p>
    <p className="text-sm text-gray-500 mb-4">{error}</p>
    <button type="button" onClick={reload} className="bg-raz-teal text-white px-4 py-2 rounded-xl text-sm">{lang === "en" ? "Retry" : "נסה שוב"}</button>
  </div>;
}
