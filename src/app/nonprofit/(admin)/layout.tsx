import AdminShell from "@/components/nonprofit-admin/AdminShell";

export default function NonprofitAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
