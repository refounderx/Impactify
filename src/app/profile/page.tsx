"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { donations as mockDonations, recurringDonations as mockRecurring, formatNIS, DONOR_NAME, DONOR_NAME_EN } from "@/lib/mock-data";
import { getMyDonations, getMyRecurring } from "@/lib/supabase/queries-donations";
import { Download, ChevronLeft, Settings, Bell, HelpCircle, Shield, RotateCcw, LogIn } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const { lang, t } = useLang();
  const { user, loading: authLoading, signOut } = useAuth();
  const [donations, setDonations] = useState(mockDonations as typeof mockDonations);
  const [recurring, setRecurring] = useState(mockRecurring as typeof mockRecurring);

  useEffect(() => {
    if (!user) return;
    getMyDonations(user.id).then((d) => { if (d.length) setDonations(d as typeof mockDonations); });
    getMyRecurring(user.id).then((r) => { if (r.length) setRecurring(r as typeof mockRecurring); });
  }, [user]);

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalMonthly = recurring.filter((r) => r.status === "active").reduce((sum, r) => sum + r.amount, 0);
  const donorDisplayName = user
    ? (user.email ?? (lang === "en" ? DONOR_NAME_EN : DONOR_NAME))
    : (lang === "en" ? DONOR_NAME_EN : DONOR_NAME);

  const settings = [
    { icon: Bell, label: t("profile.notifications"), sub: t("profile.notificationsSub") },
    { icon: Settings, label: t("profile.account"), sub: t("profile.accountSub") },
    { icon: Shield, label: t("profile.privacy"), sub: t("profile.privacySub") },
    { icon: HelpCircle, label: t("profile.help"), sub: t("profile.helpSub") },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-raz-surface">
      {/* Header */}
      <div className="bg-raz-dark px-6 pt-6 pb-10">
        <div className="max-w-5xl mx-auto flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-raz-teal flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {donorDisplayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-white text-2xl font-bold">{donorDisplayName}</h1>
            {user
              ? <p className="text-gray-400 text-sm" dir="ltr">{user.email}</p>
              : <Link href="/auth" className="text-raz-teal text-sm flex items-center gap-1 mt-1">
                  <LogIn size={14} /> {lang === "en" ? "Sign in for full access" : "התחבר לגישה מלאה"}
                </Link>
            }
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-6 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Sign-in prompt if not logged in */}
            {!authLoading && !user && (
              <div className="bg-raz-teal/10 border border-raz-teal/20 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">
                    {lang === "en" ? "Sign in to see your real history" : "התחבר לראות היסטוריה אמיתית"}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {lang === "en" ? "Currently showing demo data" : "מוצג כעת נתוני דמו"}
                  </p>
                </div>
                <Link href="/auth" className="bg-raz-teal text-white px-4 py-2 rounded-xl text-sm font-medium">
                  {lang === "en" ? "Sign In" : "התחבר"}
                </Link>
              </div>
            )}

            {/* Donation history */}
            <div className="bg-white rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-700 text-lg">{t("profile.history")}</h2>
                <button className="text-raz-teal text-sm font-medium">{t("all")}</button>
              </div>
              <div className="flex flex-col gap-3">
                {donations.map((d) => (
                  <div key={d.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-10 h-10 bg-raz-teal/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-raz-teal font-bold">₪</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {lang === "en" ? ((d as {campaignTitleEn?: string}).campaignTitleEn ?? d.campaignTitle) : d.campaignTitle}
                      </p>
                      <p className="text-sm text-gray-400">{d.date} · {d.receiptId}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="font-bold text-gray-800 font-numeric">{formatNIS(d.amount)}</p>
                      <button className="text-raz-teal"><Download size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recurring card */}
            <Link href="/recurring" className="bg-raz-teal/10 border border-raz-teal/20 rounded-2xl p-4 flex items-center justify-between hover:bg-raz-teal/15 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-raz-teal rounded-xl flex items-center justify-center">
                  <RotateCcw size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">{t("profile.recurringLink")}</p>
                  <p className="text-sm text-gray-500">
                    {recurring.filter(r => r.status === "active").length} {t("rec.activeCount")} · {formatNIS(totalMonthly)}/{t("perMonth")}
                  </p>
                </div>
              </div>
              <ChevronLeft size={18} className="text-raz-teal" />
            </Link>

            {/* Settings */}
            <div className="bg-white rounded-2xl divide-y divide-gray-50">
              {settings.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-gray-500" />
                  </div>
                  <div className="flex-1"><p className="font-medium text-gray-700">{label}</p><p className="text-sm text-gray-400">{sub}</p></div>
                  <ChevronLeft size={16} className="text-gray-300" />
                </div>
              ))}
              {user && (
                <button onClick={signOut} className="flex items-center gap-4 px-5 py-4 hover:bg-red-50 w-full">
                  <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                    <LogIn size={18} className="text-red-400 rotate-180" />
                  </div>
                  <p className="font-medium text-red-500">{t("profile.logout")}</p>
                </button>
              )}
            </div>
          </div>

          {/* Right: impact */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-5 sticky top-24">
              <h3 className="font-bold text-gray-700 mb-4">{t("profile.impact")}</h3>
              <div className="flex flex-col gap-4">
                <div className="text-center p-4 bg-raz-teal/10 rounded-xl">
                  <p className="text-3xl font-bold text-raz-teal font-numeric">{formatNIS(totalDonated)}</p>
                  <p className="text-gray-600 text-sm mt-1">{t("profile.totalDonated")}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-800 font-numeric">{donations.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t("profile.donations")}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-800 font-numeric">
                      {[...new Set(donations.map((d) => (d as {campaignId?:string}).campaignId))].length || 3}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{t("profile.orgs")}</p>
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl">🏆</p>
                  <p className="font-bold text-gray-700 mt-1">{t("profile.loyal")}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t("profile.loyalSub")}</p>
                </div>
                <Link href="/recurring" className="flex items-center justify-between p-4 bg-raz-teal/10 rounded-xl border border-raz-teal/20">
                  <div className="flex items-center gap-2">
                    <RotateCcw size={16} className="text-raz-teal" />
                    <p className="font-medium text-gray-700 text-sm">{t("profile.recurringLink")}</p>
                  </div>
                  <p className="font-bold text-raz-teal font-numeric text-sm">{formatNIS(totalMonthly)}/{t("perMonth")}</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav variant="donor" />
    </div>
  );
}
