"use client";
import EditableText from "@/components/admin/EditableText";

export default function WhyJoinSection() {
  return (
    <section id="why" className="max-w-4xl mx-auto px-6 py-16 text-center">
      <EditableText tKey="landing.why.heading1" as="h2" className="text-2xl font-bold text-gray-900 mb-1 block" />
      <EditableText tKey="landing.why.heading2" as="p" className="text-2xl font-bold text-gray-900 mb-4 block" />
      <EditableText tKey="landing.why.sub" as="p" className="text-gray-500 mb-10 block" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200" />
            <EditableText tKey="landing.why.sub" as="p" className="text-sm text-gray-500 leading-relaxed block" />
          </div>
        ))}
      </div>
    </section>
  );
}
