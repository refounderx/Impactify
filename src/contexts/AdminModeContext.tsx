"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminModeCtx {
  adminMode: boolean;
  toggleAdminMode: () => void;
}

const AdminModeContext = createContext<AdminModeCtx>({
  adminMode: false,
  toggleAdminMode: () => {},
});

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [adminMode, setAdminMode] = useState(false);
  const { profile, loading } = useAuth();
  const isAdmin = !loading && profile?.app_role === "admin";

  useEffect(() => {
    if (loading) return;
    const next = isAdmin && localStorage.getItem("it-admin-mode") === "1";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdminMode(next);
    if (!isAdmin) localStorage.removeItem("it-admin-mode");
  }, [isAdmin, loading]);

  function toggleAdminMode() {
    if (!isAdmin) return;
    setAdminMode((prev) => {
      const next = !prev;
      localStorage.setItem("it-admin-mode", next ? "1" : "0");
      return next;
    });
  }

  return (
    <AdminModeContext.Provider value={{ adminMode: isAdmin && adminMode, toggleAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export const useAdminMode = () => useContext(AdminModeContext);
