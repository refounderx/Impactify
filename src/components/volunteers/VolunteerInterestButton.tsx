"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function VolunteerInterestButton({ campaignId, orgId, communityId }: { campaignId?: string; orgId?: string; communityId?: string }) {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => { let active = true; let query = createClient().from("volunteer_opportunities").select("id").eq("status", "active").limit(1); if (campaignId) query = query.eq("campaign_id", campaignId); else if (communityId) query = query.eq("community_id", communityId); else if (orgId) query = query.eq("org_id", orgId); void query.maybeSingle().then(({ data }) => { if (active) setId(data?.id ?? null); }); return () => { active = false; }; }, [campaignId, communityId, orgId]);
  if (!id) return null;
  return <Link href={`/volunteer/${id}`} className="rounded-full bg-white px-6 py-3 text-sm font-bold text-raz-teal shadow-sm transition-transform hover:-translate-y-0.5">אני רוצה להתנדב</Link>;
}
