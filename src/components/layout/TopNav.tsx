"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, LogIn } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import EditableText from "@/components/admin/EditableText";

export default function TopNav() {
  const pathname = usePathname();
  const { lang, setLang } = useLang();
  const { user, profile } = useAuth();

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

  const donorLinks = [
    { key: "nav.home", href: "/" },
    { key: "nav.search", href: "/search" },
    { key: "nav.profile", href: "/profile" },
  ];
  const nonprofitLinks = [
    { key: "nav.dashboard", href: "/nonprofit" },
    { key: "nav.newCampaign", href: "/nonprofit/create-campaign" },
  ];
  const communityLinks = [
    { key: "nav.dashboard", href: "/community" },
  ];
  const adminLinks = [{ key: "nav.profile", href: "/admin/users" }];
  const links =
    active === "/admin" ? adminLinks
    : active === "/nonprofit" ? nonprofitLinks
    : active === "/community" ? communityLinks
    : donorLinks;

  return (
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
          <Link href="/search" className="text-gray-500 hover:text-raz-teal">
            <Search size={20} />
          </Link>
        )}
        <button className="relative text-gray-500 hover:text-raz-teal">
          <Bell size={20} />
          <span className="absolute -top-0.5 -start-0.5 w-2 h-2 bg-red-400 rounded-full" />
        </button>
        {user ? (
          <Link href={profile?.app_role === "admin" ? "/admin/users" : "/profile"} className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50">
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
  );
}
