"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import CampaignCard from "@/components/campaign/CampaignCard";
import CategoryFilter from "@/components/campaign/CategoryFilter";
import ProgressBar from "@/components/ui/ProgressBar";
import { getCampaigns } from "@/lib/supabase/queries";
import { campaigns as mockCampaigns, formatNIS, DONOR_NAME, DONOR_NAME_EN } from "@/lib/mock-data";
import { Bell, Search } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export default function DonorHome() {
  const { lang, t } = useLang();
  const [campaigns, setCampaigns] = useState(mockCampaigns as typeof mockCampaigns);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCampaigns().then((data) => {
      if (data && data.length > 0) setCampaigns(data as typeof mockCampaigns);
      setLoading(false);
    });
  }, []);

  const featured = campaigns.find((c) => c.donors >= 500) ?? campaigns[2] ?? campaigns[0];
  if (!featured) return null;

  const featuredOrg = { name: featured._org?.name ?? "", nameEn: featured._org?.name_en ?? "", color: featured._org?.color ?? "#00B5AD", initials: featured._org?.initials ?? "??" };
  const donorName = lang === "en" ? DONOR_NAME_EN : DONOR_NAME;
  const featuredTitle = lang === "en" ? (featured.titleEn ?? featured.title) : featured.title;
  const orgName = lang === "en" ? (featuredOrg.nameEn ?? featuredOrg.name) : featuredOrg.name;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Teal Header */}
      <div className="bg-raz-teal px-6 pt-5 pb-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between mb-2">
          <div>
            <p className="text-teal-100 text-sm">{t("greeting")}</p>
            <h2 className="text-white text-2xl font-bold">{donorName} 👋</h2>
            <p className="text-teal-100 text-sm mt-1">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/search" className="text-white"><Search size={24} /></Link>
            <button className="relative text-white">
              <Bell size={24} />
              <span className="absolute -top-0.5 -start-0.5 w-2.5 h-2.5 bg-red-400 rounded-full border-2 border-raz-teal" />
            </button>
            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
              {donorName.slice(0, 2)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-6 -mt-6">
        {/* Featured */}
        <Link href={`/campaign/${featured.id}`} className="bg-white rounded-2xl overflow-hidden shadow-md block mb-6">
          <div className={`bg-gradient-to-br ${featured.gradient} h-56 flex items-center justify-center relative`}>
            <span className="text-8xl">{featured.emoji}</span>
            {featured.daysLeft > 0 && featured.daysLeft <= 7 && (
              <span className="absolute top-4 start-4 bg-red-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                {t("endingIn")} {featured.daysLeft} {t("days")}
              </span>
            )}
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: featuredOrg.color }}>
                {featuredOrg.initials}
              </div>
              <span className="text-sm text-gray-500">{orgName}</span>
            </div>
            <h3 className="font-bold text-xl text-gray-800 mb-3">{featuredTitle}</h3>
            <ProgressBar raised={featured.raised} goal={featured.goal} showLabels />
            <div className="flex justify-between mt-4 items-center">
              <span className="text-gray-500">{featured.donors} {t("donors")}</span>
              <span className="bg-raz-teal text-white px-6 py-2 rounded-full font-bold">{t("donate")}</span>
            </div>
          </div>
        </Link>

        {/* Categories */}
        <div className="mb-4"><CategoryFilter /></div>

        {/* Grid */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-700">{t("activeCampaigns")}</h3>
          <Link href="/search" className="text-raz-teal font-medium">{t("all")}</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-52 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {campaigns.filter((c) => c.id !== featured.id).map((c) => (
              <CampaignCard key={c.id} campaign={c as typeof mockCampaigns[0]} />
            ))}
          </div>
        )}

        {/* Impact */}
        <div className="bg-raz-dark rounded-2xl p-6 text-white text-center mb-6">
          <p className="text-gray-400 mb-1">{t("impactTitle")}</p>
          <p className="text-4xl font-bold text-raz-teal font-numeric">₪2,847,650</p>
          <p className="text-gray-400 mt-1">{t("impactSub")}</p>
        </div>
      </div>

      <BottomNav variant="donor" />
    </div>
  );
}
