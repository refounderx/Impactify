"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getCampaignById } from "@/lib/supabase/queries";
import { getCampaign, formatNIS } from "@/lib/mock-data";
import { RotateCcw, Heart, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

const PRESETS = [50, 100, 200, 500];

export default function AmountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { lang, t } = useLang();
  const [campaignData, setCampaignData] = useState<Awaited<ReturnType<typeof getCampaignById>>>(
    getCampaign(id) as never ?? getCampaign("1") as never
  );

  useEffect(() => {
    getCampaignById(id).then((c) => { if (c) setCampaignData(c); });
  }, [id]);

  const campaign = campaignData ?? getCampaign("1")!;
  const org = campaign._org ?? null;
  const campaignTitle = lang === "en" ? (campaign.titleEn ?? campaign.title) : campaign.title;
  const orgName = lang === "en" ? ((org as {name_en?: string; nameEn?: string; name?: string})?.name_en ?? (org as {nameEn?: string})?.nameEn ?? org?.name) : org?.name;
  const [selected, setSelected] = useState<number | null>(100);
  const [custom, setCustom] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [dedication, setDedication] = useState(false);
  const [dedicationName, setDedicationName] = useState("");
  const amount = custom ? parseInt(custom) : selected;

  return (
    <div className="flex flex-col min-h-screen bg-raz-surface">
      

      {/* Header */}
      <div className="bg-raz-teal px-6 pt-6 pb-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/70 hover:text-white">
            <ArrowRight size={24} />
          </button>
          <h1 className="text-white font-bold text-xl">{t("amount.title")}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-6 -mt-4">
        {/* Campaign summary */}
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4 mb-5 shadow-sm">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${campaign.gradient} flex items-center justify-center flex-shrink-0`}>
            <span className="text-3xl">{campaign.emoji}</span>
          </div>
          <div>
            <p className="font-bold text-gray-800">{campaignTitle}</p>
            <p className="text-sm text-gray-500">{orgName}</p>
          </div>
        </div>

        {/* Preset amounts */}
        <p className="text-sm text-gray-500 mb-3 text-center">{t("amount.prompt")}</p>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => { setSelected(p); setCustom(""); }}
              className={`py-5 rounded-2xl text-xl font-bold font-numeric transition-all ${
                selected === p && !custom
                  ? "bg-raz-teal text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 border-2 border-gray-100 hover:border-raz-teal"
              }`}
            >
              {formatNIS(p)}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 flex items-center px-5 py-4 mb-5">
          <span className="text-gray-400 text-sm me-2">{t("amount.custom")}</span>
          <span className="text-gray-700 font-bold text-lg">₪</span>
          <input
            type="number"
            placeholder="הכנס סכום"
            value={custom}
            onChange={(e) => { setCustom(e.target.value); setSelected(null); }}
            className="flex-1 outline-none text-end font-bold text-xl font-numeric text-gray-800 bg-transparent"
          />
        </div>

        {/* Recurring (הוראת קבע) — prominent card */}
        <button
          onClick={() => setRecurring(!recurring)}
          className={`w-full rounded-2xl p-4 mb-3 border-2 transition-all text-right ${
            recurring
              ? "bg-raz-teal/10 border-raz-teal"
              : "bg-white border-gray-100 hover:border-raz-teal/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${recurring ? "bg-raz-teal" : "bg-gray-100"}`}>
                <RotateCcw size={20} className={recurring ? "text-white" : "text-gray-500"} />
              </div>
              <div>
                <p className={`font-bold ${recurring ? "text-raz-teal" : "text-gray-800"}`}>{t("recurring.title")}</p>
                <p className="text-xs text-gray-500">
                  {recurring && amount && (amount as number) > 0
                    ? `${formatNIS(amount as number)} ${t("recurring.active")}`
                    : t("recurring.sub")}
                </p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              recurring ? "bg-raz-teal border-raz-teal" : "border-gray-300"
            }`}>
              {recurring && <span className="text-white text-xs">✓</span>}
            </div>
          </div>
        </button>

        {/* Dedication option */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart size={20} className="text-pink-400" />
                <div>
                  <p className="font-medium text-gray-800">{t("dedication.title")}</p>
                  <p className="text-xs text-gray-500">{t("dedication.sub")}</p>
                </div>
              </div>
              <button
                onClick={() => setDedication(!dedication)}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${dedication ? "bg-raz-teal" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${dedication ? "start-6" : "start-0.5"}`} />
              </button>
            </div>
            {dedication && (
              <input
                type="text"
                placeholder="שם המוקדש / לזכר..."
                value={dedicationName}
                onChange={(e) => setDedicationName(e.target.value)}
                className="mt-3 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-raz-teal text-right"
              />
            )}
          </div>
        </div>

        <button
          onClick={() => amount && amount > 0 && router.push(`/donate/${campaign.id}/payment?amount=${amount}`)}
          disabled={!amount || amount <= 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all mb-6 ${
            amount && amount > 0 ? "bg-raz-teal text-white hover:bg-raz-teal-dark" : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {amount && amount > 0 ? `${t("amount.ctaWith")} ${formatNIS(amount)}` : t("amount.ctaEmpty")}
        </button>
      </div>
    </div>
  );
}
