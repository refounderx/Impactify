import { requireRole } from "@/lib/supabase/auth-server";

export default async function CreateCampaignLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ngo_owner"]);
  return children;
}
