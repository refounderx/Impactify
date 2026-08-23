"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";
import DonationCard from "./DonationCard";
import ManagePanel from "./ManagePanel";
import TaxRefundView from "./TaxRefundView";
import UpdatesPanel from "./UpdatesPanel";
import ProfilePanel from "./ProfilePanel";
import { Popups, type PopupName } from "./Popups";
import NewDonationPopup from "./NewDonationPopup";
import Sidebar from "./Sidebar";
import type { ProductDonation } from "@/lib/mock-data";
import type { SharedSiteData } from "@/lib/site-dataset-types";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import { getMyProductDonations, getDonorUpdates, getQuarterlyStats } from "@/lib/supabase/queries-my-donations";
import { Plus, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export default function MyDonationsPage() {
  const { lang, t } = useLang();
  const { user, signOut } = useAuth();
  const { data } = useSiteDataset("shared");
  const [view, setView] = useState<"my-donations" | "manage" | "tax-refund" | "updates" | "profile">("my-donations");
  const [popup, setPopup] = useState<PopupName>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Supabase data — fall back to mock when user is not signed in or query returns empty
  const [remoteProductDonations, setRemoteProductDonations] = useState<ProductDonation[]>([]);
  const [remoteUpdates, setRemoteUpdates] = useState<SharedSiteData["donorUpdates"]>([]);
  const [remoteQuarterly, setRemoteQuarterly] = useState<SharedSiteData["quarterlyDonationData"]>({ total: 0, period: "", months: [] });

  useEffect(() => {
    if (user) {
      getDonorUpdates(user.id).then(setRemoteUpdates);
      getMyProductDonations(user.id).then(setRemoteProductDonations);
      getQuarterlyStats(user.id).then(setRemoteQuarterly);
    }
  }, [user]);

  const updates = user ? remoteUpdates : (data?.donorUpdates ?? []);
  const productDonations = user ? remoteProductDonations : (data?.myProductDonations ?? []);
  const quarterly = user ? remoteQuarterly : (data?.quarterlyDonationData ?? { total: 0, period: "", months: [] });

  const donorName = lang === "en" ? (data?.DONOR_NAME_EN ?? "") : (data?.DONOR_NAME ?? "");
  const displayName = user?.email ?? donorName;

  function openPopup(type: NonNullable<PopupName>, productId?: string) {
    setSelectedProductId(productId ?? null);
    setPopup(type);
  }

  function scrollCarousel(dir: "prev" | "next") {
    carouselRef.current?.scrollBy({ left: dir === "next" ? -260 : 260, behavior: "smooth" });
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar view={view} onNav={setView} />

      <div className="flex-1 bg-raz-surface min-h-screen">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div className="text-end">
            <p className="text-raz-teal text-sm font-bold">
              {lang === "en" ? `Hello, ${displayName.split("@")[0]}` : `שלום, ${donorName.split(" ")[0]} — צהריים טובים`}
            </p>
            <p className="text-gray-400 text-xs">
              {lang === "en" ? "Last login: 31/01/23 18:36" : "הכניסה האחרונה שלך הייתה ב: 31/01/23 18:36"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="border border-raz-teal text-raz-teal text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-raz-teal/5 transition-colors">
              {lang === "en" ? "Back to site" : "חזרה לאתר"}
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogOut size={13} />
              {lang === "en" ? "Sign out" : "התנתקות"}
            </button>
            <div className="w-8 h-8 rounded-full bg-raz-teal flex items-center justify-center text-white text-xs font-bold">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {view === "my-donations" && (
            <>
              {/* Updates carousel */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setView("updates")}
                    className="bg-raz-teal text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-teal-500 transition-colors"
                  >
                    {lang === "en" ? "View all updates" : "צפיה בכל העדכונים"}
                  </button>
                  <h2 className="font-bold text-gray-800 text-lg">
                    {lang === "en" ? "What happened with my donations" : "מה נעשה עם התרומות שלי"}
                  </h2>
                </div>
                <div className="relative">
                  <button onClick={() => scrollCarousel("prev")} className="absolute start-0 top-1/2 -translate-y-1/2 -ms-4 z-10 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-500 hover:text-raz-teal">
                    <ChevronRight size={18} />
                  </button>
                  <button onClick={() => scrollCarousel("next")} className="absolute end-0 top-1/2 -translate-y-1/2 -me-4 z-10 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-500 hover:text-raz-teal">
                    <ChevronLeft size={18} />
                  </button>
                  <div ref={carouselRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                    {updates.map((u) => (
                      <div key={u.id} className="flex-shrink-0 w-56 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        <div className={`bg-gradient-to-br ${u.gradient} h-32 flex items-center justify-center relative`}>
                          {u.hasVideo && (
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                              <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-t-transparent border-b-transparent border-l-white ms-1" />
                            </div>
                          )}
                          <span className="absolute top-2 end-2 bg-raz-teal text-white text-xs px-2 py-0.5 rounded-full font-medium">{u.date}</span>
                        </div>
                        <div className="p-3">
                          <button className="w-full bg-raz-teal text-white text-xs font-bold py-2 rounded-lg mb-2">
                            {lang === "en" ? "I want to donate again" : "אני רוצה לתרום עוד"}
                          </button>
                          <p className="text-xs font-bold text-gray-800 truncate">{lang === "en" ? u.productNameEn : u.productName}</p>
                          <p className="text-xs text-gray-400 leading-snug mt-0.5 line-clamp-2">{lang === "en" ? u.descriptionEn : u.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent donations grid */}
              <div>
                <h2 className="font-bold text-gray-800 text-lg mb-3">{lang === "en" ? "Recent Donations" : "תרומות אחרונות"}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {productDonations.map((pd) => (
                    <DonationCard
                      key={pd.id}
                      donation={pd}
                      lang={lang}
                      t={t}
                      onDonateAgain={() => openPopup("donate-more", pd.id)}
                      onShowReceipts={() => openPopup("receipts", pd.id)}
                      onShowCertificate={() => openPopup("certificate", pd.id)}
                    />
                  ))}
                  <button
                    onClick={() => openPopup("new-donation")}
                    className="border-2 border-dashed border-gray-200 rounded-2xl min-h-64 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-raz-teal hover:text-raz-teal transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full border-2 border-current flex items-center justify-center">
                      <Plus size={28} />
                    </div>
                    <span className="font-medium text-sm">{lang === "en" ? "Click to donate more" : "לחץ כדי לתרום עוד"}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {view === "manage" && (
            <ManagePanel
              lang={lang} t={t}
              onTaxRefund={() => setView("tax-refund")}
              productDonations={productDonations}
              quarterlyData={quarterly}
            />
          )}

          {view === "tax-refund" && <TaxRefundView lang={lang} />}

          {view === "updates" && <UpdatesPanel lang={lang} t={t} updates={updates} />}

          {view === "profile" && <ProfilePanel t={t} />}
        </div>

        <BottomNav variant="donor" />
      </div>

      <button
        onClick={() => openPopup("new-donation")}
        className="fixed bottom-20 end-4 md:hidden w-14 h-14 bg-raz-teal rounded-full shadow-lg flex items-center justify-center text-white z-30"
      >
        <Plus size={26} />
      </button>

      {popup === "new-donation" && (
        <NewDonationPopup onClose={() => setPopup(null)} lang={lang} t={t} />
      )}
      {popup && popup !== "new-donation" && (
        <Popups
          popup={popup}
          productId={selectedProductId}
          donations={productDonations}
          lang={lang} t={t}
          onClose={() => setPopup(null)}
          onActivateRecurring={(id) => { setSelectedProductId(id); setPopup("standing-order"); }}
        />
      )}
    </div>
  );
}
