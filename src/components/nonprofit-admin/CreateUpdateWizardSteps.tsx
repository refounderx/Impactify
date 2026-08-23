"use client";
import { Check, ChevronRight, Image as ImageIcon, Video, X } from "lucide-react";
import type { AdminProductRow, AdminCampaignRow } from "@/lib/nonprofit-admin-data";

export type Audience = "products" | "campaigns" | "all";
export type Timing = "now" | "scheduled" | "trigger";
export type Trigger = "donation" | "quantity" | "days";
export type Cta = "none" | "addProduct" | "priceQty";

export function RadioRow({ label, checked, onSelect }: { label: string; checked: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className="flex items-center gap-2 text-sm text-gray-700">
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${checked ? "border-raz-teal" : "border-gray-300"}`}>
        {checked && <span className="w-2 h-2 rounded-full bg-raz-teal" />}
      </span>
      {label}
    </button>
  );
}

export function Step0({ t, lang, audience, setAudience, targetIds, toggleTarget, targetOptions }: {
  t: (k: string) => string; lang: string;
  audience: Audience; setAudience: (a: Audience) => void;
  targetIds: string[]; toggleTarget: (id: string) => void;
  targetOptions: AdminProductRow[] | AdminCampaignRow[];
}) {
  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-black text-gray-800 mb-4">{t("adm.uw.step1Title")}</h2>
      <p className="text-sm text-gray-500 mb-6">{t("adm.uw.step1Body")}</p>

      <p className="text-sm font-bold text-gray-700 mb-2">{t("adm.uw.recipientsQuestion")}</p>
      <div className="flex flex-wrap gap-5 mb-5">
        <RadioRow label={t("adm.uw.recipientCampaigns")} checked={audience === "campaigns"} onSelect={() => setAudience("campaigns")} />
        <RadioRow label={t("adm.uw.recipientProducts")} checked={audience === "products"} onSelect={() => setAudience("products")} />
        <RadioRow label={t("adm.uw.recipientAll")} checked={audience === "all"} onSelect={() => setAudience("all")} />
      </div>

      {audience !== "all" && (
        <>
          <p className="text-sm font-bold text-gray-700 mb-2">
            {audience === "products" ? t("adm.uw.chooseProducts") : t("adm.uw.chooseCampaigns")}
          </p>
          <div className="flex flex-wrap gap-2">
            {targetOptions.map((o) => {
              const selected = targetIds.includes(o.id);
              const label = lang === "en" ? o.nameEn : o.name;
              return (
                <button
                  key={o.id}
                  onClick={() => toggleTarget(o.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selected ? "bg-raz-teal text-white border-raz-teal" : "bg-white text-gray-600 border-gray-200 hover:border-raz-teal"
                  }`}
                >
                  {label}
                  {selected && <X size={12} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function Step1({ t, channels, setChannels, timing, setTiming, scheduledAt, setScheduledAt, trigger, setTrigger }: {
  t: (k: string) => string;
  channels: { push: boolean; email: boolean; sms: boolean }; setChannels: (c: { push: boolean; email: boolean; sms: boolean }) => void;
  timing: Timing; setTiming: (t: Timing) => void;
  scheduledAt: string; setScheduledAt: (s: string) => void;
  trigger: Trigger; setTrigger: (t: Trigger) => void;
}) {
  const CHANNEL_KEYS: Array<{ key: keyof typeof channels; label: string }> = [
    { key: "push", label: "Push Notification" },
    { key: "email", label: "Email" },
    { key: "sms", label: "SMS" },
  ];
  const TRIGGERS: Array<{ key: Trigger; label: string }> = [
    { key: "donation", label: t("adm.uw.triggerDonation") },
    { key: "quantity", label: t("adm.uw.triggerQuantity") },
    { key: "days", label: t("adm.uw.triggerDaysSince") },
  ];

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-black text-gray-800 mb-4">{t("adm.uw.step2Title")}</h2>
      <p className="text-sm text-gray-500 mb-6">{t("adm.uw.step2Body")}</p>

      <p className="text-sm font-bold text-gray-700 mb-2">{t("adm.uw.channelsQuestion")}</p>
      <div className="flex flex-wrap gap-5 mb-6">
        {CHANNEL_KEYS.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={channels[key]}
              onChange={(e) => setChannels({ ...channels, [key]: e.target.checked })}
              className="w-4 h-4 accent-raz-teal"
            />
            {label}
          </label>
        ))}
      </div>

      <p className="text-sm font-bold text-gray-700 mb-2">{t("adm.uw.timingQuestion")}</p>
      <div className="flex flex-wrap gap-5 mb-4">
        <RadioRow label={t("adm.uw.sendNow")} checked={timing === "now"} onSelect={() => setTiming("now")} />
        <RadioRow label={t("adm.uw.sendScheduled")} checked={timing === "scheduled"} onSelect={() => setTiming("scheduled")} />
        <RadioRow label={t("adm.uw.sendByTrigger")} checked={timing === "trigger"} onSelect={() => setTiming("trigger")} />
      </div>

      {timing === "scheduled" && (
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-raz-teal"
        />
      )}

      {timing === "trigger" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500">{t("adm.uw.triggerListTitle")}</p>
          {TRIGGERS.map((tr) => (
            <RadioRow key={tr.key} label={tr.label} checked={trigger === tr.key} onSelect={() => setTrigger(tr.key)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Step2({ t, title, setTitle, body, setBody, cta, setCta, imageName, setImageName }: {
  t: (k: string) => string;
  title: string; setTitle: (s: string) => void;
  body: string; setBody: (s: string) => void;
  cta: Cta; setCta: (c: Cta) => void;
  imageName: string | null; setImageName: (s: string | null) => void;
}) {
  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-black text-gray-800 mb-6">{t("adm.uw.step3Title")}</h2>

      <label className="block mb-4">
        <p className="text-sm font-bold text-gray-700 mb-2">{t("adm.uw.contentTitleLabel")}</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-raz-teal"
        />
      </label>

      <label className="block mb-4">
        <p className="text-sm font-bold text-gray-700 mb-2">{t("adm.uw.contentBodyLabel")}</p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-raz-teal resize-none"
        />
      </label>

      <label className="block mb-5">
        <p className="text-sm font-bold text-gray-700 mb-2">{t("adm.uw.ctaLabel")}</p>
        <select
          value={cta}
          onChange={(e) => setCta(e.target.value as Cta)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-raz-teal"
        >
          <option value="none">{t("adm.uw.ctaNone")}</option>
          <option value="addProduct">{t("adm.uw.ctaAddProduct")}</option>
          <option value="priceQty">{t("adm.uw.ctaPriceQty")}</option>
        </select>
      </label>

      <p className="text-sm font-bold text-gray-700 mb-2">{t("adm.uw.mediaLabel")}</p>
      <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-500 hover:border-raz-teal hover:text-raz-teal transition-colors cursor-pointer w-fit">
        {imageName ? <ImageIcon size={16} /> : <Video size={16} />}
        {imageName ?? t("adm.uw.uploadImage")}
        <input
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => setImageName(e.target.files?.[0]?.name ?? null)}
        />
      </label>
    </div>
  );
}

export function PreviewPanel({ t, lang, step, title, body, imageName, channels }: {
  t: (k: string) => string; lang: string; step: number;
  title: string; body: string; imageName: string | null;
  channels: { push: boolean; email: boolean; sms: boolean };
}) {
  const activeChannels = Object.entries(channels).filter(([, v]) => v).map(([k]) => k);
  return (
    <div className="hidden md:flex w-80 bg-raz-teal text-white flex-col p-8 flex-shrink-0">
      <p className="text-xs text-teal-100 mb-1">{step + 1}/{3}</p>
      <h3 className="text-2xl font-black mb-6">{t("adm.uw.previewTitle")}</h3>

      {step < 2 ? (
        <p className="text-sm text-teal-50 leading-relaxed">
          {lang === "en"
            ? "Choose who receives this update — donors to a specific product, campaign, or everyone."
            : "בחרו מוצר, קמפיין או כלל תורמים — כדי לצפות בתצוגה מקדימה של העדכון."}
        </p>
      ) : (
        <div className="bg-white/10 rounded-2xl p-4 flex flex-col gap-3">
          {imageName && (
            <div className="bg-white/20 rounded-xl h-28 flex items-center justify-center text-xs">{imageName}</div>
          )}
          <p className="font-bold text-sm">{title || "—"}</p>
          <p className="text-xs text-teal-50 leading-relaxed line-clamp-4">{body || "—"}</p>
          <div className="flex items-center gap-1 text-xs text-teal-100">
            <Check size={12} />
            {activeChannels.length > 0 ? activeChannels.join(", ") : "—"}
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center gap-1 text-xs text-teal-200/80">
        <ChevronRight size={14} />
        {lang === "en" ? "Manage from Updates dashboard" : "ניהול מתוך דשבורד עדכונים"}
      </div>
    </div>
  );
}
