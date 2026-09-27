import ManagerLanding from "@/components/landing/ManagerLanding";

export const metadata = {
  title: "Impactify | למנהלי עמותות",
  description: "הפלטפורמה שמחברת עמותות לתורמים ולקהילות תומכות.",
};

export default function NgoManagersLandingPage() {
  return <ManagerLanding kind="ngo" />;
}
