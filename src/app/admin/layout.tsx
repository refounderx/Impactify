import { requireRole } from "@/lib/supabase/auth-server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"]);
  return children;
}
