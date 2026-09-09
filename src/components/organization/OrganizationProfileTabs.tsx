"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import ProductCard from "@/components/landing/ProductCard";
import DonationSocialProof from "@/components/donations/DonationSocialProof";
import type { getProductsByIds } from "@/lib/supabase/queries";

type Tab = "products" | "organization";
type Props = {
  products: Awaited<ReturnType<typeof getProductsByIds>>;
  campaignId: string;
  campaignDonors: number;
  organization: { initials: string; color: string; bio?: string; bioEn?: string; name: string; nameEn?: string; founded?: string; foundedEn?: string; ceo?: string; ceoEn?: string; volunteers?: number; address?: string; addressEn?: string; phone?: string; goals: { he: string; en: string | null }[] };
  lang: "he" | "en";
};

export default function OrganizationProfileTabs({ products, campaignId, campaignDonors, organization, lang }: Props) {
  const [tab, setTab] = useState<Tab>("organization");
  const isEnglish = lang === "en";
  const labels: Record<Tab, string> = isEnglish ? { products: "Donation products", organization: "About the nonprofit" } : { products: "מוצרים לתרומה", organization: "על העמותה" };
  const orgName = isEnglish ? (organization.nameEn ?? organization.name) : organization.name;
  const bio = isEnglish ? (organization.bioEn ?? organization.bio) : organization.bio;

  return <section className="mt-8 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,.06)] sm:p-8" dir={lang === "en" ? "ltr" : "rtl"}><div className="overflow-x-auto border-b border-slate-200"><div className="flex min-w-max gap-1">{(Object.keys(labels) as Tab[]).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`px-4 py-3 text-sm font-bold transition-colors ${tab === item ? "border-b-2 text-raz-dark" : "text-slate-400 hover:text-slate-700"}`} style={tab === item ? { borderColor: organization.color, color: organization.color } : undefined}>{labels[item]}</button>)}</div></div>
    {tab === "products" && <div className="pt-7"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-extrabold text-raz-dark">{isEnglish ? "Products you can fund" : "מוצרים שאפשר לתרום"}</h2><DonationSocialProof count={campaignDonors} className="text-sm font-bold" style={{ color: organization.color }} /></div>{products.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} title={isEnglish ? (product.nameEn ?? product.name) : product.name} price={product.price} emoji={product.emoji} imageUrl={product.imageUrl} videoUrl={product.videoUrl} donationCount={campaignDonors} onOpenDetails={() => { window.location.href = `/product/${product.id}?campaign_id=${campaignId}`; }} onChoose={() => { window.location.href = `/product/${product.id}?campaign_id=${campaignId}`; }} />)}</div> : <Empty icon={<Heart />} text={isEnglish ? "Donation products will appear here soon." : "מוצרי התרומה יופיעו כאן בקרוב."} />}</div>}
    {tab === "organization" && <div className="grid gap-7 pt-7 lg:grid-cols-[.8fr_1.2fr]"><aside className="rounded-2xl border p-5" style={{ borderColor: organization.color }}><span className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white" style={{ backgroundColor: organization.color }}>{organization.initials}</span><h2 className="mt-4 text-xl font-extrabold text-raz-dark">{orgName}</h2><dl className="mt-5 space-y-3 text-sm">{organization.founded && <Info label={isEnglish ? "Founded" : "נוסדה"} value={isEnglish ? (organization.foundedEn ?? organization.founded) : organization.founded} />}{organization.ceo && <Info label={isEnglish ? "CEO" : "מנכ״ל/ית"} value={isEnglish ? (organization.ceoEn ?? organization.ceo) : organization.ceo} />}{organization.volunteers !== undefined && <Info label={isEnglish ? "Volunteers" : "מתנדבים"} value={organization.volunteers.toLocaleString()} />}{organization.address && <Info label={isEnglish ? "Address" : "כתובת"} value={isEnglish ? (organization.addressEn ?? organization.address) : organization.address} />}{organization.phone && <Info label={isEnglish ? "Phone" : "טלפון"} value={organization.phone} />}</dl></aside><div><Article title={isEnglish ? "Our story" : "הסיפור שלנו"} body={bio} /><div className="mt-5 flex flex-wrap gap-2">{organization.goals.map((goal) => <span key={goal.he} className="rounded-full px-3 py-1.5 text-sm font-bold" style={{ backgroundColor: `${organization.color}18`, color: organization.color }}>{isEnglish ? (goal.en ?? goal.he) : goal.he}</span>)}</div></div></div>}
  </section>;
}

function Article({ title, body }: { title: string; body?: string }) { return <div className="pt-7"><h2 className="text-xl font-extrabold text-raz-dark">{title}</h2><p className="mt-4 max-w-4xl whitespace-pre-line leading-8 text-slate-600">{body || "—"}</p></div>; }
function Info({ label, value }: { label: string; value?: string }) { return <div className="flex justify-between gap-4"><dt className="text-slate-400">{label}</dt><dd className="text-end font-bold text-slate-700">{value}</dd></div>; }
function Empty({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="mt-5 flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl bg-slate-50 text-center text-sm text-slate-500"><span className="text-raz-teal">{icon}</span>{text}</div>; }
