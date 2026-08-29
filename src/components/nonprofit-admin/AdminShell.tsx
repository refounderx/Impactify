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
    <div className="flex h-screen max-h-screen overflow-hidden">
      <aside className="hidden md:flex h-screen max-h-screen flex-col w-56 overflow-hidden bg-raz-teal flex-shrink-0 sticky top-0">
        <div className="flex items-center justify-center py-6 border-b border-teal-400/30">
          <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center">
            <Heart size={22} className="text-white" fill="white" />
          </div>
        </div>

        <nav className="flex-1 min-h-0 flex flex-col gap-1 overflow-hidden p-3 pt-4 text-sm">
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

        <div className="p-3 border-t border-teal-400/30">
          <Link
            href={variant === "community" ? "/community/campaigns/search" : "/nonprofit/create-campaign"}
            className="w-full bg-white text-raz-teal text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
          >
            <Megaphone size={15} />
            <EditableText tKey={variant === "community" ? "cm.newOrJoinCampaign" : "adm.newCampaign"} />
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-h-0 overflow-y-auto bg-raz-surface">
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={signOut} className="bg-raz-dark text-white text-xs font-medium px-4 py-2 rounded-full flex items-center gap-1.5 hover:bg-gray-800 transition-colors">
              <LogOut size={13} />
              <EditableText tKey="adm.logout" />
            </button>
            <Link href={profileHref} aria-label={lang === "en" ? "Open profile" : "פתיחת הפרופיל"} className="micro-hint w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
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

        <div className="px-6 py-6">{children}</div>
        <BottomNav variant={variant} />
      </div>
    </div>
  );
}
