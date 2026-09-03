"use client";
import type { CommunityCampaignSource } from "@/lib/community-admin-data";
import EditableText from "@/components/admin/EditableText";

export default function CampaignSourceTabs({
  active,
  onChange,
}: {
  active: CommunityCampaignSource;
  onChange: (source: CommunityCampaignSource) => void;
}) {
  return (
    <div className="mb-5 flex w-full flex-wrap items-center justify-end gap-2 rounded-2xl bg-white p-2 shadow-sm sm:w-fit">
      <button
        onClick={() => onChange("linked")}
        className={`min-h-11 rounded-xl px-4 text-sm font-bold transition-colors sm:px-5 sm:text-base ${active === "linked" ? "bg-raz-teal text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
      >
        <EditableText tKey="cm.campaignsLinked" />
      </button>
      <button
        onClick={() => onChange("created")}
        className={`min-h-11 rounded-xl px-4 text-sm font-bold transition-colors sm:px-5 sm:text-base ${
          active === "created" ? "bg-raz-teal text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        }`}
      >
        <EditableText tKey="cm.campaignsCreated" />
      </button>
    </div>
  );
}
