"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, HeartHandshake, Landmark, PackagePlus, Plus, UsersRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import WizardShell from "@/components/wizard/WizardShell";
import OnboardingWelcome from "@/components/onboarding/OnboardingWelcome";
import PaymentProviderConnections from "@/components/profile/PaymentProviderConnections";
import CreateProductModal from "@/components/nonprofit-admin/CreateProductModal";

const STEP_COUNT = 5;
type CreatedProduct = { name: string; nameEn: string; price: number; emoji: string };

export default function NgoOnboardingFlow() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { lang } = useLang();
  const [step, setStep] = useState(0);
  const [terminalSaved, setTerminalSaved] = useState(false);
  const [productIntro, setProductIntro] = useState(true);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<CreatedProduct | null>(null);
  const isEnglish = lang === "en";

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
    if (!loading && profile && profile.app_role !== "ngo_owner") router.replace("/");
  }, [loading, profile, router, user]);

  const copy = isEnglish ? {
    welcomeTitle: "Welcome to Impactify", welcomeDescription: "Let’s prepare your organization to turn every donation into a clear, tangible unit of impact.", start: "Let’s begin",
    steps: [
      ["Verify your organization", "Review the organization identity created at signup and complete any missing profile details."],
      ["Connect payments", "Connect your own payment terminal so donations settle directly into your organization’s account."],
      ["Add impact products", "Show donors exactly what their contribution makes possible through clear, tangible products."],
      ["Connect communities", "Create a campaign, choose its products, and invite communities to help it grow."],
      ["Everything is ready", "Your workspace is ready for campaigns, donations, products, and community partnerships."],
    ],
  } : {
    welcomeTitle: "ברוכים הבאים ל־Impactify", welcomeDescription: "בואו נכין את העמותה שלכם כך שכל תרומה תהפוך ליחידת השפעה ברורה ומוחשית.", start: "בואו נתחיל",
    steps: [
      ["אימות עמותה", "בדקו את זהות העמותה שנוצרה בהרשמה והשלימו את פרטי הפרופיל החסרים."],
      ["חיבור סליקה", "חברו את מסוף הסליקה שלכם כדי שהתרומות יזוכו ישירות בחשבון העמותה."],
      ["הוספת מוצרים", "הראו לתורמים בדיוק מה התרומה מאפשרת באמצעות מוצרים ברורים ומוחשיים."],
      ["חיבור קהילות לקמפיין", "צרו קמפיין, בחרו את המוצרים שלו והזמינו קהילות לעזור לו לצמוח."],
      ["הכול מוכן!", "מרחב הניהול מוכן לקמפיינים, תרומות, מוצרים ושיתופי פעולה עם קהילות."],
    ],
  };
  const [title, description] = copy.steps[step];

  function next() {
    if (step === 2 && productIntro) { setProductIntro(false); setProductModalOpen(true); return; }
    setStep((current) => Math.min(current + 1, STEP_COUNT - 1));
  }

  function back() {
    if (step === 2 && !productIntro && !createdProduct) { setProductIntro(true); return; }
    setStep((current) => Math.max(current - 1, 0));
  }

  if (loading || !profile) return <div className="min-h-screen bg-raz-surface" />;

  const nextLabel = step === 2 && productIntro
    ? (isEnglish ? "Let’s create a product +" : "בואו ניצור מוצר +")
    : step === 3 ? (isEnglish ? "Finish setup" : "סיום ההקמה") : (isEnglish ? "Next step" : "שלב הבא");

  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-white">
      <OnboardingWelcome title={copy.welcomeTitle} description={copy.welcomeDescription} actionLabel={copy.start} />
      <WizardShell step={step} stepCount={STEP_COUNT} progressStepCount={4} immersive title={title} description={description} className="mx-auto"
        topActions={step === 2 || step === 3 ? <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#12c2b9]"><Eye size={18} />{isEnglish ? "Preview" : "תצוגה מקדימה"}</span> : null}
        footer={<><button type="button" onClick={back} disabled={step === 0 || step === STEP_COUNT - 1} className="onboarding-back-button inline-flex items-center text-[#12c2b9] disabled:invisible" aria-label={isEnglish ? "Back" : "חזרה"}><ArrowLeft size={30} /></button>{step === STEP_COUNT - 1 ? <button type="button" onClick={() => router.push("/nonprofit")} className="onboarding-primary-button">{isEnglish ? "Open dashboard" : "מעבר לדשבורד"}</button> : <button type="button" onClick={next} className={step === 2 || step === 3 ? "onboarding-primary-button" : "onboarding-outline-button"}>{nextLabel}</button>}</>}
      >
        {step === 0 && <section className="mx-auto max-w-xl space-y-6 pt-5 text-center"><Landmark className="mx-auto text-[#12c2b9]" size={52} strokeWidth={1.5} /><h2 className="text-3xl font-black text-[#202b36]">{isEnglish ? "Your organization identity" : "זהות העמותה שלכם"}</h2><p className="leading-7 text-slate-500">{isEnglish ? "The organization name was saved during signup. Add its registration number, logo, and contact details from the organization profile." : "שם העמותה נשמר בהרשמה. את מספר העמותה, הלוגו ופרטי הקשר משלימים בפרופיל העמותה."}</p><button type="button" onClick={() => router.push("/nonprofit/profile")} className="onboarding-outline-button">{isEnglish ? "Complete organization profile" : "השלמת פרופיל העמותה"}</button></section>}
        {step === 1 && <section className="space-y-4">{terminalSaved && <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700" role="status"><CheckCircle2 size={18} />{isEnglish ? "Payment setup saved." : "הגדרת הסליקה נשמרה."}</p>}<PaymentProviderConnections onConnectionSaved={() => setTerminalSaved(true)} /></section>}
        {step === 2 && productIntro && <ProductIntroduction isEnglish={isEnglish} />}
        {step === 2 && !productIntro && <section className="grid gap-6 sm:grid-cols-2"><button type="button" onClick={() => setProductModalOpen(true)} className="onboarding-card flex min-h-64 flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50 p-6"><Plus size={48} strokeWidth={1.2} /><span className="mt-3 font-bold">{isEnglish ? "Add a new product" : "הוספת מוצר חדש"}</span></button>{createdProduct && <article className="onboarding-card relative flex min-h-64 flex-col items-center overflow-hidden rounded-[20px] border border-slate-200 bg-white" data-selected="true"><span className="onboarding-select-mark absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#12c2b9] text-xl text-white">+</span><div className="flex h-36 w-full items-center justify-center bg-slate-100 text-6xl">{createdProduct.emoji || "💙"}</div><div className="p-5 text-center"><h3 className="font-bold text-[#202b36]">{isEnglish ? createdProduct.nameEn || createdProduct.name : createdProduct.name || createdProduct.nameEn}</h3><p className="mt-2 text-2xl font-black text-[#12c2b9]">₪{createdProduct.price.toLocaleString("he-IL")}</p></div></article>}</section>}
        {step === 3 && <section className="mx-auto max-w-xl pt-6 text-center"><UsersRound className="mx-auto text-[#12c2b9]" size={58} strokeWidth={1.45} /><h2 className="mt-5 text-3xl font-black text-[#202b36]">{isEnglish ? "A campaign brings everyone together" : "הקמפיין מחבר את כולם"}</h2><p className="mt-4 leading-7 text-slate-500">{isEnglish ? "Choose products and invite communities inside campaign creation, so every partnership stays connected to the right fundraising goal." : "ביצירת הקמפיין בוחרים מוצרים ומזמינים קהילות, כך שכל שותפות נשארת מחוברת ליעד הגיוס הנכון."}</p><button type="button" onClick={() => router.push("/nonprofit/create-campaign")} className="onboarding-primary-button mt-7"><UsersRound size={18} />{isEnglish ? "Create first campaign" : "יצירת קמפיין ראשון"}</button></section>}
        {step === 4 && <section className="py-12 text-center"><div className="text-7xl" aria-hidden="true">🎉</div><h2 className="mt-5 text-3xl font-black text-[#202b36]">{isEnglish ? "You’re ready to make an impact" : "מוכנים ליצור אימפקט"}</h2><p className="mx-auto mt-4 max-w-lg text-lg leading-8 text-slate-500">{isEnglish ? "Manage campaigns, donations, products, and communities from your organization dashboard." : "מעכשיו מנהלים קמפיינים, תרומות, מוצרים וקהילות מדשבורד העמותה."}</p><HeartHandshake className="mx-auto mt-8 text-[#12c2b9]" size={36} /></section>}
      </WizardShell>
      {productModalOpen && <CreateProductModal onClose={() => setProductModalOpen(false)} onCreated={(product) => { if (product) setCreatedProduct(product); setProductIntro(false); setProductModalOpen(false); }} />}
    </div>
  );
}

function ProductIntroduction({ isEnglish }: { isEnglish: boolean }) {
  return <section className="mx-auto max-w-2xl pt-4 text-center"><PackagePlus className="mx-auto text-[#12c2b9]" size={58} strokeWidth={1.4} /><h2 className="mt-5 text-3xl font-black text-[#202b36]">{isEnglish ? "What is an impact product?" : "מה זה בעצם ״מוצר״?"}</h2><div className="mt-7 grid gap-5 text-start sm:grid-cols-2"><article className="rounded-2xl bg-slate-50 p-6"><h3 className="font-black text-[#12c2b9]">{isEnglish ? "Why not just donate?" : "למה לא סתם תרומה?"}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{isEnglish ? "A concrete unit helps donors understand exactly what their money makes possible." : "יחידה מוחשית עוזרת לתורמים להבין בדיוק מה הכסף שלהם מאפשר."}</p></article><article className="rounded-2xl bg-slate-50 p-6"><h3 className="font-black text-[#12c2b9]">{isEnglish ? "Who sees it?" : "מי רואה את זה?"}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{isEnglish ? "Products appear in campaigns, where community members can fund a meal, school kit, or another clear outcome." : "המוצרים מופיעים בקמפיינים, וחברי קהילה יכולים לממן ארוחה, ערכה לבית ספר או תוצאה ברורה אחרת."}</p></article></div></section>;
}
