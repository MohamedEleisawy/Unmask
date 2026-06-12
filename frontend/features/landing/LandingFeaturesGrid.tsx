import {
  IconUsers,
  IconAward,
  IconZap,
  IconShield,
} from "@/features/landing/landingIcons";

type Feature = {
  icon: (p: { className?: string }) => React.ReactElement;
  tint: string;
  title: string;
  body: string;
};

/** 2×2 cartes — Figma node 963:3208. Teintes : jaune, rouge, vert, violet. */
const FEATURES: Feature[] = [
  {
    icon: IconUsers,
    tint: "#fec530",
    title: "Voir au-delà de l'image",
    body: "Les réseaux sociaux montrent ce qu'une personne choisit de publier. Nous rassemblons également les informations publiques disponibles ailleurs sur le web.",
  },
  {
    icon: IconAward,
    tint: "#f84b5f",
    title: "Obtenir un indice de confiance",
    body: "Chaque profil est évalué selon une série de critères transparents afin de fournir un indicateur simple à comprendre.",
  },
  {
    icon: IconZap,
    tint: "#0cdda5",
    title: "Comprendre le contexte",
    body: "Entreprises associées, présence en ligne, réputation publique et vérifications réglementaires sont regroupées dans une seule fiche.",
  },
  {
    icon: IconShield,
    tint: "#936bff",
    title: "Garder votre esprit critique",
    body: "Le score n'est pas une vérité absolue. Toutes les sources utilisées sont accessibles pour vous permettre de vous faire votre propre avis.",
  },
];

/**
 * « Pourquoi utiliser unmask ? » — grille 2×2 reprise de la maquette Figma
 * (node 963:3196). Titre Quatty 32px, cartes blanches, icônes teintées.
 */
export function LandingFeaturesGrid() {
  return (
    <section className="w-full px-[24px] md:px-10" data-node-id="963:3196">
      <div className="mx-auto flex w-full max-w-[342px] flex-col items-start gap-[16px] md:max-w-[1200px] md:gap-10">
        <h2 className="flex flex-wrap items-baseline gap-x-[0.28em] font-landing-display text-[32px] leading-[32px] tracking-[0.0703px] text-[var(--ld-text)] md:text-[48px] md:leading-[48px]">
          <span>Pourquoi utiliser</span>
          <UnmaskWordmark />
          <span aria-hidden="true">?</span>
        </h2>

        {/* Mobile : 2 colonnes (Figma node 963:3208). Desktop : 4 colonnes, une rangée. */}
        <div className="grid w-full grid-cols-2 gap-x-[16px] gap-y-[15px] md:grid-cols-4 md:gap-6">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, tint, title, body }: Feature) {
  return (
    <article className="flex h-full flex-col items-start gap-[8px] rounded-[12px] bg-[var(--ld-surface)] p-[20px] shadow-[inset_0_0_0_1px_var(--ld-border)] transition-shadow md:hover:shadow-[0_16px_40px_rgba(37,20,29,0.08)]">
      {/* Pastille icône 40×40, fond = teinte @13% (Figma node 963:3210) */}
      <div
        className="flex size-[40px] items-center justify-center rounded-[12px]"
        style={{ backgroundColor: tint + "21", color: tint }}
      >
        <Icon className="size-[20px]" />
      </div>
      <h3 className="font-landing-body font-medium text-[14px] leading-[20px] tracking-[-0.1504px] text-[var(--ld-text)]">
        {title}
      </h3>
      <p className="font-landing-body text-[12px] leading-[19.5px] text-[var(--ld-text-muted)]">
        {body}
      </p>
    </article>
  );
}

/** Logo « unmask » inline dans le titre — version sombre (#25141d). */
function UnmaskWordmark() {
  return (
    <svg
      width="76"
      height="14"
      viewBox="0 0 66 12.05"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="unmask"
      role="img"
      className="inline-block h-[0.72em] w-auto self-baseline"
    >
      <path d="M10.3809 11.7657V7.18792C10.3809 4.65809 12.489 2.59006 15.059 2.59006C17.6491 2.59006 19.7573 4.65809 19.7573 7.18792V11.7657H17.2877V6.98714C17.2877 5.80254 16.2838 4.81872 15.059 4.81872C13.8343 4.81872 12.8504 5.80254 12.8504 6.98714V11.7657H10.3809ZM27.0997 11.7657V6.7462C27.0997 5.70215 26.1962 4.81872 25.112 4.81872C24.0278 4.81872 23.1443 5.70215 23.1443 6.7462V11.7657H20.6747V6.94698C20.6747 4.5577 22.6625 2.59006 25.112 2.59006C26.2564 2.59006 27.3406 3.03178 28.1839 3.79474L28.3244 3.93529L28.4851 3.79474C29.3083 3.03178 30.3925 2.59006 31.5369 2.59006C33.9864 2.59006 35.9942 4.5577 35.9942 6.94698V11.7657H33.5246V6.7462C33.5246 5.70215 32.6412 4.81872 31.5369 4.81872C30.4527 4.81872 29.5693 5.70215 29.5693 6.7462V11.7657H27.0997Z" fill="currentColor"/>
      <path d="M43.8968 9.33626C44.2983 8.9347 44.5594 8.39259 44.6397 7.85049C44.9007 6.14386 43.8365 4.5577 41.9894 4.5577C40.865 4.5577 39.9213 5.18012 39.4997 6.2041C39.2186 6.88675 39.2186 7.77018 39.4997 8.45283C39.7808 9.1154 40.2627 9.63743 40.9453 9.91852C41.5477 10.1595 42.2504 10.1795 42.8728 9.97875C43.2543 9.85829 43.6157 9.63743 43.8968 9.33626ZM47.0691 11.7657H44.6397V11.083L44.2983 11.3039C43.5555 11.7858 42.7523 12.0468 41.8689 12.0468C41.126 12.0669 40.4233 11.9665 39.7607 11.6854C39.1785 11.4444 38.6564 11.1031 38.2147 10.6614C37.3313 9.77797 36.9096 8.5733 36.9096 7.32846C36.9096 5.36082 38.0541 3.71443 39.9013 2.97154C41.1662 2.4696 42.7925 2.4696 44.0373 2.97154C45.9046 3.71443 47.0691 5.36082 47.0691 7.32846V11.7657Z" fill="#936BFF"/>
      <path d="M9.37641 2.89123V7.46901C9.37641 9.99883 7.26822 12.0669 4.67817 12.0669C2.10819 12.0669 0 9.99883 0 7.46901V2.89123H2.46959V7.66979C2.46959 8.85439 3.45341 9.83821 4.67817 9.83821C5.90292 9.83821 6.90682 8.85439 6.90682 7.66979V2.89123H9.37641Z" fill="currentColor"/>
      <path d="M56.2927 6.38776e-06V7.20799L59.7461 2.91131L62.4967 2.89123L58.9429 7.32846L62.4967 11.7657L59.7461 11.7456L57.5776 9.03509L56.2927 10.6212V11.7657H53.8833V6.38776e-06H56.2927Z" fill="#936BFF"/>
      <path d="M53.8487 8.99166C53.9325 9.195 53.9889 9.40684 54.0796 9.61109L55.0307 4.72241C54.4791 5.19688 53.731 6.69746 52.8372 6.08736C52.0644 5.55984 51.858 4.60245 50.8366 4.31977C50.5347 4.2372 50.2172 4.23086 49.9123 4.30129C49.2255 4.45951 48.6494 5.01671 48.8306 5.75387C49.0637 6.70235 50.1596 6.86797 50.9559 7.00528C51.588 7.11427 52.3547 7.40461 52.871 7.7769C53.3031 8.08233 53.6418 8.50307 53.8487 8.99166Z" fill="#936BFF"/>
      <path d="M46.7688 6.51376C46.76 6.41836 46.7596 6.28945 46.7598 6.10187L46.7688 6.51376C46.7975 6.82518 46.915 6.77968 47.3863 7.25317C47.9064 7.77555 48.5835 8.08411 49.2806 8.30801C50.1599 8.59042 51.1066 8.50247 51.7003 9.35929C51.8377 9.55746 51.921 9.8236 51.9218 10.0638C51.9253 10.3398 51.8186 10.6057 51.6256 10.8021C51.2989 11.131 50.8386 11.272 50.3864 11.2688C49.9085 11.2654 49.4783 11.1235 49.1391 10.7791C48.6584 10.291 48.5234 9.52517 47.8227 9.27289C47.4744 9.1475 47.118 9.0913 46.8319 9.38995L46.7688 6.51376Z" fill="#936BFF"/>
      <circle cx="64.087" cy="10.9164" r="1.13043" fill="currentColor"/>
    </svg>
  );
}
