"use client";
import { useEffect, useState } from "react";
import { ChevronDown, Circle, CheckCircle2 } from "lucide-react";
import { getSystemUpdates } from "@/lib/supabase/queries-profile";
import type { SharedSiteData } from "@/lib/site-dataset-types";

type Tab = "donations" | "system";

interface Props {
  lang: string;
  t: (k: string) => string;
  updates: SharedSiteData["donorUpdates"];
}

export default function UpdatesPanel({ lang, t, updates }: Props) {
  const [tab, setTab] = useState<Tab>("donations");
  const [systemUpdates, setSystemUpdates] = useState<Awaited<ReturnType<typeof getSystemUpdates>>>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    getSystemUpdates().then(setSystemUpdates);
  }, []);

  return (
    <div className="mb-24">
      <h1 className="text-3xl font-bold text-gray-800 mb-5">{t("myUpd.title")}</h1>

      <div className="bg-white rounded-2xl p-5">
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("donations")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === "donations" ? "bg-raz-teal/10 text-raz-teal" : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            {t("myUpd.tabDonations")}
          </button>
          <button
            onClick={() => setTab("system")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === "system" ? "bg-raz-teal/10 text-raz-teal" : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            {t("myUpd.tabSystem")}
          </button>
        </div>

        {tab === "donations" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {updates.length === 0 && <p className="text-gray-400 text-sm col-span-full">{t("myUpd.empty")}</p>}
            {updates.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className={`bg-gradient-to-br ${u.gradient} h-32 flex items-center justify-center relative`}>
                  {u.hasVideo && (
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-t-transparent border-b-transparent border-l-white ms-1" />
                    </div>
                  )}
                  <span className="absolute top-2 end-2 bg-raz-teal text-white text-xs px-2 py-0.5 rounded-full font-medium">{u.date}</span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-gray-800 truncate">{lang === "en" ? u.productNameEn : u.productName}</p>
                  <p className="text-xs text-gray-400 leading-snug mt-0.5 line-clamp-2">{lang === "en" ? u.descriptionEn : u.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "system" && (
          <div className="flex flex-col divide-y divide-gray-50">
            {systemUpdates.length === 0 && <p className="text-gray-400 text-sm py-4">{t("myUpd.empty")}</p>}
            {systemUpdates.map((u) => {
              const detail = lang === "en" ? u.detailEn : u.detail;
              const hasDetail = Boolean(detail);
              const open = openId === u.id;
              return (
                <div key={u.id} className="py-3">
                  <button
                    onClick={() => hasDetail && setOpenId(open ? null : u.id)}
                    className="w-full flex items-center gap-3 text-start"
                  >
                    {hasDetail ? (
                      <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                    ) : (
                      <span className="w-4 flex-shrink-0" />
                    )}
                    <span className="flex-1 font-medium text-gray-800 text-sm">
                      {lang === "en" ? u.titleEn : u.title}
                    </span>
                    <span className="text-gray-400 text-xs whitespace-nowrap">{u.date}</span>
                    {u.status === "pending" ? (
                      <Circle size={14} className="text-raz-teal fill-raz-teal flex-shrink-0" />
                    ) : (
                      <CheckCircle2 size={14} className="text-gray-300 flex-shrink-0" />
                    )}
                  </button>
                  {open && hasDetail && (
                    <p className="text-sm text-gray-500 ps-7 pt-2">{detail}</p>
                  )}
                  {(u.actionLabel || u.actionLabelEn) && (
                    <div className="ps-7 pt-2">
                      <button className="text-raz-teal text-xs font-bold hover:underline">
                        {lang === "en" ? u.actionLabelEn : u.actionLabel}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
