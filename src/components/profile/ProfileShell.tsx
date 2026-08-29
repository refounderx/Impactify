"use client";

import Link from "next/link";
import { Heart, House, ReceiptText, Repeat2, ShieldCheck, UserRound, Users } from "lucide-react";
import BottomNav from "@/components/layout/BottomNav";
import { useLang } from "@/contexts/LanguageContext";

type ProfileShellVariant = "donor" | "admin";

const donorLinks = [
  { href: "/", Icon: House, he: "חזרה לאתר", en: "Back to site" },
  { href: "/my-donations", Icon: ReceiptText, he: "התרומות שלי", en: "My donations" },
  { href: "/recurring", Icon: Repeat2, he: "הוראות קבע", en: "Recurring donations" },
  { href: "/profile", Icon: UserRound, he: "הפרופיל שלי", en: "My profile" },
];

const adminLinks = [
  { href: "/", Icon: House, he: "חזרה לאתר", en: "Back to site" },
  { href: "/admin/users", Icon: Users, he: "ניהול משתמשים", en: "Manage users" },
  { href: "/admin/profile", Icon: UserRound, he: "הפרופיל שלי", en: "My profile" },
];

export default function ProfileShell({ children, variant }: { children: React.ReactNode; variant: ProfileShellVariant }) {
  const { lang } = useLang();
  const links = variant === "admin" ? adminLinks : donorLinks;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="sticky top-16 hidden min-h-[calc(100vh-4rem)] w-56 flex-shrink-0 self-start flex-col bg-raz-teal md:flex">
        <div className="flex items-center justify-center border-b border-teal-400/30 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            {variant === "admin" ? <ShieldCheck className="text-white" size={23} /> : <Heart className="text-white" fill="white" size={22} />}
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3 pt-4 text-sm">
          {links.map(({ href, Icon, he, en }) => {
            const active = href.endsWith("/profile");
            return (
              <Link key={href} href={href} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-medium transition-colors ${active ? "bg-white/20 text-white" : "text-teal-100 hover:bg-white/10"}`}>
                <Icon className="flex-shrink-0" size={17} />
                {lang === "en" ? en : he}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 bg-raz-surface">
        <div className="mx-auto max-w-6xl px-5 py-8 pb-20 md:px-8 md:py-12">{children}</div>
        {variant === "donor" && <BottomNav variant="donor" />}
      </div>
    </div>
  );
}
