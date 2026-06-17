import {
  IconBadgeCheck,
  IconStar,
  IconTrendingUp,
  IconLock,
} from "@/features/landing/landingIcons";
import { Reveal } from "@/features/landing/Reveal";

type Criterion = {
  icon: (p: { className?: string }) => React.ReactElement;
  tint: string;
  title: string;
  body: string;
};

/** 4 critères — Figma node 963:3243. Teintes : vert, violet, rouge, jaune. */
const CRITERIA: Criterion[] = [
  {
    icon: IconBadgeCheck,
    tint: "#0cdda5",
    title: "Identité confirmée",
    body: "Photo cohérente, présence publique identifiable et informations concordantes.",
  },
  {
    icon: IconStar,
    tint: "#936bff",
    title: "Réseaux sociaux officiels",
    body: "Identification des comptes officiels associés à la personne recherchée.",
  },
  {
    icon: IconTrendingUp,
    tint: "#f84b5f",
    title: "Réputation publique",
    body: "Articles, publications et mentions accessibles publiquement.",
  },
  {
    icon: IconLock,
    tint: "#fec530",
    title: "Transparence de l'audit",
    body: "Chaque critère analysé est visible et justifié par ses sources.",
  },
];

/**
 * « Comment calculons-nous l'indice de confiance ? » — Figma node 963:3237.
 * En-tête (titre Quatty 32px + paragraphe) puis bloc blanc pleine largeur avec
 * 4 critères en liste. Remplace l'ancien « Comment ça fonctionne ».
 */
export function LandingHowItWorks() {
  return (
    <section id="how" className="flex w-full flex-col gap-[32px] md:gap-12" data-node-id="963:3237">
      {/* En-tête — aligné à gauche, cadré comme « Pourquoi utiliser unmask ? ». */}
      <Reveal as="div" className="mx-auto flex w-full max-w-[342px] flex-col items-start gap-[8px] px-[24px] md:max-w-[1153px] md:px-0">
        <h2 className="font-landing-display text-[32px] leading-[32px] tracking-[0.0703px] text-[var(--ld-text)]">
          Comment calculons-nous{" "}
          <span className="text-[#936bff]">l&apos;indice de confiance</span> ?
        </h2>
        <p className="max-w-[320px] font-landing-body text-[14px] leading-[20px] tracking-[-0.1504px] text-[var(--ld-text-muted)] md:max-w-[520px] md:text-[16px] md:leading-[24px]">
          Notre méthodologie repose sur des informations publiques et vérifiables.
        </p>
      </Reveal>

      {/* Mobile : bloc surface pleine largeur. Desktop : carte contenue, radius 15,
          padding x24 y48 (maquette node 1262:7306). */}
      <div className="w-full bg-[var(--ld-surface)] px-[24px] py-[48px] md:mx-auto md:max-w-[1153px] md:rounded-[15px]">
        {/* Mobile : liste verticale. Desktop : grille 2 colonnes. */}
        <div className="mx-auto grid w-full max-w-[342px] grid-cols-1 gap-[16px] md:max-w-none md:grid-cols-2 md:gap-x-[16px] md:gap-y-[16px]">
          {CRITERIA.map((c, i) => (
            <Reveal key={c.title} delay={i * 60}>
              <CriterionRow {...c} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CriterionRow({ icon: Icon, tint, title, body }: Criterion) {
  return (
    <div className="flex items-start gap-[16px]">
      {/* Pastille ronde 48×48, fond = teinte @13% (Figma node 963:3245) */}
      <div
        className="flex size-[48px] shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: tint + "21", color: tint }}
      >
        <Icon className="size-[20px]" />
      </div>
      <div className="flex flex-col items-start gap-[8px]">
        <h3 className="font-landing-body font-medium text-[18px] leading-[27px] tracking-[-0.4395px] text-[var(--ld-text)]">
          {title}
        </h3>
        <p className="font-landing-body text-[14px] leading-[22.75px] tracking-[-0.1504px] text-[var(--ld-text-muted)]">
          {body}
        </p>
      </div>
    </div>
  );
}
