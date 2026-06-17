import { LandingNavbar } from "@/features/landing/LandingNavbar";
import { LandingHero } from "@/features/landing/LandingHero";
import { LandingFeaturesGrid } from "@/features/landing/LandingFeaturesGrid";
import { LandingHowItWorks } from "@/features/landing/LandingHowItWorks";
import { LandingCTA } from "@/features/landing/LandingCTA";
import { LandingFooter } from "@/features/landing/LandingFooter";

/**
 * Landing — implémentation de la maquette Figma (node 963:3171).
 * Fond #eee, sections empilées avec un gap de 48px (navbar et footer en pleine
 * largeur violette). Tous les éléments fonctionnels (formulaire, thème) conservés.
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--ld-bg)]">
      <LandingNavbar />
      <main className="flex flex-col gap-[48px] pt-[48px] md:gap-[120px] md:pt-[120px]">
        <LandingHero />
        <LandingFeaturesGrid />
        <LandingHowItWorks />
        <LandingCTA />
      </main>
      <div className="mt-[48px] md:mt-[120px]">
        <LandingFooter />
      </div>
    </div>
  );
}
