"use client";

import type { ReactNode } from "react";
import { HeartHandshake } from "lucide-react";

export default function WizardShell({
  step,
  stepCount,
  title,
  description,
  children,
  topActions,
  footer,
  railContent,
  className = "",
  contentClassName = "",
}: {
  step: number;
  stepCount: number;
  title: string;
  description?: string;
  children: ReactNode;
  topActions?: ReactNode;
  footer?: ReactNode;
  railContent?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={`relative flex w-full flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,35,50,0.12)] md:grid md:grid-cols-[minmax(0,1fr)_22rem] ${className}`}>
      <div className="order-last flex min-h-0 flex-col md:col-start-1 md:row-start-1">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-100 px-5 py-3 md:px-8">
          <div className="flex items-center gap-2">{topActions}</div>
          <div className="flex items-center gap-1.5" aria-label={`${step + 1}/${stepCount}`}>
            {Array.from({ length: stepCount }, (_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${index === step ? "w-7 bg-raz-teal" : index < step ? "w-3 bg-raz-teal/45" : "w-3 bg-slate-200"}`}
              />
            ))}
          </div>
        </header>

        <main className={`min-h-0 flex-1 overflow-y-auto px-5 py-8 md:px-10 md:py-10 ${contentClassName}`}>
          <div className="mx-auto w-full max-w-2xl">{children}</div>
        </main>

        {footer && (
          <footer className="border-t border-slate-100 bg-white px-5 py-4 md:px-8">
            <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">{footer}</div>
          </footer>
        )}
      </div>

      <aside className="relative order-first flex min-h-48 flex-col overflow-hidden bg-[#18b9b6] px-7 py-7 text-white md:col-start-2 md:row-start-1 md:min-h-full md:px-9 md:py-9">
        <div className="absolute -end-16 -top-16 h-48 w-48 rounded-full border border-white/10" />
        <div className="absolute -end-8 -top-8 h-28 w-28 rounded-full border border-white/10" />
        <HeartHandshake size={21} strokeWidth={1.6} className="relative mb-7 self-end text-white/90" />
        <p className="relative mb-3 text-xs font-bold tracking-[0.18em] text-white/75">{step + 1}/{stepCount}</p>
        <h1 className="relative max-w-xs text-2xl font-black leading-tight md:text-[1.75rem]">{title}</h1>
        {description && <p className="relative mt-4 max-w-xs text-sm leading-6 text-white/78">{description}</p>}
        {railContent && <div className="relative mt-7">{railContent}</div>}
        <div className="relative mt-auto hidden items-center gap-2 pt-8 text-[11px] text-white/65 md:flex">
          <span className="h-px w-8 bg-white/40" /> Impactify
        </div>
      </aside>
    </section>
  );
}
