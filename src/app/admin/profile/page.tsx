import ProfileShell from "@/components/profile/ProfileShell";
import UnifiedProfileContent from "@/components/profile/UnifiedProfileContent";

export default function AdminProfilePage() {
  return <ProfileShell variant="admin"><UnifiedProfileContent showSignOut /></ProfileShell>;
}
