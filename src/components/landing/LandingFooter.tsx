"use client";
import Link from "next/link";
import { useSiteDataset } from "@/contexts/SiteDataContext";
import EditableText from "@/components/admin/EditableText";
import { getSocialLinkLabel } from "@/lib/social-link-labels";

export default function LandingFooter() {
  const { data } = useSiteDataset("landing");
  const socialLinks = data?.socialLinks ?? [];
  return (
    <footer className="bg-raz-dark text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
        <div className="flex flex-col gap-2 text-gray-300">
          <span><EditableText tKey="landing.footer.lorem" /></span>
          <div className="flex gap-3 mt-2">
            {socialLinks.map((s) => (
              <a key={s.id} href={s.href} className="micro-hint interactive-control w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs" aria-label={getSocialLinkLabel(s.label)}>
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 text-gray-300">
          <a href="#contact" className="interactive-control"><EditableText tKey="landing.footer.contact" /></a>
          <a href="#why" className="interactive-control"><EditableText tKey="landing.footer.aboutIsrael" /></a>
          <a href="#" className="interactive-control"><EditableText tKey="landing.footer.terms" /></a>
          <a href="#" className="interactive-control"><EditableText tKey="landing.footer.app" /></a>
        </div>

        <div className="flex flex-col gap-2 text-gray-300">
          <a href="#why" className="interactive-control"><EditableText tKey="landing.footer.about" /></a>
          <Link href="/nonprofit" className="interactive-control"><EditableText tKey="landing.footer.haveOrg" /></Link>
          <a href="/recurring" className="interactive-control"><EditableText tKey="landing.footer.recurring" /></a>
          <a href="#" className="interactive-control"><EditableText tKey="landing.footer.doGood" /></a>
        </div>
      </div>
    </footer>
  );
}
