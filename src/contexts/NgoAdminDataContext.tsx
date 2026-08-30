"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getNgoAdminData, type NgoAdminData } from "@/lib/supabase/queries-ngo-admin";

type State = { data: NgoAdminData | null; loading: boolean; error: string | null; reload: () => void };
const Context = createContext<State>({ data: null, loading: true, error: null, reload: () => {} });

export function NgoAdminDataProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<Omit<State, "reload">>({ data: null, loading: true, error: null });
  useEffect(() => {
    let active = true;
    getNgoAdminData().then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error: unknown) => active && setState({ data: null, loading: false, error: error instanceof Error ? error.message : "Unable to load NGO data" }));
    return () => { active = false; };
  }, [pathname, version]);
  function reload() {
    setState((current) => ({ ...current, loading: true, error: null }));
    setVersion((value) => value + 1);
  }
  return <Context.Provider value={{ ...state, reload }}>{children}</Context.Provider>;
}

export const useNgoAdminData = () => useContext(Context);
