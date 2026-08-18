"use client";
import { useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { donationEmotions, formatNIS } from "@/lib/mock-data";

interface Props {
  onClose: () => void;
  lang: string;
  t: (key: string) => string;
}

const MASCOT_STYLES = [
  { bg: "bg-yellow-400", emoji: "😄" },
  { bg: "bg-teal-400",  emoji: "😊" },
  { bg: "bg-teal-500",  emoji: "🙂" },
  { bg: "bg-teal-400",  emoji: "😊" },
  { bg: "bg-teal-600",  emoji: "😎" },
  { bg: "bg-teal-400",  emoji: "😄" },
];

const POPUP_PRODUCTS = [
  { id: "pp1", gradient: "from-amber-50 to-orange-100",  emoji: "☕🍫", hasVideo: false },
  { id: "pp2", gradient: "from-gray-100 to-gray-200",    emoji: "🥗🍱", hasVideo: false },
  { id: "pp3", gradient: "from-gray-200 to-gray-300",    emoji: "🍱",   hasVideo: true  },
  { id: "pp4", gradient: "from-amber-50 to-orange-100",  emoji: "🥗🍱", hasVideo: false },
];

export default function NewDonationPopup({ onClose, lang, t }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(1);
  const productsRef = useRef<HTMLDivElement>(null);
  const emotions = donationEmotions;

  function prev() { setSelectedIdx((i) => (i - 1 + emotions.length) % emotions.length); }
  function next() { setSelectedIdx((i) => (i + 1) % emotions.length); }
  function scrollProducts(dir: "prev" | "next") {
    productsRef.current?.scrollBy({ left: dir === "next" ? -230 : 230, behavior: "smooth" });
  }

  return (
    /* Dimmed backdrop — click outside to close */
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center p-0 md:p-6" onClick={onClose}>

      <div className="absolute inset-0 bg-black/65" />

      {/* Dialog — bottom-sheet on mobile, centred modal on desktop */}
      <div
        className="relative w-full md:max-w-2xl md:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Dark top: mascot carousel ── */}
        <div className="bg-gray-900 flex flex-col items-center pt-10 pb-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 end-3 text-white/50 hover:text-white"
          >
            <X size={20} />
          </button>

          <div className="flex items-end gap-3 px-4 w-full justify-center">
            <button onClick={prev} className="text-white/60 hover:text-white mb-5 flex-shrink-0">
              <ChevronRight size={24} />
            </button>

            {emotions.map((em, idx) => {
              const isSel = idx === selectedIdx;
              const style = MASCOT_STYLES[idx % MASCOT_STYLES.length];
              return (
                <button
                  key={em.id}
                  onClick={() => setSelectedIdx(idx)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0"
                >
                  {isSel ? (
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <span className="text-3xl">{style.emoji}</span>
                    </div>
                  ) : (
                    <div className={`w-11 h-11 ${style.bg} rounded-full flex items-center justify-center shadow border border-white/20`}>
                      <span className="text-xl">{style.emoji}</span>
                    </div>
                  )}
                  <span className={`text-xs font-medium leading-none ${isSel ? "text-white font-bold" : "text-white/60"}`}>
                    {lang === "en" ? em.labelEn : em.label}
                  </span>
                </button>
              );
            })}

            <button onClick={next} className="text-white/60 hover:text-white mb-5 flex-shrink-0">
              <ChevronLeft size={24} />
            </button>
          </div>
        </div>

        {/* ── White bottom: heading + product cards ── */}
        <div className="bg-white flex flex-col overflow-hidden">
          <h2 className="text-xl font-black text-center pt-5 pb-3 px-4 text-gray-800 flex-shrink-0">
            {t("myDon.whatMotivates")}
          </h2>

          {/* Product carousel */}
          <div className="relative pb-6">
            <button
              onClick={() => scrollProducts("prev")}
              className="absolute start-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-gray-400 hover:text-raz-teal"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => scrollProducts("next")}
              className="absolute end-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-gray-400 hover:text-raz-teal"
            >
              <ChevronLeft size={16} />
            </button>

            {/* dir="ltr" so cards scroll left→right in all locales */}
            <div
              ref={productsRef}
              dir="ltr"
              className="flex gap-3 overflow-x-auto scrollbar-hide px-8"
            >
              {POPUP_PRODUCTS.map((p) => (
                <div key={p.id} className="flex-shrink-0 w-44 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <div className={`bg-gradient-to-br ${p.gradient} h-24 flex items-center justify-center relative`}>
                    <span className="text-3xl">{p.emoji}</span>
                    {p.hasVideo && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[7px] border-transparent border-l-gray-700 ms-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5" dir="rtl">
                    <p className="text-xs font-bold text-gray-800 leading-snug mb-1">
                      {lang === "en" ? "Monthly food basket / elderly" : "סל מזון חודשי לניצול שואה / קשיש"}
                    </p>
                    <p className="text-xl font-black text-raz-teal font-numeric mb-2">{formatNIS(126)}</p>
                    <button className="w-full bg-raz-teal text-white text-xs font-bold py-1.5 rounded-lg mb-1">
                      {lang === "en" ? "I choose to donate" : "אני בוחר לתרום"}
                    </button>
                    <div className="flex items-center justify-center gap-1">
                      <Heart size={10} className="text-red-400 fill-red-400" />
                      <span className="text-xs text-gray-400">257 {lang === "en" ? "donated" : "כבר בחרו לתרום"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
