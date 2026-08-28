"use client";
import Link from "next/link";
import { Mail, User } from "lucide-react";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import EditableText from "@/components/admin/EditableText";
import { getSocialLinkLabel } from "@/lib/social-link-labels";

export default function LandingHeader() {
  const { data } = useSiteDataset("landing");
  const socialLinks = data?.socialLinks ?? [];
  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail size={18} className="text-gray-500" />
          {socialLinks.map((s) => (
            <a key={s.id} href={s.href} className="micro-hint interactive-control w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center" aria-label={getSocialLinkLabel(s.label)}>
              {s.label}
            </a>
          ))}
          <Link href="/auth" className="interactive-control flex items-center gap-1 text-raz-teal font-medium text-sm ms-2">
            <User size={16} /> <EditableText tKey="landing.nav.personalArea" />
          </Link>
        </div>

        <nav className="flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link href="/landing" className="interactive-control"><EditableText tKey="landing.nav.who" /></Link>
          <Link href="/nonprofit/create-campaign" className="interactive-control"><EditableText tKey="landing.nav.campaign" /></Link>
          <Link href="#why" className="interactive-control"><EditableText tKey="landing.nav.about" /></Link>
          <Link href="#contact" className="interactive-control"><EditableText tKey="landing.nav.talk" /></Link>
        </nav>
      </div>
    </header>
  );
}
