"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CookiePreferences = {
  analytics: boolean;
  marketing: boolean;
};

type StoredConsent = CookiePreferences & {
  version: string;
  updatedAt: string;
};

type CookieConsentContextValue = {
  ready: boolean;
  consented: boolean;
  preferences: CookiePreferences;
  acceptAll: () => void;
  rejectOptional: () => void;
  savePreferences: (preferences: CookiePreferences) => void;
  openPreferences: () => void;
  preferencesOpen: boolean;
  closePreferences: () => void;
};

const STORAGE_KEY = "impactify-cookie-consent";
const CONSENT_VERSION = "2026-08-30";
const DEFAULT_PREFERENCES: CookiePreferences = { analytics: false, marketing: false };

const CookieConsentContext = createContext<CookieConsentContextValue>({
  ready: false,
  consented: false,
  preferences: DEFAULT_PREFERENCES,
  acceptAll: () => {},
  rejectOptional: () => {},
  savePreferences: () => {},
  openPreferences: () => {},
  preferencesOpen: false,
  closePreferences: () => {},
});

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [consented, setConsented] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as Partial<StoredConsent>;
          if (stored.version === CONSENT_VERSION && typeof stored.analytics === "boolean" && typeof stored.marketing === "boolean") {
            setPreferences({ analytics: stored.analytics, marketing: stored.marketing });
            setConsented(true);
          }
        }
      } catch {
        // A browser that blocks local storage will receive the essential-only default.
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const savePreferences = useCallback((next: CookiePreferences) => {
    const record: StoredConsent = { ...next, version: CONSENT_VERSION, updatedAt: new Date().toISOString() };
    setPreferences(next);
    setConsented(true);
    setPreferencesOpen(false);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch {}
    window.dispatchEvent(new CustomEvent("impactify:cookie-consent", { detail: record }));
  }, []);

  const value = useMemo(() => ({
    ready,
    consented,
    preferences,
    acceptAll: () => savePreferences({ analytics: true, marketing: true }),
    rejectOptional: () => savePreferences(DEFAULT_PREFERENCES),
    savePreferences,
    openPreferences: () => setPreferencesOpen(true),
    preferencesOpen,
    closePreferences: () => setPreferencesOpen(false),
  }), [ready, consented, preferences, preferencesOpen, savePreferences]);

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export const useCookieConsent = () => useContext(CookieConsentContext);
