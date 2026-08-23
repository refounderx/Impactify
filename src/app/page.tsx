import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/landing/Hero";
import ProductCarousel from "@/components/landing/ProductCarousel";
import ImpactStatsGrid from "@/components/landing/ImpactStatsGrid";
import WhyJoinSection from "@/components/landing/WhyJoinSection";
import SignupSection from "@/components/landing/SignupSection";
import VideoSection from "@/components/landing/VideoSection";
import ContactCTA from "@/components/landing/ContactCTA";
import MascotDonationForm from "@/components/landing/MascotDonationForm";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <LandingHeader />
      <Hero />
      <ProductCarousel />
      <ImpactStatsGrid />
      <WhyJoinSection />
      <SignupSection />
      <VideoSection />
      <ContactCTA />
      <MascotDonationForm />
      <LandingFooter />
    </div>
  );
}
