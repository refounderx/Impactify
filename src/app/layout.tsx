import type { Metadata } from "next";
import { Heebo, Assistant, Roboto } from "next/font/google";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminModeProvider } from "@/contexts/AdminModeContext";
import { SiteDataProvider } from "@/contexts/SiteDataContext";
import DemoBar from "@/components/layout/DemoBar";
import TopNav from "@/components/layout/TopNav";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo", display: "swap" });
const assistant = Assistant({ subsets: ["hebrew", "latin"], variable: "--font-assistant", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto", display: "swap" });

export const metadata: Metadata = {
  title: "Impactify",
  description: "תרמו למטרות שאתם אוהבים | Support the causes you love",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${assistant.variable} ${roboto.variable}`}>
      <body className="min-h-screen bg-raz-surface">
        <LanguageProvider>
          <SiteDataProvider>
            <AdminModeProvider>
              <AuthProvider>
                <div className="sticky top-0 z-50">
                  {process.env.NODE_ENV === "development" && <DemoBar />}
                  <TopNav />
                </div>
                {children}
              </AuthProvider>
            </AdminModeProvider>
          </SiteDataProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
