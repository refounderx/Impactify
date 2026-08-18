"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { products, ORG_NAME, ORG_NAME_EN } from "@/lib/mock-data";
import { Check, ChevronLeft, Image as ImageIcon, Video, Users } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { lang, t } = useLang();
  const orgDisplayName = lang === "en" ? ORG_NAME_EN : ORG_NAME;
  const STEPS = lang === "en"
    ? ["Basics", "Story", "Media", "Products", "Communities", "Publish"]
    : ["בסיסי", "סיפור", "מדיה", "מוצרים", "קהילות", "פרסום"];
  const categories = lang === "en"
    ? ["Education", "Food", "Health", "Elderly", "Children", "Environment", "Other"]
    : ["חינוך", "מזון", "בריאות", "קשישים", "ילדים", "סביבה", "אחר"];
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: "",
    category: "",
    goal: "",
    endDate: "",
    shortDesc: "",
    story: "",
    selectedProducts: [] as string[],
  });

  function next() { setStep((s) => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      selectedProducts: f.selectedProducts.includes(id)
        ? f.selectedProducts.filter((p) => p !== id)
        : [...f.selectedProducts, id],
    }));
  }

  return (
    <div className="flex flex-col min-h-screen bg-raz-surface">
      

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={back} disabled={step === 0} className="text-gray-400 disabled:opacity-30">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-800 text-sm">{t("wizard.title")}</h1>
          <p className="text-xs text-gray-400">{orgDisplayName} · {t("wizard.step")} {step + 1} {t("wizard.of")} {STEPS.length}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex bg-white px-4 py-2 gap-1 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-shrink-0">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? "bg-raz-teal text-white"
                : i === step ? "bg-raz-teal/20 text-raz-teal border-2 border-raz-teal"
                : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-xs ${i === step ? "text-raz-teal font-medium" : "text-gray-400"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-3 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 px-4 py-4 pb-24">

        {/* Step 0: Basics */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-gray-700">פרטי קמפיין בסיסיים</h2>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">שם הקמפיין *</label>
              <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="שם הקמפיין בעברית" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-raz-teal text-right bg-white" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">קטגוריה</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button key={c} onClick={() => setForm({...form, category: c})}
                    className={`px-3 py-1.5 rounded-full text-sm ${form.category === c ? "bg-raz-teal text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">יעד גיוס (₪)</label>
                <input type="number" value={form.goal} onChange={(e) => setForm({...form, goal: e.target.value})}
                  placeholder="25000" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-raz-teal font-numeric text-right bg-white" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">תאריך סיום</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-raz-teal bg-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">תיאור קצר (עד 255 תווים)</label>
              <textarea value={form.shortDesc} onChange={(e) => setForm({...form, shortDesc: e.target.value.slice(0,255)})}
                placeholder="תיאור שיופיע ברשימת הקמפיינים..." rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-raz-teal text-right resize-none bg-white" />
              <p className="text-xs text-gray-400 mt-1 text-left">{form.shortDesc.length}/255</p>
            </div>
          </div>
        )}

        {/* Step 1: Story */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-gray-700">סיפור הקמפיין</h2>
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="flex gap-1 p-2 border-b border-gray-100 flex-wrap">
                {["B","I","H1","H2","🔗","📷"].map(t => (
                  <button key={t} className="px-2.5 py-1 rounded text-xs font-mono bg-gray-100 text-gray-600 hover:bg-gray-200">{t}</button>
                ))}
              </div>
              <textarea value={form.story} onChange={(e) => setForm({...form, story: e.target.value})}
                placeholder="ספר את הסיפור של הקמפיין שלך. למה זה חשוב? מה ישיג הכסף שייאסף?" rows={10}
                className="w-full p-3 text-sm outline-none text-right resize-none rounded-b-xl" />
            </div>
          </div>
        )}

        {/* Step 2: Media */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-gray-700">תמונות וסרטוני קמפיין</h2>
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
              <ImageIcon size={36} className="text-gray-300" />
              <p className="font-medium text-gray-600 text-sm">תמונת כותרת</p>
              <p className="text-xs text-gray-400">מומלץ 16:9 | JPG, PNG עד 5MB</p>
              <button className="bg-raz-teal text-white px-4 py-2 rounded-xl text-sm font-medium">העלה תמונה</button>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
              <Video size={22} className="text-raz-teal flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-1">קישור לסרטון</p>
                <input placeholder="YouTube / Vimeo URL" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-raz-teal text-left" dir="ltr" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Products */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-bold text-gray-700">בחר מוצרים לקמפיין</h2>
            <p className="text-xs text-gray-500">מוצרים מאפשרים לתורמים לראות את ההשפעה של תרומתם</p>
            {products.map((p) => (
              <div key={p.id} onClick={() => toggleProduct(p.id)}
                className={`bg-white rounded-2xl p-3 flex items-center gap-3 cursor-pointer border-2 transition-colors ${
                  form.selectedProducts.includes(p.id) ? "border-raz-teal" : "border-transparent"
                }`}
              >
                <span className="text-3xl">{p.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{lang === "en" ? (p.nameEn ?? p.name) : p.name}</p>
                  <p className="text-xs text-gray-500">{lang === "en" ? (p.descriptionEn ?? p.description) : p.description}</p>
                </div>
                <div className="text-end">
                  <p className="font-bold text-raz-teal text-sm font-numeric">₪{p.price}</p>
                  {form.selectedProducts.includes(p.id) && (
                    <span className="text-raz-teal"><Check size={16} /></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Communities */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-bold text-gray-700">הזמן קהילות ומשפיענים</h2>
            <p className="text-xs text-gray-500">בחר קהילות שיקדמו את הקמפיין שלך</p>
            {[
              { name: "קהילת רמת אביב", size: 450, niche: "חינוך ורווחה", past: 3 },
              { name: "קהילת גבעתיים", size: 310, niche: "חינוך", past: 1 },
              { name: "קהילה צעירה ת״א", size: 890, niche: "כלכלה שיתופית", past: 5 },
            ].map((c) => (
              <div key={c.name} className="bg-white rounded-2xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-raz-teal/10 rounded-full flex items-center justify-center">
                  <Users size={18} className="text-raz-teal" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.size} חברים · {c.niche}</p>
                  <p className="text-xs text-gray-400">{c.past} קמפיינים קודמים</p>
                </div>
                <button className="bg-raz-teal/10 text-raz-teal text-xs px-3 py-1.5 rounded-lg font-medium">הזמן</button>
              </div>
            ))}
          </div>
        )}

        {/* Step 5: Publish */}
        {step === 5 && (
          <div className="flex flex-col gap-4 items-center text-center py-4">
            <div className="w-16 h-16 bg-raz-teal/10 rounded-full flex items-center justify-center">
              <Check size={32} className="text-raz-teal" />
            </div>
            <h2 className="font-bold text-gray-700 text-lg">הקמפיין מוכן לפרסום!</h2>
            <p className="text-sm text-gray-500">הקמפיין יועלה לפלטפורמה ויהיה זמין לתרומות מיידית</p>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-right w-full">
              <div className="flex justify-between mb-2"><span className="text-gray-500">שם:</span><span className="font-medium">{form.title || "ארוחות חמות לקשישים"}</span></div>
              <div className="flex justify-between mb-2"><span className="text-gray-500">יעד:</span><span className="font-medium font-numeric">₪{form.goal || "25,000"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">מוצרים:</span><span className="font-medium">{form.selectedProducts.length}</span></div>
            </div>
            <button onClick={() => router.push("/nonprofit")}
              className="w-full bg-raz-teal text-white py-4 rounded-xl font-bold text-base">
              {t("wizard.publish")}
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      {step < STEPS.length - 1 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
          <button onClick={next} className="w-full bg-raz-teal text-white py-3.5 rounded-xl font-bold">
            {t("wizard.next")} — {STEPS[step + 1]}
          </button>
        </div>
      )}
    </div>
  );
}
