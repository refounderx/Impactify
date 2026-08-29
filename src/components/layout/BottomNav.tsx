"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Activity, User, LayoutDashboard, FileText, Users } from "lucide-react";

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

export default function BottomNav({ variant = "donor" }: { variant?: NavVariant }) {
  const pathname = usePathname();
  const tabs =
    variant === "nonprofit" ? nonprofitTabs : variant === "community" ? communityTabs : donorTabs;

  return (
    <nav className="sticky bottom-0 bg-white border-t border-gray-200 flex z-40 mt-auto md:hidden">
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
    </nav>
  );
}
