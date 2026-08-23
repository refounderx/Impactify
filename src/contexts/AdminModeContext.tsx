"use client";
import { createContext, useContext, useState, useEffect } from "react";

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

  useEffect(() => {
    setAdminMode(localStorage.getItem("it-admin-mode") === "1");
  }, []);

  function toggleAdminMode() {
    setAdminMode((prev) => {
      const next = !prev;
      localStorage.setItem("it-admin-mode", next ? "1" : "0");
      return next;
    });
  }

  return (
    <AdminModeContext.Provider value={{ adminMode, toggleAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export const useAdminMode = () => useContext(AdminModeContext);
