"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, HeartHandshake, Search, Send, UsersRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import WizardShell from "@/components/wizard/WizardShell";
import OnboardingWelcome from "@/components/onboarding/OnboardingWelcome";
import { getCampaigns } from "@/lib/supabase/queries";
import { getCommunityCampaignStatuses, setCommunityCampaign } from "@/lib/supabase/queries-community-admin";

const STEP_COUNT = 5;

export default function CommunityOnboardingFlow() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { lang } = useLang();
  const [step, setStep] = useState(0);
  const [campaigns, setCampaigns] = useState<Awaited<ReturnType<typeof getCampaigns>>>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestedCampaign, setRequestedCampaign] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isEnglish = lang === "en";

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
    if (!loading && profile && profile.app_role !== "community_owner") router.replace("/");
  }, [loading, profile, router, user]);

  useEffect(() => {
    let active = true;
    Promise.all([getCampaigns(), getCommunityCampaignStatuses()]).then(([items, statuses]) => {
      if (active) setCampaigns(items.filter((item) => !["active", "paused"].includes(statuses[item.id] ?? "")));
    }).catch(() => {
      if (active) setError(isEnglish ? "Campaigns could not be loaded." : "לא ניתן לטעון קמפיינים.");
    }).finally(() => { if (active) setCampaignsLoading(false); });
    return () => { active = false; };
  }, [isEnglish]);

  const copy = isEnglish ? {
    welcomeTitle: "Welcome to Impactify", welcomeDescription: "Let’s connect your community with a cause its members will be proud to advance together.", start: "Let’s begin",
    steps: [
      ["Your community is ready", "Review the community space created at signup and prepare it for its first partnership."],
      ["Choose a campaign", "Select one active campaign that fits your members. Nothing is sent until you confirm."],
      ["Request sent for approval", "The nonprofit reviews the request before its campaign becomes active for your community."],
      ["Mobilize your members", "Once approved, share the campaign and follow attributed donations from your workspace."],
      ["Everything is ready", "Your community dashboard keeps partnerships, campaigns, and donation activity together."],
    ],
  } : {
    welcomeTitle: "ברוכים הבאים ל־Impactify", welcomeDescription: "בואו נחבר את הקהילה שלכם למטרה שהחברים ישמחו לקדם יחד.", start: "בואו נתחיל",
    steps: [
      ["הקהילה שלכם מוכנה", "בדקו את מרחב הקהילה שנוצר בהרשמה והכינו אותו לשותפות הראשונה."],
      ["בחירת קמפיין", "בחרו קמפיין פעיל שמתאים לחברים. דבר לא נשלח לפני האישור שלכם."],
      ["הבקשה נשלחה לאישור", "העמותה בודקת את הבקשה לפני שהקמפיין הופך לפעיל עבור הקהילה."],
      ["רתימת חברי הקהילה", "לאחר האישור משתפים את הקמפיין ועוקבים אחר התרומות המשויכות במרחב הניהול."],
      ["הכול מוכן!", "בדשבורד הקהילה מרוכזים שותפויות, קמפיינים ופעילות התרומות."],
    ],
  };
  const [title, description] = copy.steps[step];
  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedId);

  async function advance() {
    if (step !== 1) { setStep((current) => Math.min(current + 1, STEP_COUNT - 1)); return; }
    if (!selectedCampaign) return;
    const name = (isEnglish ? selectedCampaign.titleEn : selectedCampaign.title) ?? selectedCampaign.title ?? selectedCampaign.titleEn ?? "";
    setRequesting(true); setError("");
    try {
      await setCommunityCampaign(selectedCampaign.id, "request");
      setRequestedCampaign(name);
      setStep(2);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (isEnglish ? "The request could not be sent." : "לא ניתן לשלוח את הבקשה."));
    } finally { setRequesting(false); }
  }

  if (loading || !profile) return <div className="min-h-screen bg-raz-surface" />;

  const actionLabel = step === 1 ? (requesting ? (isEnglish ? "Sending…" : "שולח…") : (isEnglish ? "Send join request" : "שליחת בקשת הצטרפות"))
    : step === 3 ? (isEnglish ? "Finish setup" : "סיום ההקמה") : (isEnglish ? "Next step" : "שלב הבא");

  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-white">
      <OnboardingWelcome title={copy.welcomeTitle} description={copy.welcomeDescription} actionLabel={copy.start} />
      <WizardShell step={step} stepCount={STEP_COUNT} progressStepCount={4} immersive title={title} description={description} className="mx-auto"
        topActions={step === 1 ? <span className={`inline-flex items-center gap-1.5 text-sm font-bold transition-opacity ${selectedId ? "text-[#12c2b9] opacity-100" : "opacity-0"}`}><Eye size={18} />{isEnglish ? "Selection ready" : "הבחירה מוכנה"}</span> : null}
        footer={<><button type="button" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0 || step === STEP_COUNT - 1 || requesting} className="onboarding-back-button inline-flex items-center text-[#12c2b9] disabled:invisible" aria-label={isEnglish ? "Back" : "חזרה"}><ArrowLeft size={30} /></button>{step === STEP_COUNT - 1 ? <button type="button" onClick={() => router.push("/community")} className="onboarding-primary-button">{isEnglish ? "Open dashboard" : "מעבר לדשבורד"}</button> : <button type="button" onClick={() => void advance()} disabled={step === 1 && (!selectedId || requesting)} className={step === 1 || step === 3 ? "onboarding-primary-button disabled:cursor-not-allowed disabled:opacity-40" : "onboarding-outline-button"}>{step === 1 && <Send size={17} />}{actionLabel}</button>}</>}
      >
        {step === 0 && <section className="mx-auto max-w-xl pt-8 text-center"><UsersRound className="mx-auto text-[#12c2b9]" size={62} strokeWidth={1.4} /><h2 className="mt-6 text-3xl font-black text-[#202b36]">{isEnglish ? "A home for shared impact" : "בית להשפעה משותפת"}</h2><p className="mt-4 leading-7 text-slate-500">{isEnglish ? "Your community is registered. The first activation milestone is choosing one campaign your members can rally around." : "הקהילה רשומה. נקודת ההפעלה הראשונה היא בחירת קמפיין אחד שהחברים יכולים להתגייס סביבו."}</p></section>}

        {step === 1 && <section><h2 className="mb-6 text-center font-bold text-[#202b36]">{isEnglish ? "Campaigns available to your community" : "קמפיינים זמינים לקהילה שלכם"}</h2>{error && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}{campaignsLoading ? <div className="h-64 animate-pulse rounded-[20px] bg-slate-100" /> : campaigns.length === 0 ? <div className="rounded-[20px] bg-slate-50 p-8 text-center text-slate-500">{isEnglish ? "No available campaigns are listed yet." : "עדיין אין קמפיינים זמינים."}</div> : <div className="grid gap-6 sm:grid-cols-2">{campaigns.slice(0, 4).map((campaign) => { const selected = campaign.id === selectedId; const name = (isEnglish ? campaign.titleEn : campaign.title) ?? campaign.title ?? campaign.titleEn ?? ""; return <button key={campaign.id} type="button" aria-pressed={selected} onClick={() => setSelectedId(selected ? null : campaign.id)} className="onboarding-card relative min-h-64 overflow-hidden rounded-[20px] border border-slate-200 bg-white text-center"><span className="onboarding-select-mark absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#12c2b9] text-xl text-white">+</span><span className="flex h-36 w-full items-center justify-center bg-slate-100 text-6xl">{campaign.emoji || "💙"}</span><span className="block p-5"><strong className="block text-[#202b36]">{name}</strong><span className="mt-2 block text-sm text-slate-500">{campaign.category}</span></span></button>; })}</div>}<button type="button" onClick={() => router.push("/community/campaigns/search")} className="mt-6 font-bold text-[#12c2b9]">{isEnglish ? "Show more campaigns" : "הצגת קמפיינים נוספים"} ↓</button></section>}

        {step === 2 && <section className="mx-auto max-w-xl pt-8 text-center"><CheckCircle2 className="mx-auto text-[#12c2b9]" size={62} strokeWidth={1.35} /><h2 className="mt-6 text-3xl font-black text-[#202b36]">{requestedCampaign ? `${isEnglish ? "Request sent to" : "הבקשה נשלחה אל"} ${requestedCampaign}` : (isEnglish ? "Nonprofit approval is next" : "עכשיו ממתינים לאישור העמותה")}</h2><p className="mt-4 leading-7 text-slate-500">{isEnglish ? "Only approved partnerships can appear in the community dashboard and receive attributed donations." : "רק שותפות מאושרת מופיעה בדשבורד הקהילה ויכולה לקבל תרומות משויכות."}</p></section>}

        {step === 3 && <section className="mx-auto max-w-xl pt-8 text-center"><Search className="mx-auto text-[#12c2b9]" size={58} strokeWidth={1.45} /><h2 className="mt-6 text-3xl font-black text-[#202b36]">{isEnglish ? "Keep the momentum visible" : "שומרים את התנופה גלויה"}</h2><p className="mt-4 leading-7 text-slate-500">{isEnglish ? "When approval arrives, share the campaign with members and follow donations, totals, and campaign status from one place." : "כשהאישור מתקבל, משתפים את הקמפיין עם החברים ועוקבים במקום אחד אחר תרומות, סכומים ומצב הקמפיין."}</p></section>}

        {step === 4 && <section className="py-12 text-center"><div className="text-7xl" aria-hidden="true">🎉</div><h2 className="mt-5 text-3xl font-black text-[#202b36]">{isEnglish ? "Ready to mobilize your community" : "מוכנים לרתום את הקהילה"}</h2><p className="mx-auto mt-4 max-w-lg text-lg leading-8 text-slate-500">{isEnglish ? "Your community workspace is ready for its first approved partnership." : "מרחב הקהילה מוכן לשותפות המאושרת הראשונה."}</p><HeartHandshake className="mx-auto mt-8 text-[#12c2b9]" size={36} /></section>}
      </WizardShell>
    </div>
  );
}
