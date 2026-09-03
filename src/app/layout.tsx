import type { Metadata } from "next";
import { Assistant, Roboto } from "next/font/google";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminModeProvider } from "@/contexts/AdminModeContext";
import { SiteDataProvider } from "@/contexts/SiteDataContext";
import DemoBar from "@/components/layout/DemoBar";
import TopNav from "@/components/layout/TopNav";
import AccessibilityMenu from "@/components/layout/AccessibilityMenu";
import CookieConsentBanner from "@/components/layout/CookieConsentBanner";
import { CookieConsentProvider } from "@/contexts/CookieConsentContext";
import "./globals.css";

const assistant = Assistant({ subsets: ["hebrew", "latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-assistant", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto", display: "swap" });

export const metadata: Metadata = {
  title: "Impactify",
  description: "תרמו למטרות שאתם אוהבים | Support the causes you love",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${assistant.variable} ${roboto.variable}`}>
      <body className="min-h-screen bg-raz-surface">
        <LanguageProvider>
          <CookieConsentProvider>
            <SiteDataProvider>
              <AuthProvider>
                <AdminModeProvider>
                  <div className="site-frame sticky top-0 z-50">
                    {process.env.NODE_ENV === "development" && <DemoBar />}
                    <TopNav />
                  </div>
                  <div id="main-content" className="site-frame" tabIndex={-1}>{children}</div>
                  <AccessibilityMenu />
                  <CookieConsentBanner />
                </AdminModeProvider>
              </AuthProvider>
            </SiteDataProvider>
          </CookieConsentProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
