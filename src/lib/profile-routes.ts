import type { AppRole } from "@/lib/supabase/types";

export function profilePathForRole(role?: AppRole | null) {
  if (role === "ngo_owner") return "/nonprofit/profile";
  if (role === "community_owner") return "/community/profile";
  if (role === "admin") return "/admin/profile";
  return "/profile";
}
