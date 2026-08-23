import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/lib/supabase/types";

export function homeForRole(role: AppRole) {
  if (role === "ngo_owner") return "/nonprofit";
  if (role === "community_owner") return "/community";
  if (role === "admin") return "/admin/users";
  return "/";
}

export async function getServerProfile(): Promise<Profile | null> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", user.id).single();
  return data ?? null;
}

export async function requireRole(allowed: AppRole[]) {
  const profile = await getServerProfile();
  if (!profile) redirect("/auth");
  if (!profile.onboarding_completed_at) redirect("/auth/setup");
  if (!allowed.includes(profile.app_role)) redirect(homeForRole(profile.app_role));
  return profile;
}
