"use client";
import Link from "next/link";
import { Mail, User } from "lucide-react";
import { socialLinks } from "@/lib/landing-data";
import EditableText from "@/components/admin/EditableText";

export default function LandingHeader() {
  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail size={18} className="text-gray-500" />
          {socialLinks.map((s) => (
            <a key={s.id} href={s.href} className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center">
              {s.label}
            </a>
          ))}
          <Link href="/auth" className="flex items-center gap-1 text-raz-teal font-medium text-sm ms-2">
            <User size={16} /> <EditableText tKey="landing.nav.personalArea" />
          </Link>
        </div>

        <nav className="flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link href="/landing"><EditableText tKey="landing.nav.who" /></Link>
          <Link href="/nonprofit/create-campaign"><EditableText tKey="landing.nav.campaign" /></Link>
          <Link href="#why"><EditableText tKey="landing.nav.about" /></Link>
          <Link href="#contact"><EditableText tKey="landing.nav.talk" /></Link>
        </nav>
      </div>
    </header>
  );
}
