import { Fragment, type ReactNode } from "react";

function safeLink(href: string) {
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function renderInline(text: string): ReactNode[] {
  const tokenPattern = /(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\([^\s)]+\))/g;
  return text.split(tokenPattern).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    const href = link ? safeLink(link[2]) : null;
    if (link && href) {
      return <a key={index} href={href} target="_blank" rel="noreferrer" className="text-raz-teal underline">{link[1]}</a>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export default function CampaignStory({ story, dir }: { story: string; dir: "rtl" | "ltr" }) {
  const lines = story.split("\n");
  return (
    <div className="text-gray-600 leading-relaxed space-y-2" dir={dir}>
      {lines.map((line, index) => {
        if (line.startsWith("# ")) return <h2 key={index} className="text-2xl font-bold text-gray-800">{renderInline(line.slice(2))}</h2>;
        if (line.startsWith("## ")) return <h3 key={index} className="text-xl font-bold text-gray-800">{renderInline(line.slice(3))}</h3>;
        if (!line.trim()) return <div key={index} className="h-2" aria-hidden="true" />;
        return <p key={index}>{renderInline(line)}</p>;
      })}
    </div>
  );
}
