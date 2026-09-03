"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Flag, Package, LineChart, Bell, Users, ChevronUp, ChevronDown, LogOut, User, Megaphone } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import EditableText from "@/components/admin/EditableText";

const NONPROFIT_ROUTES = {
  campaignsGrid: "/nonprofit/campaigns",
  campaignsDashboard: "/nonprofit",
  donations: "/nonprofit/donations",
  updates: "/nonprofit/updates",
  lastNavKey: "adm.navCommunities" as const,
  lastNavHref: "/nonprofit/communities",
};

const COMMUNITY_ROUTES = {
  campaignsGrid: "/community/campaigns",
  campaignsDashboard: "/community",
  donations: "/community/donations",
  updates: "/community/updates",
  lastNavKey: "cm.navNonprofits" as const,
  lastNavHref: "/community/nonprofits",
};

const PRODUCTS_DASHBOARD = "/nonprofit/products";
const PRODUCTS_MANAGEMENT = "/nonprofit/products/dashboard";

export default function AdminShell({ children, variant = "nonprofit" }: { children: React.ReactNode; variant?: "nonprofit" | "community" }) {
  const pathname = usePathname();
  const { lang } = useLang();
  const { signOut, profile } = useAuth();

  const routes = variant === "community" ? COMMUNITY_ROUTES : NONPROFIT_ROUTES;
  const CAMPAIGNS_GRID = routes.campaignsGrid;
  const CAMPAIGNS_DASHBOARD = routes.campaignsDashboard;
  const DONATIONS = routes.donations;
  const UPDATES = routes.updates;
  const LAST_NAV = routes.lastNavHref;

  const campaignsGroupActive = pathname === CAMPAIGNS_GRID || pathname === CAMPAIGNS_DASHBOARD;
  const productsGroupActive = variant === "nonprofit" && pathname.startsWith(PRODUCTS_DASHBOARD);
  const profileHref = variant === "nonprofit" ? "/nonprofit/profile" : "/community/profile";

  const greeting = lang === "en" ? (profile?.full_name_en ?? profile?.full_name) : profile?.full_name;

  return (
    <div className="flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] min-h-0 overflow-hidden">
      <aside className="relative hidden md:flex h-full max-h-full min-h-0 flex-col w-56 overflow-hidden bg-raz-teal flex-shrink-0 sticky top-0">
        <div className="flex items-center justify-center py-6 border-b border-teal-400/30">
          <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center">
            <Heart size={22} className="text-white" fill="white" />
          </div>
        </div>

        <nav className="flex-1 min-h-0 flex flex-col gap-1 overflow-hidden p-3 pb-24 pt-4 text-sm">
          {/* Campaigns group */}
          <div>
            <Link
              href={CAMPAIGNS_DASHBOARD}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                pathname === CAMPAIGNS_DASHBOARD ? "bg-white/20 text-white" : campaignsGroupActive ? "bg-white/10 text-white" : "text-teal-100 hover:bg-white/10"
              }`}
            >
              <span className="flex items-center gap-2.5"><Flag size={17} className="flex-shrink-0" /><EditableText tKey="adm.navCampaigns" /></span>
              {campaignsGroupActive ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </Link>
            {campaignsGroupActive && (
              <Link
                href={CAMPAIGNS_GRID}
                className={`block ms-8 mt-0.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                  pathname === CAMPAIGNS_GRID ? "bg-white/20 text-white font-bold" : "text-teal-100 hover:bg-white/10"
                }`}
              >
                <EditableText tKey="adm.navCampaignsDashboard" />
              </Link>
            )}
          </div>

          {/* Products group */}
          {variant === "nonprofit" && (
            <div>
              <Link
                href={PRODUCTS_MANAGEMENT}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  pathname === PRODUCTS_MANAGEMENT ? "bg-white/20 text-white" : productsGroupActive ? "bg-white/10 text-white" : "text-teal-100 hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2.5"><Package size={17} className="flex-shrink-0" /><EditableText tKey="adm.navProducts" /></span>
                {productsGroupActive ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </Link>
              {productsGroupActive && (
                <Link
                  href={PRODUCTS_DASHBOARD}
                  className={`block ms-8 mt-0.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                    pathname === PRODUCTS_DASHBOARD ? "bg-white/20 text-white font-bold" : "text-teal-100 hover:bg-white/10"
                  }`}
                >
                  <EditableText tKey="adm.navProductsDashboard" />
                </Link>
              )}
            </div>
          )}

          <Link
            href={DONATIONS}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors ${
              pathname === DONATIONS ? "bg-white/20 text-white" : "text-teal-100 hover:bg-white/10"
            }`}
          >
            <LineChart size={17} className="flex-shrink-0" /><EditableText tKey="adm.navDonations" />
          </Link>
          <Link
            href={UPDATES}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors ${
              pathname === UPDATES ? "bg-white/20 text-white" : "text-teal-100 hover:bg-white/10"
            }`}
          >
            <Bell size={17} className="flex-shrink-0" />{pathname === UPDATES ? <EditableText tKey="adm.updatesTitle" /> : <EditableText tKey="adm.navUpdates" />}
          </Link>
          <Link
            href={LAST_NAV}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors ${
              pathname === LAST_NAV ? "bg-white/20 text-white" : "text-teal-100 hover:bg-white/10"
            }`}
          >
            <Users size={17} className="flex-shrink-0" /><EditableText tKey={routes.lastNavKey} />
          </Link>
          <Link
            href={profileHref}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-colors ${
              pathname === profileHref ? "bg-white/20 text-white" : "text-teal-100 hover:bg-white/10"
            }`}
          >
            <User size={17} className="flex-shrink-0" />{lang === "en" ? "My profile" : "הפרופיל שלי"}
          </Link>
        </nav>

        <div className="absolute inset-x-0 bottom-0 z-10 shrink-0 border-t border-teal-400/30 bg-raz-teal p-3">
          <Link
            href={variant === "community" ? "/community/campaigns/search" : "/nonprofit/create-campaign"}
            className="w-full bg-white text-raz-teal text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
          >
            <Megaphone size={15} />
            <EditableText tKey={variant === "community" ? "cm.newOrJoinCampaign" : "adm.newCampaign"} />
          </Link>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col bg-raz-surface">
        <div className="border-b border-gray-100 bg-white px-5 py-3 md:hidden">
          <Link href={routes.campaignsDashboard} className="flex w-fit items-center gap-2" aria-label="Impactify">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-raz-teal text-white"><Heart size={18} fill="currentColor" /></span>
            <span className="text-xl font-extrabold tracking-tight text-raz-teal">Impactify</span>
          </Link>
        </div>
        <div className="hidden items-center justify-between border-b border-gray-100 bg-white px-6 py-3 md:flex">
          <div className="flex items-center gap-2">
            <button onClick={signOut} className="bg-raz-dark text-white text-xs font-medium px-4 py-2 rounded-full flex items-center gap-1.5 hover:bg-gray-800 transition-colors">
              <LogOut size={13} />
              <EditableText tKey="adm.logout" />
            </button>
            <Link href={profileHref} aria-label={lang === "en" ? "Open profile" : "פתיחת הפרופיל"} className="micro-hint micro-hint-below w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
              <User size={16} />
            </Link>
          </div>
          <div className="text-end">
            <p className="text-sm">
              <span className="text-gray-500"><EditableText tKey="adm.greetingMorning" /> </span>
              <span className="font-bold text-raz-teal">{greeting}</span>
            </p>
            <p className="text-gray-400 text-xs">{profile?.email ?? ""}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-4 py-5 pb-24 sm:px-6 sm:py-6 md:px-6 md:pb-6">{children}</div>
        </div>
        <BottomNav variant={variant} onSignOut={signOut} />
      </div>
    </div>
  );
}
