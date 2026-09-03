import { requireRole } from "@/lib/supabase/auth-server";
import CommunityLayoutGate from "@/components/community/CommunityLayoutGate";

export default async function CommunityAdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["community_owner"]);
  return <CommunityLayoutGate>{children}</CommunityLayoutGate>;
}
