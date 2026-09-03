"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import CampaignCard from "@/components/campaign/CampaignCard";
import { useLang } from "@/contexts/LanguageContext";
import { getCampaignsByOrg, getOrgById } from "@/lib/supabase/queries";

export default function OrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLang();
  const [org, setOrg] = useState<Awaited<ReturnType<typeof getOrgById>>>(null);
  const [campaigns, setCampaigns] = useState<Awaited<ReturnType<typeof getCampaignsByOrg>>>([]);

  useEffect(() => {
    if (!id) return;
    void Promise.all([getOrgById(id), getCampaignsByOrg(id)]).then(([organization, items]) => {
      setOrg(organization);
      setCampaigns(items);
    });
  }, [id]);

  if (!org) return <main className="min-h-screen bg-raz-surface px-6 py-16"><div className="mx-auto h-80 max-w-5xl animate-pulse rounded-3xl bg-white" /></main>;
  const name = lang === "en" ? (org.nameEn ?? org.name) : org.name;
  const description = lang === "en" ? (org.bioEn ?? org.bio) : org.bio;

  return <main className="min-h-screen bg-raz-surface pb-24" dir={lang === "en" ? "ltr" : "rtl"}>
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-bold text-raz-teal"><ArrowRight size={18} />{lang === "en" ? "Back" : "חזרה"}</button>
      <section className="mt-6 rounded-[2rem] bg-white p-8 shadow-sm md:p-12"><div className="flex flex-col gap-6 sm:flex-row sm:items-center"><div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl text-3xl font-black text-white" style={{ backgroundColor: org.color }}>{org.initials}</div><div><div className="flex items-center gap-2"><h1 className="text-4xl text-raz-dark">{name}</h1>{org.verified && <BadgeCheck className="text-raz-teal" />}</div>{description && <p className="mt-4 max-w-3xl leading-8 text-slate-600">{description}</p>}</div></div>{org.goals.length > 0 && <div className="mt-8 border-t border-slate-100 pt-6"><p className="text-sm font-bold text-raz-teal">{lang === "en" ? "What we do" : "מה אנחנו עושים"}</p><div className="mt-3 flex flex-wrap gap-2">{org.goals.map((goal) => <span key={goal.he} className="rounded-full bg-raz-teal/10 px-3 py-1.5 text-sm font-bold text-raz-teal">{lang === "en" ? (goal.en ?? goal.he) : goal.he}</span>)}</div></div>}</section>
      <section className="mt-8"><p className="text-sm font-bold text-raz-teal">{lang === "en" ? "Campaigns" : "קמפיינים"}</p><h2 className="mt-2 text-3xl font-extrabold text-raz-dark">{lang === "en" ? "Active ways to help" : "דרכים פעילות לעזור"}</h2>{campaigns.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}</div> : <p className="mt-6 rounded-3xl bg-white p-8 text-slate-500">{lang === "en" ? "There are no active campaigns right now." : "אין כרגע קמפיינים פעילים."}</p>}</section>
    </div>
    <BottomNav variant="donor" />
  </main>;
}
