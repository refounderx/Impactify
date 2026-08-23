import AdminShell from "@/components/nonprofit-admin/AdminShell";
import { requireRole } from "@/lib/supabase/auth-server";
import { NgoAdminDataProvider } from "@/contexts/NgoAdminDataContext";

export default async function NonprofitAdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ngo_owner"]);
  return <NgoAdminDataProvider><AdminShell>{children}</AdminShell></NgoAdminDataProvider>;
}
