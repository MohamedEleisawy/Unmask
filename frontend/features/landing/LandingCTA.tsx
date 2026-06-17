import Link from "next/link";
import { IconArrowRight } from "@/features/landing/landingIcons";
import { Reveal } from "@/features/landing/Reveal";

/**
 * Bloc d'appel à l'action — « Faites-vous votre propre opinion. »
 * Figma node 963:3275. Titre Quatty 32px avec mot d'accent violet, paragraphe,
 * puis bouton « Vérifier un profil » menant à la recherche (haut de page).
 */
export function LandingCTA() {
  return (
    <section className="w-full px-[18px] md:px-10" data-node-id="963:3275">
      {/* Mobile : pile alignée à gauche. Desktop : bande contenue, centrée. */}
      <Reveal as="div" className="mx-auto flex w-full max-w-[354px] flex-col items-start gap-[16px] md:max-w-[760px] md:items-center md:gap-8 md:rounded-3xl md:bg-[var(--ld-surface)] md:px-12 md:py-16 md:text-center md:shadow-[0_24px_60px_rgba(37,20,29,0.06)]">
        <div className="flex flex-col items-start gap-[8px] md:items-center">
          <h2 className="font-landing-display text-[32px] leading-[32px] tracking-[0.0703px] text-[var(--ld-text)] md:text-[48px] md:leading-[48px]">
            Faites-vous votre propre <span className="text-[#936bff]">opinion</span>.
          </h2>
          <p className="max-w-[320px] text-pretty font-landing-body text-[14px] leading-[20px] tracking-[-0.1504px] text-[var(--ld-text-muted)] md:max-w-[520px] md:text-[16px] md:leading-[24px]">
            L&apos;indice de confiance n&apos;est qu&apos;un point de départ. Les
            sources, les critères et les informations utilisées restent accessibles
            pour que chacun puisse se forger sa propre opinion.
          </p>
        </div>

        <Link
          href="#"
          className="group flex h-[36px] items-center justify-center gap-[6px] rounded-[12px] bg-[#936bff] px-[8px] font-landing-body text-[14px] leading-[20px] tracking-[-0.1504px] text-[#f3f3f3] transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-[#7d54f0] active:-translate-y-px active:scale-[0.98] md:h-[44px] md:px-5 md:text-[15px]"
        >
          Vérifier un profil
          <IconArrowRight className="size-[16px] transition-transform duration-150 ease-[var(--ease-out)] group-hover:translate-x-0.5" />
        </Link>
      </Reveal>
    </section>
  );
}
