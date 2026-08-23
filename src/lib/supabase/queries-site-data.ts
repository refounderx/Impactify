import { createClient } from "@/lib/supabase/client";
import type { SiteDatasetKey, SiteDatasetMap } from "@/lib/site-dataset-types";

export async function getSiteDatasets(): Promise<SiteDatasetMap> {
  const sb = createClient();
  const { data, error } = await sb
    .from("site_datasets")
    .select("key, value");

  if (error) throw new Error(`Unable to load site datasets: ${error.message}`);

  const datasets = Object.fromEntries(
    (data ?? []).map((row) => [row.key, row.value])
  ) as Partial<SiteDatasetMap>;
  const required: SiteDatasetKey[] = ["shared", "landing", "nonprofit_admin", "community_admin"];
  const missing = required.filter((key) => !datasets[key]);
  if (missing.length > 0) throw new Error(`Missing site datasets: ${missing.join(", ")}`);

  return datasets as SiteDatasetMap;
}
