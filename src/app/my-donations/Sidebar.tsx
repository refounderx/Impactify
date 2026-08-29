"use client";
import React from "react";
import { Heart, LayoutList, Receipt, Flag, Bell, UserCircle, Megaphone, HelpCircle } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import EditableText from "@/components/admin/EditableText";

type View = "my-donations" | "manage" | "tax-refund" | "updates" | "profile";

type NavItem = {
  key: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  view: View | null;
  sub?: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "myDon.navMyDonations", icon: Heart,       view: "my-donations" },
  { key: "myDon.manage",         icon: LayoutList,  view: "manage" },
  { key: "myDon.taxRefund",      icon: Receipt,     view: "tax-refund" as View },
  { key: "myDon.navMyCampaigns", icon: Flag,        view: null, sub: "ניהול קמפיינים" },
  { key: "myDon.navUpdates",     icon: Bell,        view: "updates" as View },
  { key: "myDon.navProfile",     icon: UserCircle,  view: "profile" as View },
];

interface Props {
  view: View;
  onNav: (v: View) => void;
}

export default function Sidebar({ view, onNav }: Props) {
  const { lang } = useLang();

  return (
    <aside className="hidden md:flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] min-h-0 flex-col w-52 bg-raz-teal flex-shrink-0 sticky top-0 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center justify-center py-6 border-b border-teal-400/30">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">🤝</div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 min-h-0 flex flex-col gap-0.5 overflow-hidden p-3 pt-4">
        {NAV_ITEMS.map(({ key, icon: Icon, view: navView, sub }) => {
          const active = navView === view;
          return (
            <div key={key}>
              <button
                onClick={() => navView && onNav(navView)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-start ${
                  active ? "bg-white/20 text-white" : "text-teal-100 hover:bg-white/10"
                }`}
              >
                <Icon size={17} className="flex-shrink-0" />
                <EditableText tKey={key} />
              </button>
              {sub && <p className="text-teal-200/60 text-xs ps-8 pb-1">{sub}</p>}
            </div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-3 flex flex-col gap-2 border-t border-teal-400/30 bg-raz-teal">
        <button className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <Megaphone size={14} />
          {lang === "en" ? "Start Campaign" : "הקמת קמפיין"}
        </button>
        <button className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <HelpCircle size={14} />
          {lang === "en" ? "How does it work?" : "איך זה עובד?"}
        </button>
      </div>
    </aside>
  );
}
