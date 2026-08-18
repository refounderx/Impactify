"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";

type AppRole = "donor" | "org_admin" | "community_manager";

const roles: { key: AppRole; he: string; en: string; desc_he: string; desc_en: string; emoji: string }[] = [
  { key: "donor", he: "תורם", en: "Donor", desc_he: "אני רוצה לתרום לקמפיינים", desc_en: "I want to donate to campaigns", emoji: "💙" },
  { key: "org_admin", he: "עמותה", en: "Organization", desc_he: "אני מנהל עמותה", desc_en: "I manage a non-profit", emoji: "🏛️" },
  { key: "community_manager", he: "מנהל קהילה", en: "Community Manager", desc_he: "אני מגייס עבור קהילה", desc_en: "I fundraise for a community", emoji: "👥" },
];

export default function SetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { lang } = useLang();
  const [name, setName] = useState("");
  const [role, setRole] = useState<AppRole>("donor");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) router.push("/auth");
  }, [user, router]);

  async function saveProfile() {
    if (!name.trim() || !user) return;
    setSaving(true);
    const sb = createClient();
    await sb.from("profiles").upsert({
      id: user.id,
      full_name: name.trim(),
      email: user.email,
      app_role: role,
      updated_at: new Date().toISOString(),
    });
    router.push(role === "org_admin" ? "/nonprofit" : role === "community_manager" ? "/community" : "/");
  }

  return (
    <div className="min-h-screen bg-raz-dark flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-3xl font-bold text-raz-teal font-hebrew mb-1">Impactify</p>
          <p className="text-gray-400 text-sm">{lang === "en" ? "Almost done!" : "כמעט סיימנו!"}</p>
        </div>

        <div className="bg-white rounded-2xl p-6">
          <h2 className="font-bold text-gray-800 text-lg mb-4">
            {lang === "en" ? "Set up your profile" : "הגדרת פרופיל"}
          </h2>

          <div className="mb-5">
            <label className="text-sm text-gray-500 mb-1.5 block">
              {lang === "en" ? "Your name" : "השם שלך"}
            </label>
            <input
              type="text"
              placeholder={lang === "en" ? "Full name" : "שם מלא"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-raz-teal text-sm"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="text-sm text-gray-500 mb-2 block">
              {lang === "en" ? "I am a..." : "אני..."}
            </label>
            <div className="flex flex-col gap-2">
              {roles.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRole(r.key)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-right transition-colors ${
                    role === r.key ? "border-raz-teal bg-raz-teal/5" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <div>
                    <p className={`font-medium text-sm ${role === r.key ? "text-raz-teal" : "text-gray-800"}`}>
                      {lang === "en" ? r.en : r.he}
                    </p>
                    <p className="text-xs text-gray-400">{lang === "en" ? r.desc_en : r.desc_he}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving || !name.trim()}
            className="w-full bg-raz-teal text-white py-3.5 rounded-xl font-bold disabled:opacity-50"
          >
            {saving
              ? (lang === "en" ? "Saving..." : "שומר...")
              : (lang === "en" ? "Get started" : "בואו נתחיל")}
          </button>
        </div>
      </div>
    </div>
  );
}
