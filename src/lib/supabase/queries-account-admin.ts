import { createClient } from "@/lib/supabase/client";
import type { AppRole, Profile } from "@/lib/supabase/types";

export type AdminDirectory = {
  profiles: Profile[];
  organizations: { id: string; name: string; name_en: string | null }[];
  communities: { id: string; name: string; name_en: string | null }[];
};

export async function getAdminDirectory(): Promise<AdminDirectory> {
  const sb = createClient();
  const [profiles, organizations, communities] = await Promise.all([
    sb.from("profiles").select("*").order("created_at"),
    sb.from("organizations").select("id, name, name_en").order("name"),
    sb.from("communities").select("id, name, name_en").order("name"),
  ]);
  const error = profiles.error ?? organizations.error ?? communities.error;
  if (error) throw new Error(error.message);
  return {
    profiles: profiles.data ?? [],
    organizations: organizations.data ?? [],
    communities: communities.data ?? [],
  };
}

export async function updateProfileRole(
  profileId: string,
  role: AppRole,
  orgId: string | null,
  communityId: string | null
) {
  const sb = createClient();
  const { error } = await sb.rpc("admin_update_profile_role", {
    p_profile_id: profileId,
    p_role: role,
    p_org_id: orgId,
    p_community_id: communityId,
  });
  if (error) throw new Error(error.message);
}

export async function deleteUser(userId: string) {
  const sb = createClient();
  const { error } = await sb.rpc("admin_delete_user", { p_user_id: userId });
  if (error) throw new Error(error.message);
}
