import NgoOnboardingFlow from "@/components/onboarding/NgoOnboardingFlow";
import { requireRole } from "@/lib/supabase/auth-server";

export default async function NgoOnboardingPage() {
  await requireRole(["ngo_owner"]);
  return <NgoOnboardingFlow />;
}
