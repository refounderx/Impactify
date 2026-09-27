import ManagerLanding from "@/components/landing/ManagerLanding";

export const metadata = {
  title: "Impactify | למנהלי קהילות",
  description: "הפלטפורמה שמחברת קהילות להשפעה אמיתית.",
};

export default function CommunityManagersLandingPage() {
  return <ManagerLanding kind="community" />;
}
