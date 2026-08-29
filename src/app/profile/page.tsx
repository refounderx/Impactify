import BottomNav from "@/components/layout/BottomNav";
import UnifiedProfileContent from "@/components/profile/UnifiedProfileContent";
import { getServerProfile } from "@/lib/supabase/auth-server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const profile = await getServerProfile();
  if (profile?.app_role === "ngo_owner") redirect("/nonprofit/profile");

  return (
    <div className="min-h-screen bg-raz-surface px-5 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl pb-20"><UnifiedProfileContent showSignOut /></div>
      <BottomNav variant="donor" />
    </div>
  );
}
