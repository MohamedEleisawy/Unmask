import type { Metadata } from "next";
import { LandingNavbar } from "@/features/landing/LandingNavbar";
import { LandingFooter } from "@/features/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Mentions légales — Unmask",
  description: "Mentions légales du service Unmask : éditeur, hébergeur, propriété intellectuelle et traitement des données.",
};

/**
 * Page Mentions légales — réutilise la navbar et le footer de la landing pour
 * rester sur la marque et conserver le retour « Accueil ». Mise en page sobre
 * (DESIGN.md : profondeur par tons, pas d'ombre), corps plafonné à ~70ch.
 *
 * Les champs entre crochets sont à compléter avec les informations réelles de
 * l'éditeur et de l'hébergeur avant publication.
 */
export default function MentionsLegalesPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--ld-bg)]">
      <LandingNavbar />

      <main className="mx-auto w-full max-w-[760px] flex-1 px-[24px] pt-[48px] pb-[64px] md:px-10 md:pt-[72px]">
        <h1 className="text-balance font-landing-display text-[40px] leading-[44px] tracking-[-0.02em] text-[var(--ld-text)] md:text-[56px] md:leading-[56px]">
          Mentions légales
        </h1>
        <p className="mt-[16px] font-landing-body text-[15px] leading-[24px] text-[var(--ld-text-muted)]">
          Dernière mise à jour : 17 juin 2026.
        </p>

        <div className="mt-[40px] flex flex-col gap-[40px]">
          <LegalSection title="Éditeur du site">
            <p>
              Le service Unmask est édité par [Raison sociale / Nom de l&apos;éditeur],
              [forme juridique et capital social le cas échéant], dont le siège est
              situé [adresse complète].
            </p>
            <Definition label="Immatriculation" value="[SIREN / SIRET / RCS]" />
            <Definition label="Directeur de la publication" value="[Nom du responsable]" />
            <Definition label="Contact" value="[adresse e-mail de contact]" />
          </LegalSection>

          <LegalSection title="Hébergement">
            <p>
              Le site est hébergé par [Nom de l&apos;hébergeur], [adresse de
              l&apos;hébergeur], joignable au [téléphone ou e-mail de l&apos;hébergeur].
            </p>
          </LegalSection>

          <LegalSection title="Objet du service">
            <p>
              Unmask est un outil d&apos;audit de crédibilité qui agrège des sources
              publiques vérifiables (registres officiels, listes noires AMF/ACPR,
              réputation presse, signaux issus des plateformes publiques) afin de
              produire un indice de confiance accompagné de ses preuves.
            </p>
            <p>
              Unmask ne porte pas de jugement et ne se substitue pas à une décision
              de justice ou à une vérification professionnelle. Le service présente
              des faits sourcés ; l&apos;interprétation finale revient à
              l&apos;utilisateur.
            </p>
          </LegalSection>

          <LegalSection title="Données personnelles">
            <p>
              Unmask fonctionne selon un principe de zéro stockage : les analyses
              sont traitées en mémoire vive le temps de la requête, puis aucune
              donnée d&apos;audit n&apos;est conservée sur disque ni en base.
            </p>
            <p>
              Les sources consultées sont des informations publiques accessibles à
              tout internaute. Conformément au RGPD, toute personne concernée peut
              exercer ses droits d&apos;accès, de rectification et d&apos;opposition
              en écrivant à [adresse e-mail de contact].
            </p>
          </LegalSection>

          <LegalSection title="Propriété intellectuelle">
            <p>
              La structure du site, son identité visuelle, ses textes et son code
              sont la propriété de l&apos;éditeur, sauf mention contraire. Toute
              reproduction ou réutilisation sans autorisation préalable est
              interdite. Les marques et logos des tiers cités (plateformes,
              registres) restent la propriété de leurs détenteurs respectifs.
            </p>
          </LegalSection>

          <LegalSection title="Responsabilité">
            <p>
              Les informations restituées proviennent de sources externes dont
              l&apos;éditeur ne maîtrise pas l&apos;exactitude ni l&apos;exhaustivité.
              Un audit peut être partiel lorsqu&apos;un élément d&apos;identification
              manque ; l&apos;interface le signale alors explicitement. L&apos;éditeur
              ne saurait être tenu responsable d&apos;une décision prise sur la seule
              base d&apos;un audit.
            </p>
          </LegalSection>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

/** Section légale : titre Satoshi + prose plafonnée, profondeur par tons. */
function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-[12px] border-t border-[var(--ld-border-solid)] pt-[24px]">
      <h2 className="font-landing-body text-[20px] font-bold text-[var(--ld-text)]">{title}</h2>
      <div className="flex flex-col gap-[12px] font-landing-body text-[15px] leading-[26px] text-[var(--ld-text-muted)] [&_p]:max-w-[68ch]">
        {children}
      </div>
    </section>
  );
}

/** Ligne libellé / valeur pour les coordonnées de l'éditeur. */
function Definition({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[var(--ld-text)]">
      <span className="font-medium">{label} : </span>
      <span className="text-[var(--ld-text-muted)]">{value}</span>
    </p>
  );
}
