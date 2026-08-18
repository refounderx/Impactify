"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/contexts/LanguageContext";

const roles = [
  { labelHe: "תורם", labelEn: "Donor", href: "/my-donations" },
  { labelHe: "עמותה", labelEn: "Org", href: "/nonprofit" },
  { labelHe: "מנהל קהילה", labelEn: "Community", href: "/community" },
];

export default function DemoBar() {
  const pathname = usePathname();
  const { lang, setLang } = useLang();
  const active = pathname.startsWith("/nonprofit")
    ? "/nonprofit"
    : pathname.startsWith("/community")
    ? "/community"
    : "/my-donations";

  return (
    <div className="bg-raz-dark text-white text-sm py-1.5 px-4 md:px-6 flex items-center gap-2 sticky top-0 z-50">
      <span className="text-raz-teal font-bold text-xs me-1 hidden md:inline">◦ דמו</span>
      <span className="text-gray-500 text-xs hidden sm:inline">{lang === "he" ? "תפקיד:" : "Role:"}</span>
      {roles.map((r) => (
        <Link
          key={r.href}
          href={r.href}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            active === r.href
              ? "bg-raz-teal text-white"
              : "text-gray-300 hover:text-white border border-gray-600"
          }`}
        >
          {lang === "en" ? r.labelEn : r.labelHe}
        </Link>
      ))}

      {/* Language toggle — always visible, on the opposite end */}
      <div className="flex items-center bg-gray-800 rounded-full p-0.5 text-xs font-bold ms-auto">
        <button
          onClick={() => setLang("he")}
          className={`px-2 py-0.5 rounded-full transition-colors ${lang === "he" ? "bg-raz-teal text-white" : "text-gray-400 hover:text-white"}`}
        >
          עב
        </button>
        <button
          onClick={() => setLang("en")}
          className={`px-2 py-0.5 rounded-full transition-colors ${lang === "en" ? "bg-raz-teal text-white" : "text-gray-400 hover:text-white"}`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
