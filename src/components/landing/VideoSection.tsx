"use client";
import { Play } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export default function VideoSection() {
  const { t } = useLang();

  return (
    <section className="bg-raz-surface py-16">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{t("landing.video.heading1")}</h2>
        <p className="text-2xl font-bold text-gray-900 mb-8">{t("landing.video.heading2")}</p>

        <div className="bg-white border border-gray-200 rounded-2xl h-72 flex items-center justify-center relative">
          <button className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-red-500" aria-label="play">
            <Play size={28} fill="currentColor" />
          </button>
          <div className="absolute bottom-6 inset-x-6 h-1 bg-gray-200 rounded-full">
            <div className="h-full w-1/4 bg-raz-teal rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
