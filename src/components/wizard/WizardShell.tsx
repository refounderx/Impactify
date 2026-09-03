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
  immersive = false,
  progressStepCount,
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
  immersive?: boolean;
  progressStepCount?: number;
  className?: string;
  contentClassName?: string;
}) {
  const visibleStepCount = progressStepCount ?? stepCount;
  return (
    <section className={`${immersive ? "onboarding-shell md:grid-cols-[minmax(0,1fr)_minmax(20rem,35vw)]" : "shadow-[0_24px_80px_rgba(15,35,50,0.12)] md:grid-cols-[minmax(0,1fr)_22rem]"} relative flex w-full flex-col overflow-hidden bg-white md:grid ${className}`}>
      <div className="order-last flex min-h-0 flex-col md:col-start-1 md:row-start-1">
        <header className={`flex items-center justify-between gap-4 px-5 py-3 ${immersive ? "min-h-20 md:px-12" : "min-h-16 border-b border-slate-100 md:px-8"}`}>
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

        <main className={`${immersive ? "onboarding-scroll px-5 py-7 md:px-12 md:py-5" : "px-5 py-8 md:px-10 md:py-10"} min-h-0 flex-1 overflow-y-auto ${contentClassName}`}>
          <div key={step} className={`${immersive ? "onboarding-step max-w-3xl" : "max-w-2xl"} mx-auto w-full`}>{children}</div>
        </main>

        {footer && (
          <footer className={`bg-white px-5 py-4 ${immersive ? "shadow-[0_-5px_18px_rgba(15,35,50,0.04)] md:px-12 md:py-6 md:shadow-none" : "border-t border-slate-100 md:px-8"}`}>
            <div className={`${immersive ? "max-w-3xl" : "max-w-2xl"} mx-auto flex w-full items-center justify-between gap-3`}>{footer}</div>
          </footer>
        )}
      </div>

      <aside className={`${immersive ? "min-h-44 bg-[#12c2b9] px-6 py-5 md:max-w-[450px] md:px-10 md:py-10" : "min-h-48 bg-[#18b9b6] px-7 py-7 md:px-9 md:py-9"} relative order-first flex flex-col overflow-hidden text-white md:col-start-2 md:row-start-1 md:min-h-full`}>
        {!immersive && <><div className="absolute -end-16 -top-16 h-48 w-48 rounded-full border border-white/10" /><div className="absolute -end-8 -top-8 h-28 w-28 rounded-full border border-white/10" /></>}
        <HeartHandshake size={immersive ? 43 : 21} strokeWidth={immersive ? 1.45 : 1.6} className={`relative text-white ${immersive ? "mb-3 md:self-end" : "mb-7 self-end opacity-90"}`} />
        <div className={immersive ? "relative flex flex-1 flex-col justify-center md:items-center md:text-center" : "relative"}>
          <p className={immersive ? "mb-2 text-base font-medium text-white/90 md:text-2xl" : "mb-3 text-xs font-bold tracking-[0.18em] text-white/75"}>{Math.min(step + 1, visibleStepCount)}/{visibleStepCount}</p>
          <h1 className={immersive ? "max-w-sm text-2xl font-black leading-tight md:text-[2.6rem]" : "max-w-xs text-2xl font-black leading-tight md:text-[1.75rem]"}>{title}</h1>
          {description && <p className={immersive ? "mt-3 max-w-xs text-sm leading-6 text-white/90 md:mt-5 md:text-base" : "mt-4 max-w-xs text-sm leading-6 text-white/78"}>{description}</p>}
          {railContent && <div className={immersive ? "mt-7 w-full text-start" : "mt-7"}>{railContent}</div>}
        </div>
        <div className={`relative mt-auto hidden items-center gap-2 pt-8 text-[11px] md:flex ${immersive ? "text-white/70" : "text-white/65"}`}>
          <span className="h-px w-8 bg-white/40" /> Impactify
        </div>
      </aside>
    </section>
  );
}
