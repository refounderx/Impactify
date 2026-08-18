"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/contexts/LanguageContext";
import { Mail, CheckCircle2, RotateCcw } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { lang } = useLang();
  const [step, setStep] = useState<"email" | "sent">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Exact same call that was working before — no emailRedirectTo
  async function sendOtp() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const sb = createClient();
    const { error } = await sb.auth.signInWithOtp({ email: email.trim() });
    if (error) {
      console.error("Supabase auth error:", error);
      setError(error.message); // show real error
    } else {
      setStep("sent");
      startCooldown();
    }
    setLoading(false);
  }

  function startCooldown() {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((n) => { if (n <= 1) { clearInterval(t); return 0; } return n - 1; });
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-raz-dark flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <p className="text-4xl font-bold text-raz-teal font-hebrew mb-2">Impactify</p>
          <p className="text-gray-400 text-sm">
            {lang === "en" ? "Sign in to your account" : "התחבר לחשבון שלך"}
          </p>
        </div>

        {step === "email" ? (
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-bold text-gray-800 text-lg mb-1">
              {lang === "en" ? "Enter your email" : "הכנס אימייל"}
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              {lang === "en" ? "We'll send you a sign-in link" : "נשלח לך קישור להתחברות"}
            </p>

            <div className="flex items-center border border-gray-200 rounded-xl px-3 py-3 mb-4 focus-within:border-raz-teal">
              <Mail size={18} className="text-gray-400 me-2 flex-shrink-0" />
              <input
                type="email"
                dir="ltr"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                className="flex-1 outline-none text-sm text-left bg-transparent"
                autoFocus
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button
              onClick={sendOtp}
              disabled={loading || !email.trim()}
              className="w-full bg-raz-teal text-white py-3.5 rounded-xl font-bold disabled:opacity-50 mb-4"
            >
              {loading
                ? (lang === "en" ? "Sending..." : "שולח...")
                : (lang === "en" ? "Send Sign-In Link" : "שלח קישור התחברות")}
            </button>

            <button onClick={() => router.push("/")} className="w-full text-center text-gray-400 text-sm">
              {lang === "en" ? "Continue as guest" : "המשך ללא התחברות"}
            </button>
          </div>

        ) : (
          /* Step 2: email sent — tell user to click the link */
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-raz-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-raz-teal" />
            </div>
            <h2 className="font-bold text-gray-800 text-lg mb-2">
              {lang === "en" ? "Check your inbox" : "בדוק את תיבת הדואר"}
            </h2>
            <p className="text-gray-500 text-sm mb-1">
              {lang === "en" ? "We sent a sign-in link to" : "שלחנו קישור התחברות אל"}
            </p>
            <p className="font-medium text-gray-800 mb-4" dir="ltr">{email}</p>
            <p className="text-gray-400 text-sm mb-6">
              {lang === "en"
                ? "Click the link in the email to sign in."
                : "לחץ על הקישור במייל כדי להתחבר."}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <RotateCcw size={14} />
              {resendCooldown > 0
                ? `${lang === "en" ? "Resend in" : "שלח שוב בעוד"} ${resendCooldown}s`
                : <button onClick={() => { setStep("email"); setError(""); }} className="text-raz-teal font-medium">
                    {lang === "en" ? "Try a different email" : "נסה אימייל אחר"}
                  </button>
              }
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
