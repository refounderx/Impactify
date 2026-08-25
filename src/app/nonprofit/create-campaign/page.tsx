"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCommunities } from "@/lib/supabase/queries";
import { getNgoAdminData } from "@/lib/supabase/queries-ngo-admin";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Product } from "@/lib/supabase/types";
import { Check, ChevronLeft, PackagePlus, Users } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import EditableText from "@/components/admin/EditableText";
import CampaignStoryEditor from "@/components/campaign/CampaignStoryEditor";
import CampaignMediaStep from "@/components/campaign/CampaignMediaStep";
import { uploadCampaignImage, validateCampaignVideoUrl } from "@/lib/campaign-media";
import Link from "next/link";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { lang } = useLang();
  const { profile } = useAuth();
  const orgDisplayName = lang === "en" ? (profile?.full_name_en ?? profile?.full_name ?? "") : (profile?.full_name ?? "");
  const [products, setProducts] = useState<Product[]>([]);
  const [communities, setCommunities] = useState<Awaited<ReturnType<typeof getCommunities>>>([]);
  const [publishError, setPublishError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [image, setImage] = useState<File | null>(null);
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
    videoUrl: "",
    selectedProducts: [] as string[],
  });

  useEffect(() => {
    getNgoAdminData().then((result) => setProducts(result.products)).catch((error: unknown) => {
      setPublishError(error instanceof Error ? error.message : "Unable to load NGO products");
    });
    getCommunities().then(setCommunities);
  }, []);

  async function publishCampaign() {
    setPublishError("");
    const goal = Number(form.goal);
    if (!form.title.trim() || !form.category || !goal || goal <= 0) {
      setPublishError(lang === "en" ? "Title, category and a positive goal are required." : "נדרשים שם, קטגוריה ויעד חיובי.");
      return;
    }
    const videoUrl = validateCampaignVideoUrl(form.videoUrl);
    if (form.videoUrl.trim() && !videoUrl) {
      setPublishError(lang === "en" ? "Enter a valid HTTPS video URL." : "יש להזין קישור HTTPS תקין לסרטון.");
      setStep(2);
      return;
    }
    if (image && !profile?.org_id) {
      setPublishError(lang === "en" ? "Your organization profile is not ready for uploads." : "פרופיל העמותה עדיין לא מוכן להעלאת קבצים.");
      return;
    }
    setPublishing(true);
    const sb = createClient();
    let uploadedImage: Awaited<ReturnType<typeof uploadCampaignImage>> | null = null;
    try {
      if (image && profile?.org_id) uploadedImage = await uploadCampaignImage(sb, image, profile.org_id);
    } catch (uploadError) {
      setPublishError(uploadError instanceof Error ? uploadError.message : (lang === "en" ? "Unable to upload the image." : "לא ניתן להעלות את התמונה."));
      setPublishing(false);
      setStep(2);
      return;
    }
    const { data: campaignId, error } = await sb.rpc("publish_campaign", {
      p_title: form.title.trim(), p_short_desc: form.shortDesc.trim(), p_story: form.story.trim(),
      p_category: form.category, p_goal: goal, p_end_date: form.endDate || null,
      p_product_ids: form.selectedProducts,
      p_hero_image_url: uploadedImage?.publicUrl ?? null,
      p_video_url: videoUrl,
    });
    if (error) {
      if (uploadedImage) await sb.storage.from("campaign-media").remove([uploadedImage.path]);
      setPublishError(error.message);
      setPublishing(false);
      return;
    }
    router.push(campaignId ? `/campaign/${campaignId}` : "/nonprofit");
  }

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
          <EditableText tKey="wizard.title" as="h1" className="font-bold text-gray-800 text-sm" />
          <p className="text-xs text-gray-400">{orgDisplayName} · <EditableText tKey="wizard.step" /> {step + 1} <EditableText tKey="wizard.of" /> {STEPS.length}</p>
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
            <CampaignStoryEditor
              value={form.story}
              onChange={(story) => setForm((current) => ({ ...current, story }))}
              placeholder="ספר את הסיפור של הקמפיין שלך. למה זה חשוב? מה ישיג הכסף שייאסף?"
            />
          </div>
        )}

        {/* Step 2: Media */}
        {step === 2 && (
          <CampaignMediaStep
            image={image}
            onImageChange={setImage}
            videoUrl={form.videoUrl}
            onVideoUrlChange={(videoUrl) => setForm((current) => ({ ...current, videoUrl }))}
            lang={lang}
          />
        )}

        {/* Step 3: Products */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-bold text-gray-700">בחר מוצרים לקמפיין</h2>
            <p className="text-xs text-gray-500">מוצרים מאפשרים לתורמים לראות את ההשפעה של תרומתם</p>
            {products.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-6 text-center">
                <PackagePlus size={32} className="text-raz-teal mx-auto mb-3" />
                <p className="font-bold text-gray-700 mb-1">{lang === "en" ? "No products yet" : "עדיין אין מוצרים"}</p>
                <p className="text-xs text-gray-500 mb-4">{lang === "en" ? "Create a product, then return to add it to this campaign." : "צרו מוצר ולאחר מכן חזרו כדי להוסיף אותו לקמפיין."}</p>
                <Link href="/nonprofit/products" className="inline-flex bg-raz-teal text-white px-4 py-2 rounded-xl text-sm font-bold">
                  {lang === "en" ? "Create products" : "יצירת מוצרים"}
                </Link>
              </div>
            )}
            {products.map((p) => (
              <div key={p.id} onClick={() => toggleProduct(p.id)}
                className={`bg-white rounded-2xl p-3 flex items-center gap-3 cursor-pointer border-2 transition-colors ${
                  form.selectedProducts.includes(p.id) ? "border-raz-teal" : "border-transparent"
                }`}
              >
                <span className="text-3xl">{p.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{lang === "en" ? (p.name_en ?? p.name) : p.name}</p>
                  <p className="text-xs text-gray-500">{lang === "en" ? (p.description_en ?? p.description) : p.description}</p>
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
            {communities.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-raz-teal/10 rounded-full flex items-center justify-center">
                  <Users size={18} className="text-raz-teal" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{lang === "en" ? (c.name_en ?? c.name) : c.name}</p>
                  <p className="text-xs text-gray-500">{c.donors_count} חברים</p>
                  <p className="text-xs text-gray-400">{c.description ?? ""}</p>
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
            {publishError && <p className="w-full text-sm text-red-600" role="alert">{publishError}</p>}
            <button onClick={publishCampaign} disabled={publishing}
              className="w-full bg-raz-teal text-white py-4 rounded-xl font-bold text-base disabled:opacity-50">
              {publishing ? (lang === "en" ? "Publishing…" : "מפרסם…") : <EditableText tKey="wizard.publish" />}
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      {step < STEPS.length - 1 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
          <button onClick={next} className="w-full bg-raz-teal text-white py-3.5 rounded-xl font-bold">
            <EditableText tKey="wizard.next" /> — {STEPS[step + 1]}
          </button>
        </div>
      )}
    </div>
  );
}
