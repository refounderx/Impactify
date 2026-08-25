import { createClient } from "@/lib/supabase/client";
import type { OrganizationGoal } from "@/lib/supabase/types";

export async function getOrganizationGoals(orgId: string): Promise<OrganizationGoal[]> {
  const sb = createClient();
  const { data, error } = await sb.from("organizations").select("goals").eq("id", orgId).single();
  if (error) throw new Error(error.message);
  return data?.goals ?? [];
}

export async function updateOrganizationGoals(goals: OrganizationGoal[]) {
  const sb = createClient();
  const { error } = await sb.rpc("update_ngo_goals", { p_goals: goals });
  if (error) throw new Error(error.message);
}
