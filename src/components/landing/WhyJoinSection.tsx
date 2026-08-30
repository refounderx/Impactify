"use client";
import EditableText from "@/components/admin/EditableText";

export default function WhyJoinSection() {
  const reasons = ["transparency", "community", "impact"] as const;
  return (
    <section id="why" className="max-w-4xl mx-auto px-6 py-16 text-center">
      <EditableText tKey="landing.why.heading1" as="h2" className="text-2xl font-bold text-gray-900 mb-1 block" />
      <EditableText tKey="landing.why.heading2" as="p" className="text-2xl font-bold text-gray-900 mb-4 block" />
      <EditableText tKey="landing.why.sub" as="p" className="text-gray-500 mb-10 block" />

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {reasons.map((reason) => (
          <div key={reason} className="flex flex-col items-center gap-3 rounded-2xl bg-raz-surface p-6">
            <span className="text-4xl" aria-hidden="true">{{ transparency: "🔎", community: "🤝", impact: "💙" }[reason]}</span>
            <EditableText tKey={`landing.why.${reason}.title`} as="h3" className="font-bold text-gray-900 block" />
            <EditableText tKey={`landing.why.${reason}.body`} as="p" className="text-sm text-gray-500 leading-relaxed block" />
          </div>
        ))}
      </div>
    </section>
  );
}
