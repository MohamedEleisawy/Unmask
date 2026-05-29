import { LandingNavbar } from "@/features/landing/LandingNavbar";
import { LandingHero } from "@/features/landing/LandingHero";
import { LandingHowItWorks } from "@/features/landing/LandingHowItWorks";
import { LandingFooter } from "@/features/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#101010]">
      <LandingNavbar />
      <LandingHero />
      <LandingHowItWorks />
      <LandingFooter />
    </div>
  );
}
