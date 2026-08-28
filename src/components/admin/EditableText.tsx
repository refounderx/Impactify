"use client";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { translations } from "@/lib/translations";
import { upsertSiteContent } from "@/lib/supabase/queries-content";

// Wraps a translations.ts-driven text string. In admin mode it shows a
// pencil affordance that opens a He/En editor and saves to the site_content
// override table (see queries-content.ts); otherwise renders identically to
// a plain t(tKey) call.
export default function EditableText({
  tKey,
  as: Tag = "span",
  className,
}: {
  tKey: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}) {
  const { t, overrides, refreshOverrides } = useLang();
  const { adminMode } = useAdminMode();
  const [editing, setEditing] = useState(false);
  const [heDraft, setHeDraft] = useState("");
  const [enDraft, setEnDraft] = useState("");
  const [saving, setSaving] = useState(false);

  if (!adminMode) return <Tag className={className}>{t(tKey)}</Tag>;

  function openEditor() {
    setHeDraft(overrides[tKey]?.he || translations.he[tKey] || "");
    setEnDraft(overrides[tKey]?.en || translations.en[tKey] || "");
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    const ok = await upsertSiteContent(tKey, heDraft, enDraft);
    setSaving(false);
    if (ok) {
      refreshOverrides();
      setEditing(false);
    }
  }

  return (
    <span className="relative inline-block group">
      <Tag className={className}>{t(tKey)}</Tag>
      <button
        type="button"
        onClick={openEditor}
        className="micro-hint absolute -top-1 -end-5 opacity-0 group-hover:opacity-100 bg-raz-teal text-white rounded-full p-0.5 transition-opacity"
        aria-label={t("hint.edit")}
      >
        <Pencil size={12} />
      </button>

      {editing && (
        <span className="absolute z-50 top-full start-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-start block" dir="rtl">
          <span className="block text-xs text-gray-400 mb-2">{tKey}</span>
          <label className="block text-xs font-medium text-gray-600 mb-1">עברית</label>
          <textarea
            value={heDraft}
            onChange={(e) => setHeDraft(e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm mb-2"
            dir="rtl"
          />
          <label className="block text-xs font-medium text-gray-600 mb-1">English</label>
          <textarea
            value={enDraft}
            onChange={(e) => setEnDraft(e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm mb-2"
            dir="ltr"
          />
          <span className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100">
              ביטול
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded-full bg-raz-teal text-white font-medium disabled:opacity-50"
            >
              {saving ? "שומר..." : "שמור"}
            </button>
          </span>
        </span>
      )}
    </span>
  );
}
