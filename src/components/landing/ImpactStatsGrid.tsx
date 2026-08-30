"use client";
import { useEffect, useState } from "react";
import EditableText from "@/components/admin/EditableText";
import { useLang } from "@/contexts/LanguageContext";
import { getPublicImpactStats, type PublicImpactStats } from "@/lib/supabase/queries-impact";

const tileColor: Record<string, string> = {
  teal: "bg-raz-teal text-white",
  "teal-sm": "bg-raz-teal text-white",
  pink: "bg-[#F82A79] text-white",
  yellow: "bg-[#FDE84F] text-gray-900",
  dark: "bg-raz-dark text-white",
};

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
      <span className="w-2 h-2 rounded-full bg-red-400" /> LIVE
    </span>
  );
}

export default function ImpactStatsGrid() {
  const { lang } = useLang();
  const [stats, setStats] = useState<PublicImpactStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getPublicImpactStats()
      .then((result) => {
        if (active) setStats(result);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => { active = false; };
  }, []);

  const number = (value: number) => new Intl.NumberFormat(lang === "en" ? "en-US" : "he-IL").format(value);
  const labels = lang === "en"
    ? {
        donations: "Donations completed through Impactify",
        donors: "Identified donors who gave through Impactify",
        campaigns: "Active campaigns",
        organizations: "Partner organizations",
        communities: "Communities on Impactify",
        recurring: "Active recurring donations",
        organizationsCaption: "Organizations on the platform",
        total: "Total donations completed through Impactify",
        unavailable: "Impact data is temporarily unavailable.",
      }
    : {
        donations: "תרומות שהושלמו דרך Impactify",
        donors: "תורמים מזוהים שתרמו באמצעות Impactify",
        campaigns: "קמפיינים פעילים",
        organizations: "עמותות שותפות בפלטפורמה",
        communities: "קהילות ב־Impactify",
        recurring: "תרומות קבועות פעילות",
        organizationsCaption: "עמותות בפלטפורמה",
        total: "סך התרומות שהושלמו דרך Impactify",
        unavailable: "נתוני ההשפעה אינם זמינים כרגע.",
      };
  const tiles = stats ? [
    { id: "donations", value: number(stats.completedDonations), caption: labels.donations, color: "teal" },
    { id: "donors", value: number(stats.knownDonors), caption: labels.donors, color: "teal", live: true },
    { id: "campaigns", value: number(stats.activeCampaigns), caption: labels.campaigns, color: "pink" },
    { id: "organizations", value: number(stats.partnerOrganizations), caption: labels.organizations, color: "yellow" },
    { id: "communities", value: number(stats.communities), caption: labels.communities, color: "dark" },
    { id: "recurring", value: number(stats.activeRecurringDonations), caption: labels.recurring, color: "teal-sm" },
  ] : [];

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <EditableText tKey="landing.impact.heading1" as="h2" className="text-2xl font-bold text-gray-900 text-center mb-1 block" />
      <EditableText tKey="landing.impact.heading2" as="p" className="text-gray-500 text-center mb-10 block" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map((tile) => (
          <div key={tile.id} className={`rounded-2xl p-5 flex flex-col justify-between min-h-[140px] ${tileColor[tile.color]}`}>
            {tile.live && <LiveDot />}
            <p className="text-3xl font-bold font-numeric mt-2">{tile.value}</p>
            <p className="text-xs opacity-80 mt-1">{tile.caption}</p>
          </div>
        ))}

        <div className="rounded-2xl p-5 bg-white border border-gray-100 col-span-2">
          <p className="text-xs text-gray-500 mb-3">{labels.organizationsCaption}</p>
          <div className="grid grid-cols-3 gap-2">
            {stats?.organizationNames.map((name) => (
              <span key={name} className="text-[10px] font-bold text-raz-teal border border-raz-teal rounded px-2 py-1 text-center truncate" title={name}>
                {name}
              </span>
            ))}
            {stats && stats.organizationNames.length === 0 && <span className="col-span-3 text-xs text-gray-400">—</span>}
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-gray-100 col-span-2 flex items-center justify-between">
          <div>
            <LiveDot />
            <p className="text-3xl font-bold font-numeric mt-2">{stats ? `₪${number(stats.completedAmount)}` : "—"}</p>
            <p className="text-xs text-gray-500 mt-1">{labels.total}</p>
          </div>
          <span className="w-20 h-20 rounded-full bg-raz-teal/20 flex items-center justify-center text-3xl">💚</span>
        </div>
      </div>
      {error && <p className="mt-4 text-center text-sm text-gray-500">{labels.unavailable}</p>}
    </section>
  );
}
