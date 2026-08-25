"use client";

import { useRef } from "react";

interface CampaignStoryEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const controls = [
  { label: "B", title: "Bold", before: "**", after: "**" },
  { label: "I", title: "Italic", before: "_", after: "_" },
  { label: "H1", title: "Heading 1", linePrefix: "# " },
  { label: "H2", title: "Heading 2", linePrefix: "## " },
  { label: "🔗", title: "Link", before: "[", after: "](https://)" },
] as const;

export default function CampaignStoryEditor({ value, onChange, placeholder }: CampaignStoryEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function applyFormat(control: (typeof controls)[number]) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    let nextValue: string;
    let nextStart: number;
    let nextEnd: number;

    if ("linePrefix" in control) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      nextValue = `${value.slice(0, lineStart)}${control.linePrefix}${value.slice(lineStart)}`;
      nextStart = start + control.linePrefix.length;
      nextEnd = end + control.linePrefix.length;
    } else {
      nextValue = `${value.slice(0, start)}${control.before}${selected}${control.after}${value.slice(end)}`;
      nextStart = start + control.before.length;
      nextEnd = nextStart + selected.length;
    }

    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 focus-within:border-raz-teal">
      <div className="flex gap-1 p-2 border-b border-gray-100 flex-wrap" dir="ltr">
        {controls.map((control) => (
          <button
            key={control.label}
            type="button"
            title={control.title}
            aria-label={control.title}
            onClick={() => applyFormat(control)}
            className="px-2.5 py-1 rounded text-xs font-mono bg-gray-100 text-gray-600 hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-raz-teal"
          >
            {control.label}
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={10}
        className="w-full p-3 text-sm outline-none text-right resize-y rounded-b-xl min-h-56"
      />
    </div>
  );
}
