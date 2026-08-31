"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import WizardShell from "@/components/wizard/WizardShell";
import { uploadCampaignImage, validateCampaignVideoUrl } from "@/lib/campaign-media";
import Link from "next/link";

export default function CreateCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("edit");
  const isEditing = Boolean(campaignId);
  const { lang } = useLang();
  const { profile } = useAuth();
  const orgDisplayName = lang === "en" ? (profile?.full_name_en ?? profile?.full_name ?? "") : (profile?.full_name ?? "");
  const [products, setProducts] = useState<Product[]>([]);
  const [communities, setCommunities] = useState<Awaited<ReturnType<typeof getCommunities>>>([]);
  const [publishError, setPublishError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loadingCampaign, setLoadingCampaign] = useState(isEditing);
  const [publishing, setPublishing] = useState(false);
  const [persistedCampaignId, setPersistedCampaignId] = useState<string | null>(null);
  const [selectedCommunityIds, setSelectedCommunityIds] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const STEPS = lang === "en"
    ? ["Basics", "Story", "Media", "Products", "Communities", isEditing ? "Save" : "Publish"]
    : ["פרטים בסיסיים", "סיפור", "מדיה", "מוצרים", "קהילות", isEditing ? "שמירה" : "פרסום"];
  const STEP_DETAILS = lang === "en" ? [
    ["Give your campaign a clear start", "Set the campaign name, category, fundraising goal, date, and short description."],
    ["Tell the campaign story", "Explain why this campaign matters and what the donations will make possible."],
    ["Add image and video", "Choose the media that will introduce the campaign to potential donors."],
    ["Choose campaign products", "Connect tangible giving options so donors can understand their impact."],
    ["Invite communities", "Select communities and partners that can help the campaign reach more people."],
    isEditing
      ? ["Review and save", "Confirm the updated campaign details before saving your changes."]
      : ["Review and publish", "Confirm the campaign details before making it available for donations."],
  ] : [
    ["תנו לקמפיין התחלה ברורה", "הגדירו שם, קטגוריה, יעד גיוס, תאריך ותיאור קצר לקמפיין."],
    ["ספרו את סיפור הקמפיין", "הסבירו למה הקמפיין חשוב ומה התרומות יאפשרו לכם להשיג."],
    ["הוסיפו תמונה וסרטון", "בחרו את המדיה שתציג את הקמפיין בפני תורמים פוטנציאליים."],
    ["בחרו מוצרים לקמפיין", "חברו אפשרויות תרומה מוחשיות שיעזרו לתורמים להבין את ההשפעה."],
    ["הזמינו קהילות", "בחרו קהילות ושותפים שיוכלו לעזור לקמפיין להגיע לקהל רחב יותר."],
    isEditing
      ? ["בדקו ושמרו", "עברו על פרטי הקמפיין המעודכנים לפני שמירת השינויים."]
      : ["בדקו ופרסמו", "עברו על פרטי הקמפיין לפני שהוא הופך לזמין לתרומות."],
  ];
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
  const categoryOptions = form.category && !categories.includes(form.category)
    ? [form.category, ...categories]
    : categories;

  useEffect(() => {
    let active = true;
    Promise.all([getNgoAdminData(), getCommunities()])
      .then(([result, communityRows]) => {
        if (!active) return;
        setProducts(result.products);
        setCommunities(communityRows);
        if (!campaignId) return;
        const campaign = result.campaigns.find((candidate) => candidate.id === campaignId);
        if (!campaign) {
          setLoadError("הקמפיין לא נמצא בעמותה שלך. / Campaign not found for your organization.");
          return;
        }
        setForm({
          title: campaign.title,
          category: campaign.category,
          goal: String(campaign.goal),
          endDate: campaign.end_date ?? "",
          shortDesc: campaign.short_desc ?? "",
          story: campaign.story ?? "",
          videoUrl: campaign.video_url ?? "",
          selectedProducts: result.campaignProducts
            .filter((row) => row.campaign_id === campaign.id)
            .map((row) => row.product_id),
        });
        setExistingImageUrl(campaign.hero_image_url);
        setSelectedCommunityIds(result.communityCampaigns.filter((row) => row.campaign_id === campaign.id).map((row) => row.community_id));
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Unable to load campaign");
      })
      .finally(() => {
        if (active) setLoadingCampaign(false);
      });
    return () => { active = false; };
  }, [campaignId]);

  async function saveCampaign() {
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
    const sharedArgs = {
      p_title: form.title.trim(), p_short_desc: form.shortDesc.trim(), p_story: form.story.trim(),
      p_category: form.category, p_goal: goal, p_end_date: form.endDate || null,
      p_product_ids: form.selectedProducts,
      p_hero_image_url: uploadedImage?.publicUrl ?? existingImageUrl,
      p_video_url: videoUrl,
    };
    const targetCampaignId = campaignId ?? persistedCampaignId;
    const { data: savedCampaignId, error } = targetCampaignId
      ? await sb.rpc("update_campaign", { p_campaign_id: targetCampaignId, ...sharedArgs })
      : await sb.rpc("publish_campaign", sharedArgs);
    if (error) {
      if (uploadedImage) await sb.storage.from("campaign-media").remove([uploadedImage.path]);
      setPublishError(error.message);
      setPublishing(false);
      return;
    }
    if (!targetCampaignId && savedCampaignId) setPersistedCampaignId(savedCampaignId);
    if (savedCampaignId && selectedCommunityIds.length > 0) {
      const { error: invitationError } = await sb.rpc("invite_communities_to_campaign", {
        p_campaign_id: savedCampaignId,
        p_community_ids: selectedCommunityIds,
      });
      if (invitationError) {
        setPublishError(lang === "en" ? "The campaign was saved, but community invitations could not be sent." : "הקמפיין נשמר, אך לא ניתן היה לשלוח את ההזמנות לקהילות.");
        setPublishing(false);
        setStep(4);
        return;
      }
    }
    router.push(isEditing ? "/nonprofit/campaigns" : (savedCampaignId ? `/campaign/${savedCampaignId}` : "/nonprofit"));
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

  if (loadingCampaign) {
    return <div className="min-h-screen bg-[#eef0f1] p-10 text-center text-sm text-gray-500">{lang === "en" ? "Loading campaign…" : "טוען קמפיין…"}</div>;
  }

  function toggleCommunity(id: string) {
    setSelectedCommunityIds((selected) => selected.includes(id) ? selected.filter((communityId) => communityId !== id) : [...selected, id]);
  }
  if (loadError) {
    return <div className="min-h-screen bg-[#eef0f1] p-10 text-center"><p className="mb-4 text-sm text-red-600" role="alert">{loadError}</p><Link href="/nonprofit/campaigns" className="font-bold text-raz-teal">{lang === "en" ? "Back to campaigns" : "חזרה לקמפיינים"}</Link></div>;
  }

  return (
    <div className="min-h-screen bg-[#eef0f1] p-0 md:p-7 lg:p-10">
      <WizardShell
        step={step}
        stepCount={STEPS.length}
        title={STEP_DETAILS[step][0]}
        description={STEP_DETAILS[step][1]}
        className="mx-auto min-h-[calc(100dvh-5rem)] max-w-6xl md:rounded-[2px]"
        topActions={(
          <>
            <span className="rounded-full bg-raz-dark px-3 py-1 text-[11px] font-bold text-white">
              {isEditing ? (lang === "en" ? "Edit campaign" : "עריכת קמפיין") : <EditableText tKey="wizard.title" />}
            </span>
            {orgDisplayName && <span className="max-w-40 truncate text-xs text-slate-400">{orgDisplayName}</span>}
          </>
        )}
        footer={(
          <>
            <button onClick={back} disabled={step === 0} className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:invisible">
              <ChevronLeft size={16} className={lang === "he" ? "rotate-180" : ""} />
              {lang === "en" ? `Back to ${STEPS[step - 1]}` : `חזרה ל${STEPS[step - 1]}`}
            </button>
            {step < STEPS.length - 1 && (
              <button onClick={next} className="rounded-full border border-raz-teal px-6 py-2 text-sm font-bold text-raz-teal transition-colors hover:bg-raz-teal hover:text-white">
                {lang === "en" ? `Continue to ${STEPS[step + 1]}` : `המשך ל${STEPS[step + 1]}`}
              </button>
            )}
          </>
        )}
      >

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
                {categoryOptions.map((c) => (
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
            existingImageUrl={existingImageUrl}
            onExistingImageRemove={() => setExistingImageUrl(null)}
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
                className={`bg-white rounded-2xl p-3 flex items-center gap-3 cursor-pointer border transition-colors ${
                  form.selectedProducts.includes(p.id) ? "border-raz-teal shadow-sm" : "border-slate-200 hover:border-raz-teal/50"
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
              <div key={c.id} className={`flex items-center gap-3 rounded-2xl border bg-white p-3 transition-colors ${selectedCommunityIds.includes(c.id) ? "border-raz-teal bg-raz-teal/5" : "border-slate-200"}`}>
                <div className="w-10 h-10 bg-raz-teal/10 rounded-full flex items-center justify-center">
                  <Users size={18} className="text-raz-teal" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{lang === "en" ? (c.name_en ?? c.name) : c.name}</p>
                  <p className="text-xs text-gray-500">{c.donors_count} חברים</p>
                  <p className="text-xs text-gray-400">{c.description ?? ""}</p>
                </div>
                <button type="button" onClick={() => toggleCommunity(c.id)} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${selectedCommunityIds.includes(c.id) ? "bg-raz-teal text-white" : "bg-raz-teal/10 text-raz-teal"}`}>
                  {selectedCommunityIds.includes(c.id) ? (lang === "en" ? "Invited" : "הוזמן") : (lang === "en" ? "Invite" : "הזמן")}
                </button>
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
            <h2 className="font-bold text-gray-700 text-lg">{isEditing ? "הקמפיין מוכן לשמירה!" : "הקמפיין מוכן לפרסום!"}</h2>
            <p className="text-sm text-gray-500">{isEditing ? "השינויים יעודכנו בקמפיין הקיים" : "הקמפיין יועלה לפלטפורמה ויהיה זמין לתרומות מיידית"}</p>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm text-right w-full">
              <div className="flex justify-between mb-2"><span className="text-gray-500">שם:</span><span className="font-medium">{form.title || "ארוחות חמות לקשישים"}</span></div>
              <div className="flex justify-between mb-2"><span className="text-gray-500">יעד:</span><span className="font-medium font-numeric">₪{form.goal || "25,000"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">מוצרים:</span><span className="font-medium">{form.selectedProducts.length}</span></div>
            </div>
            {publishError && <p className="w-full text-sm text-red-600" role="alert">{publishError}</p>}
            <button onClick={saveCampaign} disabled={publishing}
              className="w-full bg-raz-teal text-white py-4 rounded-xl font-bold text-base disabled:opacity-50">
              {publishing
                ? (lang === "en" ? (isEditing ? "Saving…" : "Publishing…") : (isEditing ? "שומר…" : "מפרסם…"))
                : (isEditing ? (lang === "en" ? "Save campaign changes" : "שמירת השינויים בקמפיין") : <EditableText tKey="wizard.publish" />)}
            </button>
          </div>
        )}
      </WizardShell>
    </div>
  );
}
