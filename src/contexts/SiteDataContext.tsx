"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSiteDatasets } from "@/lib/supabase/queries-site-data";
import type { SiteDatasetKey, SiteDatasetMap } from "@/lib/site-dataset-types";

type SiteDataState = {
  datasets: SiteDatasetMap | null;
  loading: boolean;
  error: string | null;
};

const SiteDataContext = createContext<SiteDataState>({ datasets: null, loading: true, error: null });

export function SiteDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SiteDataState>({ datasets: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    getSiteDatasets()
      .then((datasets) => active && setState({ datasets, loading: false, error: null }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unable to load site data";
        if (active) setState({ datasets: null, loading: false, error: message });
      });
    return () => { active = false; };
  }, []);

  return <SiteDataContext.Provider value={state}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  return useContext(SiteDataContext);
}

export function useSiteDataset<K extends SiteDatasetKey>(key: K) {
  const state = useSiteData();
  return { ...state, data: state.datasets?.[key] ?? null };
}
