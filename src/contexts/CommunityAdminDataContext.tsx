"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCommunityAdminData, type CommunityAdminData } from "@/lib/supabase/queries-community-admin";

type State = { data: CommunityAdminData | null; loading: boolean; error: string | null; reload: () => void };
const Context = createContext<State>({ data: null, loading: true, error: null, reload: () => {} });

export function CommunityAdminDataProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<Omit<State, "reload">>({ data: null, loading: true, error: null });
  useEffect(() => {
    let active = true;
    getCommunityAdminData().then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error: unknown) => active && setState({ data: null, loading: false, error: error instanceof Error ? error.message : "Unable to load community data" }));
    return () => { active = false; };
  }, [version]);
  function reload() {
    setState((current) => ({ ...current, loading: true, error: null }));
    setVersion((value) => value + 1);
  }
  return <Context.Provider value={{ ...state, reload }}>{children}</Context.Provider>;
}

export const useCommunityAdminData = () => useContext(Context);
