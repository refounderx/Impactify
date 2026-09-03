"use client";

import Link from "next/link";
import { Bell, FileText, Flag, Heart, Home, LayoutDashboard, LineChart, LogIn, LogOut, Search, User, Users, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { profilePathForRole } from "@/lib/profile-routes";
import { getDonorUpdates } from "@/lib/supabase/queries-my-donations";

type MobileItem = { href: string; label: string; Icon: typeof Home; active: (pathname: string) => boolean };

export default function MobileAppChrome() {
  const pathname = usePathname();
  const { lang, setLang } = useLang();
  const { user, profile, signOut } = useAuth();
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [updates, setUpdates] = useState<Awaited<ReturnType<typeof getDonorUpdates>>>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const immersive = pathname === "/auth" || pathname.startsWith("/auth/") || pathname.endsWith("/onboarding") || pathname.startsWith("/nonprofit/create-campaign");
  if (immersive) return null;

  const role = profile?.app_role;
  const homeHref = role === "ngo_owner" ? "/nonprofit" : role === "community_owner" ? "/community" : role === "admin" ? "/admin/users" : "/";
  const profileHref = profilePathForRole(role);
  const items = getItems(role, lang, profileHref);

  async function toggleUpdates() {
    const next = !updatesOpen;
    setUpdatesOpen(next);
    if (!next) return;
    setLoadingUpdates(true);
    try { setUpdates(await getDonorUpdates(user?.id ?? null)); }
    finally { setLoadingUpdates(false); }
  }

  return <>
    <header className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-3 md:hidden">
      <Link href={homeHref} className="flex items-center gap-2" aria-label="Impactify">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-raz-teal text-white"><Heart size={18} fill="currentColor" /></span>
        <span className="text-xl font-extrabold tracking-tight text-raz-teal">Impactify</span>
      </Link>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => void toggleUpdates()} className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-50 hover:text-raz-teal" aria-label={lang === "en" ? "Updates" : "עדכונים"} aria-expanded={updatesOpen}>
          <Bell size={20} /><span className="absolute end-1 top-1 h-2 w-2 rounded-full bg-red-400" />
        </button>
        <div className="flex rounded-full bg-gray-100 p-0.5 text-xs font-bold">
          <button type="button" onClick={() => setLang("he")} className={`rounded-full px-2.5 py-1 ${lang === "he" ? "bg-raz-teal text-white" : "text-gray-500"}`}>עב</button>
          <button type="button" onClick={() => setLang("en")} className={`rounded-full px-2.5 py-1 ${lang === "en" ? "bg-raz-teal text-white" : "text-gray-500"}`}>EN</button>
        </div>
      </div>
    </header>

    {updatesOpen && <UpdatesPanel lang={lang} loading={loadingUpdates} updates={updates} close={() => setUpdatesOpen(false)} />}

    <nav className="fixed inset-x-0 bottom-0 z-[60] grid grid-cols-5 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_20px_rgba(15,23,42,0.10)] md:hidden" aria-label={lang === "en" ? "Mobile navigation" : "ניווט במובייל"}>
      {items.map(({ href, label, Icon, active }) => <Link key={label} href={href} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs transition-colors ${active(pathname) ? "text-raz-teal" : "text-gray-400 hover:text-raz-teal"}`}><Icon size={21} /><span>{label}</span></Link>)}
      {user ? <button type="button" onClick={() => void signOut()} className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-gray-400 hover:text-raz-teal" aria-label={lang === "en" ? "Sign out" : "התנתקות"}><LogOut size={21} /><span>{lang === "en" ? "Sign out" : "התנתקות"}</span></button> : <Link href="/auth" className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${pathname === "/auth" ? "text-raz-teal" : "text-gray-400"}`}><LogIn size={21} /><span>{lang === "en" ? "Sign in" : "התחברות"}</span></Link>}
    </nav>
  </>;
}

function getItems(role: string | undefined, lang: "he" | "en", profileHref: string): MobileItem[] {
  const label = (he: string, en: string) => lang === "en" ? en : he;
  if (role === "ngo_owner") return [
    { href: "/nonprofit", label: label("דשבורד", "Dashboard"), Icon: LayoutDashboard, active: (path) => path === "/nonprofit" },
    { href: "/nonprofit/campaigns", label: label("קמפיינים", "Campaigns"), Icon: Flag, active: (path) => path.startsWith("/nonprofit/campaign") },
    { href: "/nonprofit/donations", label: label("תרומות", "Donations"), Icon: LineChart, active: (path) => path.startsWith("/nonprofit/donations") },
    { href: profileHref, label: label("פרופיל", "Profile"), Icon: User, active: (path) => path === profileHref },
  ];
  if (role === "community_owner") return [
    { href: "/community", label: label("דשבורד", "Dashboard"), Icon: LayoutDashboard, active: (path) => path === "/community" },
    { href: "/community/campaigns", label: label("קמפיינים", "Campaigns"), Icon: Flag, active: (path) => path.startsWith("/community/campaign") },
    { href: "/community/updates", label: label("עדכונים", "Updates"), Icon: Bell, active: (path) => path.startsWith("/community/updates") },
    { href: profileHref, label: label("פרופיל", "Profile"), Icon: User, active: (path) => path === profileHref },
  ];
  if (role === "admin") return [
    { href: "/admin/users", label: label("משתמשים", "Users"), Icon: Users, active: (path) => path.startsWith("/admin/users") },
    { href: "/", label: label("אתר", "Site"), Icon: Home, active: (path) => path === "/" },
    { href: profileHref, label: label("פרופיל", "Profile"), Icon: User, active: (path) => path === profileHref },
    { href: "/search", label: label("חיפוש", "Search"), Icon: Search, active: (path) => path.startsWith("/search") },
  ];
  return [
    { href: "/", label: label("בית", "Home"), Icon: Home, active: (path) => path === "/" },
    { href: "/search", label: label("חיפוש", "Search"), Icon: Search, active: (path) => path.startsWith("/search") },
    { href: "/my-donations", label: label("התרומות שלי", "My donations"), Icon: FileText, active: (path) => path.startsWith("/my-donations") },
    { href: profileHref, label: label("פרופיל", "Profile"), Icon: User, active: (path) => path === profileHref },
  ];
}

function UpdatesPanel({ lang, loading, updates, close }: { lang: "he" | "en"; loading: boolean; updates: Awaited<ReturnType<typeof getDonorUpdates>>; close: () => void }) {
  return <div className="fixed end-4 top-16 z-[70] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 bg-white p-4 shadow-xl md:hidden"><div className="mb-3 flex items-center justify-between"><p className="font-bold text-raz-dark">{lang === "en" ? "Updates" : "עדכונים"}</p><button type="button" onClick={close} className="rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label={lang === "en" ? "Close" : "סגירה"}><X size={16} /></button></div>{loading ? <p className="text-sm text-gray-400">…</p> : updates.length ? <div className="space-y-3">{updates.map((item) => <div key={item.id} className="border-b border-gray-100 pb-3 last:border-0"><p className="text-sm font-bold text-gray-800">{lang === "en" ? item.productNameEn : item.productName}</p><p className="mt-1 text-xs text-gray-500">{lang === "en" ? item.descriptionEn : item.description}</p></div>)}</div> : <p className="text-sm text-gray-500">{lang === "en" ? "No updates yet" : "אין עדכונים חדשים"}</p>}</div>;
}
