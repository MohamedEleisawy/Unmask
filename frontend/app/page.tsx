import { LandingNavbar } from "@/features/landing/LandingNavbar";
import { LandingHero } from "@/features/landing/LandingHero";
import { LandingHowItWorks } from "@/features/landing/LandingHowItWorks";
import { LandingFooter } from "@/features/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--au-bg)" }}>
      <LandingNavbar />
      <LandingHero />
      <LandingHowItWorks />
      <LandingFooter />
    </div>
  );
}
