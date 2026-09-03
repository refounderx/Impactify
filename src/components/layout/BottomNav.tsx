"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Activity, User, LayoutDashboard, FileText, Users, LogOut } from "lucide-react";

type NavVariant = "donor" | "nonprofit" | "community";

const donorTabs = [
  { label: "בית", href: "/", Icon: Home },
  { label: "חיפוש", href: "/search", Icon: Search },
  { label: "פעילות", href: "/my-donations", Icon: Activity },
  { label: "פרופיל", href: "/profile", Icon: User },
];

const nonprofitTabs = [
  { label: "ראשי", href: "/nonprofit", Icon: LayoutDashboard },
  { label: "קמפיינים", href: "/nonprofit/campaigns", Icon: FileText },
  { label: "תרומות", href: "/nonprofit/donations", Icon: Activity },
  { label: "פרופיל", href: "/nonprofit/profile", Icon: User },
];

const communityTabs = [
  { label: "ראשי", href: "/community", Icon: LayoutDashboard },
  { label: "קהילה", href: "/community", Icon: Users },
  { label: "פעילות", href: "/community", Icon: Activity },
  { label: "פרופיל", href: "/community/profile", Icon: User },
];

export default function BottomNav({ variant = "donor", onSignOut }: { variant?: NavVariant; onSignOut?: () => void }) {
  const pathname = usePathname();
  const coveredByMobileChrome = !pathname.endsWith("/onboarding") && !pathname.startsWith("/nonprofit/create-campaign");
  if (coveredByMobileChrome) return null;
  const tabs =
    variant === "nonprofit" ? nonprofitTabs : variant === "community" ? communityTabs : donorTabs;

  return (
    <nav className="sticky bottom-0 z-40 mt-auto flex border-t border-gray-200 bg-white shadow-[0_-8px_20px_rgba(15,23,42,0.06)] md:hidden">
      {tabs.map(({ label, href, Icon }) => {
        const isDashboardRoot = href === "/nonprofit" || href === "/community";
        const isActive = pathname === href || (!isDashboardRoot && href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={label}
            href={href}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
              isActive ? "text-raz-teal" : "text-gray-400"
            }`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        );
      })}
      {onSignOut && (
        <button type="button" onClick={onSignOut} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-gray-400 transition-colors hover:text-raz-teal" aria-label="התנתקות">
          <LogOut size={22} />
          <span>התנתקות</span>
        </button>
      )}
    </nav>
  );
}
