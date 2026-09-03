"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, LogIn, Pencil, Globe2, X } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminMode } from "@/contexts/AdminModeContext";
import EditableText from "@/components/admin/EditableText";
import { profilePathForRole } from "@/lib/profile-routes";
import { getDonorUpdates } from "@/lib/supabase/queries-my-donations";
import MobileAppChrome from "@/components/layout/MobileAppChrome";

export default function TopNav() {
  const pathname = usePathname();
  const { lang, setLang, t } = useLang();
  const { user, profile } = useAuth();
  const { adminMode, toggleAdminMode } = useAdminMode();
  const [sitePagesOpen, setSitePagesOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Awaited<ReturnType<typeof getDonorUpdates>>>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  async function toggleNotifications() {
    const next = !notificationsOpen; setNotificationsOpen(next);
    if (!next) return;
    setNotificationsLoading(true);
    try { setNotifications(await getDonorUpdates(user?.id ?? null)); } finally { setNotificationsLoading(false); }
  }

  const active = pathname.startsWith("/admin")
    ? "/admin"
    : pathname.startsWith("/nonprofit")
    ? "/nonprofit"
    : pathname.startsWith("/community")
    ? "/community"
    : "/";

  const shortName = lang === "en"
    ? (profile?.full_name_en ?? profile?.full_name ?? "")
    : (profile?.full_name ?? "");
  const profileHref = profilePathForRole(profile?.app_role);
  const dashboardHref = profile?.app_role === "ngo_owner" ? "/nonprofit"
    : profile?.app_role === "community_owner" ? "/community"
    : profile?.app_role === "admin" ? "/admin/users"
    : "/my-donations";

  const donorLinks = [
    { key: "nav.home", href: "/" },
    { key: "nav.search", href: "/search" },
    ...(user && profile ? [{ key: "nav.dashboard", href: dashboardHref }] : []),
    { key: "nav.profile", href: profileHref },
  ];
  const nonprofitLinks = [
    { key: "nav.dashboard", href: "/nonprofit" },
    { key: "nav.newCampaign", href: "/nonprofit/create-campaign" },
  ];
  const communityLinks = [
    { key: "nav.dashboard", href: "/community" },
    { key: "nav.profile", href: "/community/profile" },
  ];
  const adminLinks = [
    { key: "nav.users", href: "/admin/users" },
    { key: "nav.profile", href: "/admin/profile" },
  ];
  const profileRoleLinks = profile?.app_role === "admin" ? adminLinks
    : profile?.app_role === "community_owner" ? communityLinks
    : profile?.app_role === "ngo_owner" ? nonprofitLinks
    : donorLinks;
  const links =
    pathname === "/profile" ? profileRoleLinks
    : active === "/admin" ? adminLinks
    : active === "/nonprofit" ? nonprofitLinks
    : active === "/community" ? communityLinks
    : donorLinks;
  const adminSitePages = [
    { href: "/", label: lang === "en" ? "Home" : "דף הבית" },
    { href: "/search", label: lang === "en" ? "Search" : "חיפוש" },
    { href: "/about", label: lang === "en" ? "About" : "אודות" },
    { href: "/recurring", label: lang === "en" ? "Recurring donations" : "הוראות קבע" },
    { href: "/cancellations", label: lang === "en" ? "Cancellations" : "ביטולים" },
    { href: "/terms", label: lang === "en" ? "Terms of use" : "תנאי שימוש" },
    { href: "/privacy", label: lang === "en" ? "Privacy" : "מדיניות פרטיות" },
    { href: "/accessibility", label: lang === "en" ? "Accessibility" : "נגישות" },
  ];

  return (
    <>
    <nav className="hidden md:flex bg-white border-b border-gray-100 px-6 py-3 items-center justify-between">
      {/* Logo */}
      <Link href="/" className="text-xl font-bold text-raz-teal font-hebrew whitespace-nowrap">
        <EditableText tKey="brand" />
      </Link>

      {/* Links */}
      <div className="flex items-center gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === l.href ? "bg-raz-teal/10 text-raz-teal" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <EditableText tKey={l.key} />
          </Link>
        ))}
      </div>

      {/* Right: lang toggle + bell + user */}
      <div className="flex items-center gap-3">
        {profile?.app_role === "admin" && (
          <div className="group relative">
            <button
              type="button"
              onClick={toggleAdminMode}
              className={`flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-bold transition-colors ${adminMode ? "border-amber-500 bg-amber-500 text-white" : "border-gray-200 text-gray-600 hover:border-raz-teal hover:text-raz-teal"}`}
              aria-pressed={adminMode}
              aria-label={lang === "en" ? "Toggle online text editing" : "הפעלת עריכת טקסטים אונליין"}
            >
              <Pencil size={15} aria-hidden="true" />
              {lang === "en" ? "Edit text" : "עריכת טקסט"}
            </button>
            <span role="tooltip" className="pointer-events-none absolute end-0 top-full z-[80] mt-2 w-max max-w-56 rounded-md bg-gray-800 px-2 py-1 text-center text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              {lang === "en" ? "Turn online text editing on or off" : "הפעלה או כיבוי של עריכת טקסטים באתר"}
            </span>
          </div>
        )}
        {profile?.app_role === "admin" && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setSitePagesOpen((open) => !open)}
              className="micro-hint micro-hint-below flex min-h-10 items-center gap-2 rounded-full border border-gray-200 px-3 text-sm font-bold text-gray-600 transition-colors hover:border-raz-teal hover:text-raz-teal"
              aria-expanded={sitePagesOpen}
              aria-label={lang === "en" ? "Browse site pages" : "מעבר בין דפי האתר"}
            >
              <Globe2 size={15} aria-hidden="true" />
              {lang === "en" ? "Site pages" : "דפי האתר"}
            </button>
            {sitePagesOpen && (
              <div className="absolute end-0 top-full z-[70] mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                {adminSitePages.map((page) => (
                  <Link key={page.href} href={page.href} onClick={() => setSitePagesOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    {page.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Language toggle */}
        <div className="flex items-center bg-gray-100 rounded-full p-0.5 text-xs font-bold">
          <button
            onClick={() => setLang("he")}
            className={`px-2.5 py-1 rounded-full transition-colors ${lang === "he" ? "bg-raz-teal text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            עב
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-2.5 py-1 rounded-full transition-colors ${lang === "en" ? "bg-raz-teal text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            EN
          </button>
        </div>

        {active === "/" && (
          <Link href="/search" className="micro-hint text-gray-500 hover:text-raz-teal" aria-label={t("nav.search")}>
            <Search size={20} />
          </Link>
        )}
        <button type="button" onClick={() => void toggleNotifications()} className="micro-hint relative text-gray-500 hover:text-raz-teal" aria-expanded={notificationsOpen} aria-label={t("hint.notifications")}>
          <Bell size={20} />
          <span className="absolute -top-0.5 -start-0.5 w-2 h-2 bg-red-400 rounded-full" />
        </button>
        {notificationsOpen && <div className="absolute end-6 top-14 z-50 w-80 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl"><div className="mb-3 flex items-center justify-between"><p className="font-bold text-raz-dark">{lang === "en" ? "Updates" : "עדכונים"}</p><button type="button" onClick={() => setNotificationsOpen(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label={lang === "en" ? "Close" : "סגירה"}><X size={16} /></button></div>{notificationsLoading ? <p className="text-sm text-gray-400">…</p> : notifications.length ? <div className="space-y-3">{notifications.map((item) => <div key={item.id} className="border-b border-gray-100 pb-3 last:border-0"><p className="text-sm font-bold text-gray-800">{lang === "en" ? item.productNameEn : item.productName}</p><p className="mt-1 text-xs text-gray-500">{lang === "en" ? item.descriptionEn : item.description}</p></div>)}</div> : <p className="text-sm text-gray-500">{lang === "en" ? "No updates yet" : "אין עדכונים חדשים"}</p>}</div>}
        {user ? (
          <Link href={profileHref} className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50">
            <div className="w-7 h-7 rounded-full bg-raz-teal flex items-center justify-center text-white text-xs font-bold">
              {(user.email ?? shortName).slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
              {user.email ?? shortName}
            </span>
          </Link>
        ) : (
          <Link href="/auth" className="flex items-center gap-1.5 border border-raz-teal text-raz-teal rounded-full px-3 py-1.5 text-sm font-medium hover:bg-raz-teal/5">
            <LogIn size={15} />
            {lang === "en" ? "Sign In" : "התחבר"}
          </Link>
        )}
      </div>
    </nav>
    <MobileAppChrome />
    </>
  );
}
