"use client";

import { useState } from "react";
import { Heart, UsersRound } from "lucide-react";
import { formatNIS } from "@/lib/mock-data";
import type { PublicOrganizationCommunity, PublicOrganizationDonation } from "@/lib/supabase/queries";

type Tab = "donations" | "communities" | "campaign" | "organization";
type Props = {
  donations: PublicOrganizationDonation[];
  communities: PublicOrganizationCommunity[];
  campaignStory: string;
  organization: { initials: string; color: string; bio?: string; bioEn?: string; name: string; nameEn?: string; founded?: string; foundedEn?: string; ceo?: string; ceoEn?: string; volunteers?: number; address?: string; addressEn?: string; phone?: string; goals: { he: string; en: string | null }[] };
  lang: "he" | "en";
};

export default function OrganizationProfileTabs({ donations, communities, campaignStory, organization, lang }: Props) {
  const [tab, setTab] = useState<Tab>("donations");
  const isEnglish = lang === "en";
  const labels: Record<Tab, string> = isEnglish ? { donations: "Donors", communities: "Communities", campaign: "About the campaign", organization: "About the nonprofit" } : { donations: "תורמים", communities: "קהילות", campaign: "כמה מילים על הקמפיין", organization: "כמה מילים על העמותה" };
  const orgName = isEnglish ? (organization.nameEn ?? organization.name) : organization.name;
  const bio = isEnglish ? (organization.bioEn ?? organization.bio) : organization.bio;
  const story = campaignStory || bio;

  return <section className="mt-10 rounded-[2rem] bg-white p-5 shadow-sm sm:p-8"><div className="overflow-x-auto border-b border-slate-200"><div className="flex min-w-max gap-1">{(Object.keys(labels) as Tab[]).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`px-4 py-3 text-sm font-bold transition-colors ${tab === item ? "border-b-2 text-raz-dark" : "text-slate-400 hover:text-slate-700"}`} style={tab === item ? { borderColor: organization.color, color: organization.color } : undefined}>{labels[item]}</button>)}</div></div>
    {tab === "donations" && <div className="pt-7"><div className="flex items-center justify-between"><h2 className="text-xl font-extrabold text-raz-dark">{isEnglish ? "Recent donations" : "תרומות אחרונות"}</h2><span className="text-sm font-bold" style={{ color: organization.color }}>{donations.length} {isEnglish ? "shown" : "מוצגות"}</span></div>{donations.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{donations.map((donation, index) => <article key={`${donation.createdAt}-${index}`} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-center justify-between"><span className="font-black text-raz-dark">{formatNIS(donation.amount)}</span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-50 text-pink-500"><Heart size={15} fill="currentColor" /></span></div><p className="mt-4 text-sm font-bold text-slate-700">{isEnglish ? "Anonymous donor" : "תורם/ת אנונימי/ת"}</p><p className="mt-1 text-xs text-slate-400">{new Intl.DateTimeFormat(isEnglish ? "en-IL" : "he-IL", { dateStyle: "medium" }).format(new Date(donation.createdAt))}</p></article>)}</div> : <Empty icon={<Heart />} text={isEnglish ? "Donations will appear here as the campaign receives them." : "כאן יופיעו תרומות עם התקדמות הקמפיין."} />}</div>}
    {tab === "communities" && <div className="pt-7"><h2 className="text-xl font-extrabold text-raz-dark">{isEnglish ? "Communities working with us" : "קהילות שפועלות איתנו"}</h2>{communities.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{communities.map((community) => <article key={community.id} className="rounded-2xl border border-slate-100 p-5 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-lg font-black text-white" style={{ backgroundColor: community.color }}>{(isEnglish ? (community.nameEn ?? community.name) : community.name).slice(0, 2)}</span><p className="mt-3 font-bold text-raz-dark">{isEnglish ? (community.nameEn ?? community.name) : community.name}</p><p className="mt-1 text-xs text-slate-500">{formatNIS(community.totalRaised)} {isEnglish ? "raised by community" : "גויסו בקהילה"}</p></article>)}</div> : <Empty icon={<UsersRound />} text={isEnglish ? "Active community partners will appear here." : "כאן יופיעו קהילות עם שותפות פעילה."} />}</div>}
    {tab === "campaign" && <Article title={isEnglish ? "Why this campaign matters" : "למה הקמפיין הזה חשוב"} body={story} />}
    {tab === "organization" && <div className="grid gap-7 pt-7 lg:grid-cols-[.8fr_1.2fr]"><aside className="rounded-2xl border p-5" style={{ borderColor: organization.color }}><span className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white" style={{ backgroundColor: organization.color }}>{organization.initials}</span><h2 className="mt-4 text-xl font-extrabold text-raz-dark">{orgName}</h2><dl className="mt-5 space-y-3 text-sm">{organization.founded && <Info label={isEnglish ? "Founded" : "נוסדה"} value={isEnglish ? (organization.foundedEn ?? organization.founded) : organization.founded} />}{organization.ceo && <Info label={isEnglish ? "CEO" : "מנכ״ל/ית"} value={isEnglish ? (organization.ceoEn ?? organization.ceo) : organization.ceo} />}{organization.volunteers !== undefined && <Info label={isEnglish ? "Volunteers" : "מתנדבים"} value={organization.volunteers.toLocaleString()} />}{organization.address && <Info label={isEnglish ? "Address" : "כתובת"} value={isEnglish ? (organization.addressEn ?? organization.address) : organization.address} />}{organization.phone && <Info label={isEnglish ? "Phone" : "טלפון"} value={organization.phone} />}</dl></aside><div><Article title={isEnglish ? "Our story" : "הסיפור שלנו"} body={bio} /><div className="mt-5 flex flex-wrap gap-2">{organization.goals.map((goal) => <span key={goal.he} className="rounded-full px-3 py-1.5 text-sm font-bold" style={{ backgroundColor: `${organization.color}18`, color: organization.color }}>{isEnglish ? (goal.en ?? goal.he) : goal.he}</span>)}</div></div></div>}
  </section>;
}

function Article({ title, body }: { title: string; body?: string }) { return <div className="pt-7"><h2 className="text-xl font-extrabold text-raz-dark">{title}</h2><p className="mt-4 max-w-4xl whitespace-pre-line leading-8 text-slate-600">{body || "—"}</p></div>; }
function Info({ label, value }: { label: string; value?: string }) { return <div className="flex justify-between gap-4"><dt className="text-slate-400">{label}</dt><dd className="text-end font-bold text-slate-700">{value}</dd></div>; }
function Empty({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl bg-slate-50 text-center text-sm text-slate-500"><span className="text-raz-teal">{icon}</span>{text}</div>; }
