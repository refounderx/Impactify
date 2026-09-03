"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export type LegalDocument = {
  title: string;
  updated: string;
  intro: string;
  sections: { title: string; body: string }[];
};

export default function LegalPage({ he, en }: { he: LegalDocument; en: LegalDocument }) {
  const { lang } = useLang();
  const document = lang === "en" ? en : he;
  const isEnglish = lang === "en";
  const BackIcon = isEnglish ? ArrowLeft : ArrowRight;

  return (
    <main className="min-h-screen bg-raz-surface px-6 py-12" dir={isEnglish ? "ltr" : "rtl"}>
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-7 shadow-sm md:p-10">
        <Link href="/landing" className="inline-flex items-center gap-1 text-sm font-bold text-raz-teal hover:underline"><BackIcon size={16} />{isEnglish ? "Back to home" : "חזרה לדף הבית"}</Link>
        <h1 className="mt-6 text-3xl text-raz-dark md:text-4xl">{document.title}</h1>
        <p className="mt-2 text-sm text-gray-500">{isEnglish ? "Last updated:" : "עודכן לאחרונה:"} {document.updated}</p>
        <div className="legal-content mt-8 space-y-7 text-[15px] leading-7 text-gray-700">
          <p>{document.intro}</p>
          {document.sections.map((section) => <section key={section.title}><h2 className="mb-2 text-xl font-extrabold text-raz-dark">{section.title}</h2><p>{section.body}</p></section>)}
        </div>
      </article>
    </main>
  );
}
