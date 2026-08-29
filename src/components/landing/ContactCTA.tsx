"use client";
import Link from "next/link";
import EditableText from "@/components/admin/EditableText";
import { useAuth } from "@/contexts/AuthContext";
import { profilePathForRole } from "@/lib/profile-routes";

export default function ContactCTA() {
  const { profile } = useAuth();
  const profileHref = profilePathForRole(profile?.app_role);

  return (
    <section id="contact" className="max-w-6xl mx-auto px-6 py-10">
      <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <p className="text-sm text-gray-600"><EditableText tKey="landing.cta.bar" /></p>
        <div className="flex gap-2 flex-shrink-0">
          <button className="interactive-control bg-raz-teal text-white text-sm font-bold px-4 py-2 rounded-full"><EditableText tKey="landing.cta.donateBtn" /></button>
          <Link href={profileHref} className="interactive-control bg-raz-dark text-white text-sm font-bold px-4 py-2 rounded-full"><EditableText tKey="landing.cta.personalArea" /></Link>
        </div>
      </div>

      <div className="bg-raz-teal rounded-2xl px-6 py-8 text-center">
        <EditableText tKey="landing.cta.bannerHeading" as="h3" className="text-white text-xl font-bold mb-4 block" />
        <EditableText tKey="landing.cta.bannerSub" as="p" className="text-white/90 mb-6 block" />
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button className="interactive-control bg-white text-raz-teal font-bold px-5 py-2.5 rounded-full text-sm"><EditableText tKey="landing.cta.noOrg" /></button>
          <button className="interactive-control bg-raz-dark text-white font-bold px-5 py-2.5 rounded-full text-sm"><EditableText tKey="landing.cta.hasOrg" /></button>
        </div>
      </div>
    </section>
  );
}
