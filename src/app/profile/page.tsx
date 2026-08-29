import ProfileShell from "@/components/profile/ProfileShell";
import UnifiedProfileContent from "@/components/profile/UnifiedProfileContent";
import { getServerProfile } from "@/lib/supabase/auth-server";
import { profilePathForRole } from "@/lib/profile-routes";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const profile = await getServerProfile();
  if (profile && profile.app_role !== "donor") redirect(profilePathForRole(profile.app_role));

  return (
    <ProfileShell variant="donor"><UnifiedProfileContent showSignOut /></ProfileShell>
  );
}
