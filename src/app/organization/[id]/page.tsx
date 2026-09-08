"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import PublicOrganizationHero from "@/components/organization/PublicOrganizationHero";
import OrganizationProfileTabs from "@/components/organization/OrganizationProfileTabs";
import { useLang } from "@/contexts/LanguageContext";
import { getProductsByIds, getPublicCampaignsByOrg, getOrgById } from "@/lib/supabase/queries";

export default function OrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLang();
  const [org, setOrg] = useState<Awaited<ReturnType<typeof getOrgById>>>(null);
  const [campaigns, setCampaigns] = useState<Awaited<ReturnType<typeof getPublicCampaignsByOrg>>>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProductsByIds>>>([]);

  useEffect(() => {
    if (!id) return;
    void Promise.all([getOrgById(id), getPublicCampaignsByOrg(id)]).then(async ([organization, organizationCampaigns]) => {
      setOrg(organization);
      setCampaigns(organizationCampaigns);
      const productIds = organizationCampaigns[0]?.productIds.slice(0, 3) ?? [];
      if (productIds.length) setProducts(await getProductsByIds(productIds));
    });
  }, [id]);

  if (!org) return <main className="min-h-screen bg-raz-surface px-6 py-16"><div className="mx-auto h-[36rem] max-w-6xl animate-pulse rounded-[2rem] bg-white" /></main>;

  const campaign = campaigns[0];
  const orgName = lang === "en" ? (org.nameEn ?? org.name) : org.name;
  const orgBio = lang === "en" ? (org.bioEn ?? org.bio) : org.bio;
  if (!campaign) return <main className="min-h-screen bg-raz-surface px-6 py-16" dir={lang === "en" ? "ltr" : "rtl"}><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-10 text-center shadow-sm"><h1 className="text-3xl font-extrabold text-raz-dark">{orgName}</h1><p className="mt-4 text-slate-500">{lang === "en" ? "There are no active campaigns right now." : "אין כרגע קמפיינים פעילים בעמותה."}</p></div><BottomNav variant="donor" /></main>;

  return <main className="min-h-screen bg-white pb-24" dir={lang === "en" ? "ltr" : "rtl"}>
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <button type="button" onClick={() => router.back()} className="interactive-control group inline-flex min-h-11 items-center gap-2 rounded-full border border-raz-teal/20 bg-white px-4 text-sm font-bold text-raz-teal shadow-sm transition-all hover:-translate-y-0.5 hover:border-raz-teal hover:bg-raz-teal/5 hover:shadow-md" aria-label={lang === "en" ? "Back" : "חזרה"}>
        {lang === "en" ? <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5" /> : <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />}
        {lang === "en" ? "Back" : "חזרה"}
      </button>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_.95fr]" dir="ltr">
        <section dir={lang === "en" ? "ltr" : "rtl"} className="min-w-0">
          <p className="text-sm font-bold" style={{ color: org.color }}>{lang === "en" ? "About the nonprofit" : "על העמותה"}</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight text-raz-dark sm:text-5xl">{orgName}</h1>
          {orgBio && <p className="mt-5 max-w-2xl whitespace-pre-line text-base leading-8 text-slate-600">{orgBio}</p>}
          <OrganizationProfileTabs products={products} campaignId={campaign.id} campaignDonors={campaign.donors} organization={org} lang={lang} />
        </section>
        <aside className="min-w-0" dir={lang === "en" ? "ltr" : "rtl"}><PublicOrganizationHero organization={org} campaign={campaign} lang={lang} /></aside>
      </div>
    </div>
    <BottomNav variant="donor" />
  </main>;
}
