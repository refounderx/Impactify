"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { useLang } from "@/contexts/LanguageContext";

type AuthNotice = "offline" | "connection_error" | "signed_out" | null;

interface AuthCtx {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

const sb = createClient();

async function fetchProfile(userId: string) {
  const { data, error } = await sb.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useLang();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<AuthNotice>(null);
  const activeUserId = useRef<string | null>(null);
  const hadSession = useRef(false);

  const loadProfile = useCallback(async (nextUser: User) => {
    try {
      const nextProfile = await fetchProfile(nextUser.id);
      if (activeUserId.current === nextUser.id) setProfile(nextProfile);
    } catch {
      if (activeUserId.current === nextUser.id) setNotice("connection_error");
    }
  }, []);

  const applySession = useCallback((session: Session | null, showSignedOut = false) => {
    const nextUser = session?.user ?? null;
    activeUserId.current = nextUser?.id ?? null;
    setUser(nextUser);
    if (nextUser) {
      hadSession.current = true;
      setNotice(null);
      setTimeout(() => void loadProfile(nextUser), 0);
    } else {
      setProfile(null);
      if (showSignedOut && hadSession.current) setNotice("signed_out");
    }
  }, [loadProfile]);

  useEffect(() => {
    let active = true;

    void sb.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setNotice("connection_error");
      else applySession(data.session);
      setLoading(false);

      if (data.session) {
        void sb.auth.getUser().then(({ data: userData, error: userError }) => {
          if (!active) return;
          if (userError) setNotice("connection_error");
          else if (!userData.user) applySession(null, true);
        });
      }
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      applySession(session, event === "SIGNED_OUT");
    });

    async function reconcileSession() {
      const { data, error } = await sb.auth.getSession();
      if (!active) return;
      if (error) setNotice("connection_error");
      else applySession(data.session, hadSession.current);
    }

    function wentOffline() { setNotice("offline"); }
    function cameOnline() { void reconcileSession(); }
    function becameVisible() { if (document.visibilityState === "visible") void reconcileSession(); }
    window.addEventListener("offline", wentOffline);
    window.addEventListener("online", cameOnline);
    document.addEventListener("visibilitychange", becameVisible);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("offline", wentOffline);
      window.removeEventListener("online", cameOnline);
      document.removeEventListener("visibilitychange", becameVisible);
    };
  }, [applySession]);

  async function signOut() {
    const { error } = await sb.auth.signOut();
    if (error) {
      setNotice("connection_error");
      return;
    }
    applySession(null, true);
    window.location.replace("/auth");
  }

  async function refreshProfile() {
    if (user) await loadProfile(user);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
      {notice && <SessionNotice notice={notice} lang={lang} onClose={() => setNotice(null)} />}
    </AuthContext.Provider>
  );
}

function SessionNotice({ notice, lang, onClose }: { notice: Exclude<AuthNotice, null>; lang: "he" | "en"; onClose: () => void }) {
  const offline = notice === "offline";
  const text = lang === "en"
    ? (offline ? "No network connection. Your session will be checked when the connection returns." : notice === "signed_out" ? "Your session ended. Sign in again to continue." : "We could not verify the session. Your current session was preserved and will be checked again.")
    : (offline ? "אין חיבור לרשת. החיבור למשתמש ייבדק שוב כשהרשת תחזור." : notice === "signed_out" ? "החיבור למשתמש הסתיים. יש להתחבר מחדש כדי להמשיך." : "לא הצלחנו לאמת את החיבור. החיבור הקיים נשמר וייבדק שוב.");

  return (
    <div role="alert" className="fixed bottom-5 start-1/2 z-[120] flex w-[min(92vw,42rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-2xl">
      <span className="flex-1">{text}</span>
      {notice === "signed_out" && <a href="/auth" className="whitespace-nowrap rounded-full bg-raz-teal px-4 py-2 font-bold text-white">{lang === "en" ? "Sign in" : "התחברות"}</a>}
      <button type="button" onClick={onClose} className="min-h-10 min-w-10 rounded-full text-slate-500 hover:bg-slate-100" aria-label={lang === "en" ? "Dismiss" : "סגירת ההודעה"}>×</button>
    </div>
  );
}

export const useAuth = () => useContext(AuthContext);
