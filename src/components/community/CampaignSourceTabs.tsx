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
    <div className="flex items-center justify-end gap-4 mb-5">
      <button
        onClick={() => onChange("linked")}
        className={`text-sm transition-colors ${active === "linked" ? "text-gray-800 font-bold" : "text-gray-400 hover:text-gray-600"}`}
      >
        <EditableText tKey="cm.campaignsLinked" />
      </button>
      <button
        onClick={() => onChange("created")}
        className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
          active === "created" ? "border-raz-teal text-raz-teal" : "border-transparent text-gray-400 hover:text-gray-600"
        }`}
      >
        <EditableText tKey="cm.campaignsCreated" />
      </button>
    </div>
  );
}
