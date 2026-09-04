"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import PublicOrganizationHero from "@/components/organization/PublicOrganizationHero";
import OrganizationProfileTabs from "@/components/organization/OrganizationProfileTabs";
import { useLang } from "@/contexts/LanguageContext";
import { getProductsByIds, getPublicCampaignsByOrg, getOrgById, getPublicOrganizationCommunities, getPublicOrganizationDonations } from "@/lib/supabase/queries";

export default function OrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { lang } = useLang();
  const [org, setOrg] = useState<Awaited<ReturnType<typeof getOrgById>>>(null);
  const [campaigns, setCampaigns] = useState<Awaited<ReturnType<typeof getPublicCampaignsByOrg>>>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof getProductsByIds>>>([]);
  const [donations, setDonations] = useState<Awaited<ReturnType<typeof getPublicOrganizationDonations>>>([]);
  const [communities, setCommunities] = useState<Awaited<ReturnType<typeof getPublicOrganizationCommunities>>>([]);

  useEffect(() => {
    if (!id) return;
    void Promise.all([getOrgById(id), getPublicCampaignsByOrg(id), getPublicOrganizationDonations(id), getPublicOrganizationCommunities(id)]).then(async ([organization, organizationCampaigns, publicDonations, publicCommunities]) => {
      setOrg(organization);
      setCampaigns(organizationCampaigns);
      setDonations(publicDonations);
      setCommunities(publicCommunities);
      const productIds = organizationCampaigns[0]?.productIds.slice(0, 3) ?? [];
      if (productIds.length) setProducts(await getProductsByIds(productIds));
    });
  }, [id]);

  if (!org) return <main className="min-h-screen bg-raz-surface px-6 py-16"><div className="mx-auto h-[36rem] max-w-6xl animate-pulse rounded-[2rem] bg-white" /></main>;

  const campaign = campaigns[0];
  const orgName = lang === "en" ? (org.nameEn ?? org.name) : org.name;
  if (!campaign) return <main className="min-h-screen bg-raz-surface px-6 py-16" dir={lang === "en" ? "ltr" : "rtl"}><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-10 text-center shadow-sm"><h1 className="text-3xl font-extrabold text-raz-dark">{orgName}</h1><p className="mt-4 text-slate-500">{lang === "en" ? "There are no active campaigns right now." : "אין כרגע קמפיינים פעילים בעמותה."}</p></div><BottomNav variant="donor" /></main>;

  return <main className="min-h-screen bg-raz-surface pb-24" dir={lang === "en" ? "ltr" : "rtl"}>
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <button type="button" onClick={() => router.back()} className="interactive-control inline-flex min-h-11 items-center gap-2 text-sm font-bold text-raz-teal"><ArrowRight size={18} />{lang === "en" ? "Back" : "חזרה"}</button>
      <div className="mt-5"><PublicOrganizationHero organization={org} campaign={campaign} products={products} lang={lang} /></div>
      <OrganizationProfileTabs donations={donations} communities={communities} campaignStory={lang === "en" ? (campaign.storyEn ?? campaign.story) : campaign.story} organization={org} lang={lang} />
    </div>
    <BottomNav variant="donor" />
  </main>;
}
