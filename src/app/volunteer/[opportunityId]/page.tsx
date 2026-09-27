"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { registerForVolunteerOpportunity } from "@/lib/supabase/queries-volunteers";
import type { Database } from "@/lib/supabase/types";

type Opportunity = Database["public"]["Tables"]["volunteer_opportunities"]["Row"];
export default function VolunteerOpportunityPage() {
  const params = useParams<{ opportunityId: string }>(); const router = useRouter(); const { user, profile, loading } = useAuth();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { void createClient().from("volunteer_opportunities").select("*").eq("id", params.opportunityId).eq("status", "active").maybeSingle().then(({ data, error: cause }) => { if (cause) setError(cause.message); else setOpportunity(data); }); }, [params.opportunityId]);
  async function register() { if (!user) { router.push(`/auth?next=${encodeURIComponent(`/volunteer/${params.opportunityId}`)}`); return; } if (!profile?.phone) { router.push("/auth/setup"); return; } setBusy(true); try { const result = await registerForVolunteerOpportunity(params.opportunityId); if (result?.calendar_url) window.location.assign(result.calendar_url); else router.push("/my-donations"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to register"); } finally { setBusy(false); } }
  if (!opportunity && !error) return <main className="mx-auto max-w-2xl p-8">טוען הזדמנות...</main>;
  if (!opportunity) return <main className="mx-auto max-w-2xl p-8">ההזדמנות אינה זמינה.</main>;
  return <main className="mx-auto max-w-2xl p-6 md:py-16"><article className="rounded-3xl bg-white p-7 shadow-sm"><p className="font-bold text-raz-teal">התנדבות</p><h1 className="mt-2 text-4xl font-bold text-raz-dark">{opportunity.title}</h1><p className="mt-5 whitespace-pre-wrap text-slate-600">{opportunity.description}</p><dl className="mt-6 grid gap-3 text-sm"><div><dt className="font-bold">מועד</dt><dd>{opportunity.starts_at ? new Date(opportunity.starts_at).toLocaleString("he-IL") : "ייקבע בהמשך"}</dd></div><div><dt className="font-bold">מקום</dt><dd>{opportunity.location ?? "ייקבע בהמשך"}</dd></div></dl>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}<button disabled={loading || busy} onClick={() => void register()} className="mt-7 min-h-12 rounded-xl bg-raz-teal px-6 font-bold text-white disabled:opacity-50">{busy ? "נרשם..." : "אני רוצה להתנדב"}</button></article></main>;
}
