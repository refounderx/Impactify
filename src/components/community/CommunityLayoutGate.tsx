"use client";

import { usePathname } from "next/navigation";
import { CommunityAdminDataProvider } from "@/contexts/CommunityAdminDataContext";
import AdminShell from "@/components/nonprofit-admin/AdminShell";

export default function CommunityLayoutGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/community/onboarding") return children;
  return <CommunityAdminDataProvider><AdminShell variant="community">{children}</AdminShell></CommunityAdminDataProvider>;
}
