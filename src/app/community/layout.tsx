import AdminShell from "@/components/nonprofit-admin/AdminShell";

export default function CommunityAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell variant="community">{children}</AdminShell>;
}
