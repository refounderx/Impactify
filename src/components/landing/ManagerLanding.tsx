"use client";

import Link from "next/link";
import { ArrowLeft, Check, Heart, LogIn, Sparkles, UsersRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";

type ManagerKind = "community" | "ngo";

type LandingContent = {
  badge: string;
  heroTitle: string;
  heroAccent: string;
  heroEnding: string;
  heroBody: string;
  primaryAction: string;
  proof: string;
  featureTitle: string;
  featureBody: string;
  featureItems: { title: string; body: string }[];
  mockTitle: string;
  mockDescription: string;
  mockAmount: string;
  comparisonTitle: string;
  comparison: { solution: string; today: string }[];
  steps: { title: string; body: string }[];
  finalTitle: string;
  finalBody: string;
};

const content: Record<ManagerKind, LandingContent> = {
  community: {
    badge: "למנהלי ומנהלות קהילות",
    heroTitle: "אל תרדפו אחרי לייקים.",
    heroAccent: "תייצרו אימפקט",
    heroEnding: "שמעיר את הקהילה.",
    heroBody: "מקהילה וירטואלית לשבט שמשנה מציאות. Impactify עוזרת לכם להזניק מעורבות ולרתום את הקהילה למטרה משותפת.",
    primaryAction: "כניסה למערכת מנהלי הקהילות",
    proof: "ללא עלות הקמה • מותאם לנייד • מתחילים תוך דקות",
    featureTitle: "תרומה בבית, לא בחוץ",
    featureBody: "למה לשלוח את חברי הקהילה לאתרים גנריים? Impactify מייצרת עבורכם דף תרומה המעוצב בשפה של הקהילה שלכם.",
    featureItems: [
      { title: "סרגל התקדמות חי", body: "מייצר מתח חיובי וגאוות יחידה סביב השגת היעד." },
      { title: "קמפיין מבוסס מוצרים", body: "בחירת מטרות מוחשיות כמו ארוחה חמה או מארז ציוד, ממש כמו באפליקציה." },
    ],
    mockTitle: "ארוחה חמה",
    mockDescription: "ארוחה מזינה ומחממת לאדם אחד ליום",
    mockAmount: "50₪",
    comparisonTitle: "למה מנהלי קהילות מובילים עוברים אלינו?",
    comparison: [
      { solution: "מנוע תוכן חי ומותח (גיימיפיקציה)", today: "תלות בפוסטים שגרתיים ליצירת שיח" },
      { solution: "שילוב חכם של ספונסרים ערכיים", today: "קושי למסחר את הקבוצה מבלי לפגוע באמון" },
      { solution: "גאוות יחידה ושגרירים פעילים", today: "חברים פסיביים שרק קוראים או עושים לייק" },
      { solution: "דף תרומה ממותג בשפה שלכם", today: "הפניה ללינקים חיצוניים של עמותות" },
    ],
    steps: [
      { title: "בוחרים יעד", body: "מתחברים למערכת ובוחרים פרויקט חברתי או עמותה שמתאימים ל-DNA של הקבוצה שלכם." },
      { title: "ממתגים אישית", body: "המערכת מייצרת אוטומטית דף נחיתה לקמפיין. תוכלו להוסיף לוגו, טקסט אישי ואת הצבעים המזוהים עם הקהילה." },
      { title: "מזניקים שיח", body: "מפיצים את הלינק בקהילה, עוקבים אחרי סרגל ההתקדמות בזמן אמת ורואים את המעורבות והגאווה מזנקות." },
    ],
    finalTitle: "הקהילה שלכם יכולה להזיז הרים.",
    finalBody: "הגיע הזמן שכולם יראו את זה. הצטרפו לעשרות מנהלי קהילות שכבר מובילים שינוי עם Impactify.",
  },
  ngo: {
    badge: "למנהלי ומנהלות עמותות",
    heroTitle: "אל תבקשו רק תרומה.",
    heroAccent: "תנו לאנשים",
    heroEnding: "להרגיש את ההשפעה.",
    heroBody: "Impactify הופכת את העשייה של העמותה למטרות מוחשיות, לקמפיינים מחוברים ולחוויית תרומה שאנשים רוצים לחזור אליה.",
    primaryAction: "כניסה למערכת מנהלי העמותות",
    proof: "ללא עלות הקמה • מותאם לנייד • מתחילים תוך דקות",
    featureTitle: "העשייה שלכם, בצורה שאפשר להבין ולבחור",
    featureBody: "במקום עמוד תרומות כללי, בונים חוויית תרומה שמספרת מה כל סכום מאפשר — ומחברת אנשים לעבודה שלכם.",
    featureItems: [
      { title: "מוצרי תרומה ברורים", body: "ממפים את הפעילות למטרות שאפשר לראות, להבין ולתמוך בהן." },
      { title: "קמפיינים עם סיפור", body: "יוצרים עמודים שמרכזים את היעד, ההתקדמות והקשר עם התורמים." },
    ],
    mockTitle: "ערכת חזרה לבית הספר",
    mockDescription: "ילקוט וציוד לימודי לילד או ילדה",
    mockAmount: "180₪",
    comparisonTitle: "למה עמותות בוחרות לנהל את התרומות ב-Impactify?",
    comparison: [
      { solution: "מטרות מוחשיות שקל לבחור", today: "עמוד תרומות כללי בלי חיבור ברור להשפעה" },
      { solution: "קמפיינים ממותגים לכל יעד", today: "מסרים אחידים שלא מדברים לכל קהל" },
      { solution: "עדכוני התקדמות שמחזקים אמון", today: "קושי לשמור על קשר אחרי התרומה" },
      { solution: "חיבור מובנה לקהילות תומכות", today: "גיוס קהלים חדשים מתחיל בכל פעם מחדש" },
    ],
    steps: [
      { title: "מגדירים את ההשפעה", body: "מתרגמים את הפעילות שלכם למוצרי תרומה ויעדים ברורים." },
      { title: "בונים קמפיין", body: "מוסיפים את הסיפור, התמונה והמיתוג של העמותה." },
      { title: "מגייסים ומעדכנים", body: "משתפים, עוקבים אחרי ההתקדמות ומחזקים את הקשר עם התורמים." },
    ],
    finalTitle: "העשייה שלכם כבר משנה חיים.",
    finalBody: "עכשיו קל יותר להזמין אנשים להיות חלק ממנה.",
  },
};

export default function ManagerLanding({ kind }: { kind: ManagerKind }) {
  const { lang, setLang } = useLang();
  const { profile } = useAuth();
  const page = content[kind];
  const managerRole = kind === "community" ? "community_owner" : "ngo_owner";
  const dashboardHref = kind === "community" ? "/community" : "/nonprofit";
  const entryHref = profile?.app_role === managerRole ? dashboardHref : "/auth";
  const roleName = kind === "community" ? "קהילה" : "עמותה";

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8fafc] pb-8 text-right text-[#131a29]">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 shadow-sm backdrop-blur md:px-10">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm font-bold text-slate-500 hover:text-raz-teal">לתורמים</Link>
          <div className="flex rounded-full bg-slate-100 p-1 text-xs font-bold">
            <button type="button" onClick={() => setLang("en")} className={`rounded-full px-3 py-1 ${lang === "en" ? "bg-raz-teal text-white" : "text-slate-500"}`}>EN</button>
            <button type="button" onClick={() => setLang("he")} className={`rounded-full px-3 py-1 ${lang === "he" ? "bg-raz-teal text-white" : "text-slate-500"}`}>עב</button>
          </div>
        </div>
        <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-raz-teal" aria-label="Impactify home">
          <span>Impactify</span><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-raz-teal text-white"><Heart size={17} fill="currentColor" /></span>
        </Link>
        <Link href={entryHref} className="interactive-control inline-flex items-center gap-2 rounded-full border border-raz-teal px-4 py-2 text-sm font-bold text-raz-teal hover:bg-teal-50">
          <LogIn size={16} />{profile?.app_role === managerRole ? "למערכת" : "התחברות"}
        </Link>
      </nav>

      <section className="relative px-5 pb-20 pt-16 text-center md:pb-24 md:pt-24">
        <div className="absolute -right-20 top-8 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" /><div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-raz-teal"><UsersRound size={16} />{page.badge}</p>
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">{page.heroTitle}<br /><span className="text-raz-teal">{page.heroAccent}</span> {page.heroEnding}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-600 md:text-xl">{page.heroBody}</p>
          <Link href={entryHref} className="interactive-control mt-9 inline-flex min-h-14 items-center gap-2 rounded-full bg-raz-teal px-8 py-3 text-lg font-bold text-white shadow-lg shadow-teal-700/20 hover:bg-raz-teal-dark"><Sparkles size={20} />{page.primaryAction}<ArrowLeft size={19} /></Link>
          <p className="mt-4 text-sm font-medium text-slate-500">{page.proof}</p>
        </div>
      </section>

      <section className="px-5 pb-16"><div className="mx-auto grid max-w-5xl items-center gap-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:grid-cols-2 md:p-10">
        <div><h2 className="text-3xl font-extrabold">{page.featureTitle}</h2><p className="mt-4 text-lg leading-relaxed text-slate-600">{page.featureBody}</p><ul className="mt-7 space-y-5">{page.featureItems.map((item) => <li key={item.title} className="flex gap-3"><span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-raz-teal"><Check size={17} strokeWidth={3} /></span><span><strong className="block text-lg">{item.title}</strong><span className="text-slate-500">{item.body}</span></span></li>)}</ul></div>
        <div className="relative mx-auto w-full max-w-sm rounded-[2rem] border-8 border-white bg-slate-50 p-4 shadow-xl"><div className="rounded-3xl border border-slate-100 bg-white p-6"><p className="text-center text-2xl font-extrabold">{page.mockTitle}</p><p className="mt-1 text-center text-sm text-slate-500">{page.mockDescription}</p><p className="my-5 text-center text-4xl font-extrabold">{page.mockAmount}</p><div className="rounded-2xl bg-teal-50 p-4"><div className="flex items-center justify-between text-sm"><span className="font-bold text-raz-teal">75%</span><span className="font-bold">מתקדמים אל היעד</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full w-3/4 rounded-full bg-raz-teal" /></div></div><div className="mt-5 rounded-2xl bg-raz-teal py-3 text-center font-bold text-white">בחירה בהשפעה</div></div><div className="absolute -bottom-5 -left-5 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm shadow-lg"><span className="ml-2">🎉</span><strong>הרגע הצטרף תורם חדש</strong></div></div>
      </div></section>

      <section className="border-y border-slate-100 bg-white px-5 py-16"><div className="mx-auto max-w-4xl"><h2 className="mb-10 text-center text-3xl font-extrabold">{page.comparisonTitle}</h2><div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-right"><thead><tr className="border-b-2 border-slate-200"><th className="w-1/2 px-4 py-4 text-xl text-raz-teal">הפתרון עם Impactify</th><th className="w-1/2 px-4 py-4 text-xl text-slate-400">המצב היום</th></tr></thead><tbody>{page.comparison.map((row) => <tr key={row.solution} className="border-b border-slate-100 last:border-0"><td className="px-4 py-5 font-bold"><span className="ml-2 inline-flex text-raz-teal"><Check size={20} strokeWidth={3} /></span>{row.solution}</td><td className="px-4 py-5 text-slate-500">{row.today}</td></tr>)}</tbody></table></div></div></section>

      <section className="px-5 py-20"><div className="mx-auto max-w-5xl"><h2 className="mb-12 text-center text-3xl font-extrabold">איך זה עובד? בשלושה צעדים פשוטים</h2><div className="grid gap-7 md:grid-cols-3">{page.steps.map((step, index) => <article key={step.title} className="rounded-[1.75rem] border border-slate-100 bg-white p-7 text-center shadow-lg shadow-slate-200/50"><span className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-extrabold text-white ${index === 1 ? "bg-raz-teal" : index === 2 ? "bg-sky-500" : "bg-[#131a29]"}`}>{index + 1}</span><h3 className="text-xl font-extrabold">{step.title}</h3><p className="mt-3 leading-relaxed text-slate-500">{step.body}</p></article>)}</div></div></section>

      <section className="mx-auto max-w-6xl rounded-t-[2.5rem] bg-[#131a29] px-6 py-16 text-center text-white"><h2 className="text-3xl font-extrabold md:text-5xl">{page.finalTitle}</h2><p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">{page.finalBody}</p><Link href={entryHref} className="interactive-control mt-9 inline-flex items-center gap-2 rounded-full bg-raz-teal px-8 py-4 text-lg font-bold shadow-lg shadow-teal-400/20">{page.primaryAction}<ArrowLeft size={19} /></Link><p className="mt-5 text-sm text-slate-400">כאן כדי להפוך את העשייה של ה{roleName} להשפעה שמרגישים.</p></section>
    </main>
  );
}
