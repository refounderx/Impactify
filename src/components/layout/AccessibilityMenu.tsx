"use client";

import { useEffect, useRef, useState } from "react";
import { Accessibility, ArrowDownToLine, Contrast, Link2, Minus, Pause, Plus, RotateCcw, X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

type AccessibilitySettings = {
  fontSize: 0 | 1 | 2;
  highContrast: boolean;
  underlineLinks: boolean;
  reduceMotion: boolean;
};

const STORAGE_KEY = "impactify-accessibility";
const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 0,
  highContrast: false,
  underlineLinks: false,
  reduceMotion: false,
};

function applySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;
  root.dataset.a11yFontSize = String(settings.fontSize);
  root.dataset.a11yContrast = String(settings.highContrast);
  root.dataset.a11yLinks = String(settings.underlineLinks);
  root.dataset.a11yMotion = String(settings.reduceMotion);
}

function readSettings(): AccessibilitySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function AccessibilityMenu() {
  const { lang } = useLang();
  const isHebrew = lang === "he";
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(readSettings);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applySettings(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const update = (next: AccessibilitySettings) => {
    setSettings(next);
  };

  const toggle = (key: "highContrast" | "underlineLinks" | "reduceMotion") => {
    update({ ...settings, [key]: !settings[key] });
  };

  const labels = isHebrew
    ? {
        open: "פתיחת תפריט נגישות",
        title: "כלי נגישות",
        close: "סגירת תפריט נגישות",
        skip: "דלג לתוכן המרכזי",
        font: "גודל טקסט",
        decrease: "הקטנת טקסט",
        increase: "הגדלת טקסט",
        contrast: "ניגודיות גבוהה",
        links: "הדגשת קישורים",
        motion: "עצירת אנימציות",
        reset: "איפוס הגדרות נגישות",
      }
    : {
        open: "Open accessibility menu",
        title: "Accessibility tools",
        close: "Close accessibility menu",
        skip: "Skip to main content",
        font: "Text size",
        decrease: "Decrease text size",
        increase: "Increase text size",
        contrast: "High contrast",
        links: "Highlight links",
        motion: "Reduce motion",
        reset: "Reset accessibility settings",
      };

  const optionClass = (active: boolean) =>
    `interactive-control flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start text-sm font-medium ${
      active ? "border-raz-teal bg-raz-teal/10 text-raz-dark" : "border-gray-200 bg-white text-gray-700"
    }`;

  return (
    <div className="fixed bottom-5 left-5 z-[80]" dir={isHebrew ? "rtl" : "ltr"}>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="accessibility-menu-title"
          className="mb-3 w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 shadow-2xl"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="accessibility-menu-title" className="text-lg font-bold">{labels.title}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="interactive-control micro-hint flex min-h-11 min-w-11 items-center justify-center rounded-full"
              aria-label={labels.close}
            >
              <X aria-hidden="true" size={22} />
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
            <span className="text-sm font-medium">{labels.font}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => update({ ...settings, fontSize: Math.max(0, settings.fontSize - 1) as 0 | 1 | 2 })} disabled={settings.fontSize === 0} className="interactive-control flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-200" aria-label={labels.decrease}>
                <Minus aria-hidden="true" size={18} />
              </button>
              <span className="w-8 text-center text-sm font-bold" aria-live="polite">{100 + settings.fontSize * 10}%</span>
              <button type="button" onClick={() => update({ ...settings, fontSize: Math.min(2, settings.fontSize + 1) as 0 | 1 | 2 })} disabled={settings.fontSize === 2} className="interactive-control flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-200" aria-label={labels.increase}>
                <Plus aria-hidden="true" size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                document.getElementById("main-content")?.focus();
              }}
              className={optionClass(false)}
            >
              <ArrowDownToLine aria-hidden="true" size={20} />{labels.skip}
            </button>
            <button type="button" onClick={() => toggle("highContrast")} className={optionClass(settings.highContrast)} aria-pressed={settings.highContrast}><Contrast aria-hidden="true" size={20} />{labels.contrast}</button>
            <button type="button" onClick={() => toggle("underlineLinks")} className={optionClass(settings.underlineLinks)} aria-pressed={settings.underlineLinks}><Link2 aria-hidden="true" size={20} />{labels.links}</button>
            <button type="button" onClick={() => toggle("reduceMotion")} className={optionClass(settings.reduceMotion)} aria-pressed={settings.reduceMotion}><Pause aria-hidden="true" size={20} />{labels.motion}</button>
            <button type="button" onClick={() => update(DEFAULT_SETTINGS)} className={optionClass(false)}><RotateCcw aria-hidden="true" size={20} />{labels.reset}</button>
          </div>
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="interactive-control micro-hint flex min-h-14 min-w-14 items-center justify-center rounded-full border-2 border-white bg-raz-dark text-white shadow-xl"
        aria-label={labels.open}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Accessibility aria-hidden="true" size={30} />
      </button>
    </div>
  );
}
