import AdminShell from "@/components/nonprofit-admin/AdminShell";
import { requireRole } from "@/lib/supabase/auth-server";
import { CommunityAdminDataProvider } from "@/contexts/CommunityAdminDataContext";

export default async function CommunityAdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["community_owner"]);
  return <CommunityAdminDataProvider><AdminShell variant="community">{children}</AdminShell></CommunityAdminDataProvider>;
}
