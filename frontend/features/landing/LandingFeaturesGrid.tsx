import {
  IconUsers,
  IconAward,
  IconZap,
  IconShield,
} from "@/features/landing/landingIcons";
import { Reveal } from "@/features/landing/Reveal";

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
      <div className="mx-auto flex w-full max-w-[342px] flex-col items-start gap-[16px] md:max-w-[1153px]">
        <Reveal as="div">
          <h2 className="flex flex-wrap items-baseline gap-x-[0.28em] font-landing-display text-[32px] leading-[32px] tracking-[0.0703px] text-[var(--ld-text)]">
            <span>Pourquoi utiliser</span>
            <UnmaskWordmark />
            <span aria-hidden="true">?</span>
          </h2>
        </Reveal>

        {/* Mobile : 2 colonnes (Figma node 963:3208). Desktop : 4 colonnes, une rangée. */}
        <div className="grid w-full grid-cols-2 gap-x-[16px] gap-y-[15px] md:grid-cols-4 md:gap-[16px]">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} as="article" delay={i * 60} className="h-full">
              <FeatureCard {...f} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, tint, title, body }: Feature) {
  return (
    <div className="flex h-full flex-col items-start gap-[8px] rounded-[12px] bg-[var(--ld-surface)] p-[20px] shadow-[inset_0_0_0_1px_var(--ld-border)] transition-shadow md:hover:shadow-[0_16px_40px_rgba(37,20,29,0.08)]">
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
    </div>
  );
}

/**
 * Logo « unmask » inline dans le titre. Les lettres suivent la couleur du texte
 * (`currentColor` → var(--ld-text)) pour rester lisibles en light comme en dark ;
 * « ask » + le point restent violets (#936BFF), couleur de marque.
 */
function UnmaskWordmark() {
  return (
<svg viewBox="0 0 395 70" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="inline-block h-[0.65em] w-auto self-center text-[var(--ld-text)]">
<circle cx="389.5" cy="61.5" r="8.5" fill="#936BFF"/>
<path d="M342.047 0V41.4459L361.904 16.74L377.721 16.6246L357.286 42.1386L377.721 67.6527L361.904 67.5372L349.436 51.9517L342.047 61.0721V67.6527H328.193V0H342.047Z" fill="#936BFF"/>
<path d="M309.374 53.3371C309.028 54.9534 307.989 56.2233 306.488 57.1469C304.526 58.4168 302.217 58.7632 299.908 58.7632C297.599 58.7632 294.597 58.6477 292.519 57.3778C290.787 56.4542 289.864 54.9534 289.864 52.9908C289.864 51.8363 290.325 50.7972 291.249 49.9891C292.173 49.181 293.327 48.7192 294.482 48.3728C295.982 47.7956 297.599 47.4492 299.1 47.2183C301.178 46.7565 303.256 46.2948 305.334 45.9484C306.488 45.6021 307.643 45.3712 308.797 45.1403C310.067 44.9094 311.222 44.4476 312.376 43.9858C313.531 43.524 314.685 42.9468 315.724 42.2541C316.879 41.5614 317.802 40.7532 318.61 39.8296C319.418 38.6752 320.111 37.5207 320.457 36.2508C321.035 34.6345 321.266 32.9028 321.266 31.2865C321.266 28.8621 320.804 26.5531 319.765 24.3596C318.841 22.397 317.456 20.6652 315.609 19.3953C313.531 17.779 310.991 16.74 308.335 16.0473C304.987 15.2392 301.293 14.8928 297.83 14.8928C294.828 14.8928 291.826 15.2392 288.94 16.1628C286.631 16.8554 284.438 18.0099 282.475 19.6262C280.743 21.0116 279.358 22.7433 278.434 24.8214C277.742 26.5531 277.28 28.4003 277.164 30.2474H291.134C291.48 28.9775 292.173 27.9385 293.212 27.1303C294.828 25.8604 296.906 25.3986 298.984 25.3986C301.062 25.3986 303.487 25.745 305.218 27.0149C306.604 28.0539 307.527 29.4393 307.527 31.171C307.527 31.9792 307.181 32.9028 306.604 33.5954C305.911 34.2881 305.103 34.8654 304.179 35.0963C303.025 35.5581 301.87 35.789 300.716 36.0199C299.1 36.3662 297.483 36.5971 295.867 36.828C293.096 37.2898 290.441 37.7516 287.786 38.4443C285.477 39.0215 283.168 39.9451 281.205 41.0996C279.358 42.1386 277.972 43.524 276.933 45.3712C275.664 47.3338 275.317 49.6428 275.317 51.9517C275.317 54.607 275.779 57.2623 277.164 59.6868C278.319 61.8803 280.051 63.7274 282.244 65.1128C284.553 66.6137 287.324 67.6527 290.095 68.3454C293.558 69.1535 297.021 69.3844 300.485 69.3844C303.948 69.3844 307.643 69.0381 310.875 67.8836C313.415 66.96 315.84 65.5746 317.918 63.8429C319.649 62.2266 320.919 60.3794 321.843 58.3014C322.536 56.6851 322.882 55.0688 322.997 53.3371H309.374Z" fill="#936BFF"/>
<path d="M251.906 53.6834C254.215 51.3744 255.716 48.2573 256.178 45.1402C257.679 35.3271 251.56 26.2067 240.939 26.2067C234.474 26.2067 229.048 29.7856 226.623 35.6735C225.007 39.5987 225.007 44.6784 226.623 48.6037C228.239 52.4135 231.01 55.4151 234.935 57.0314C238.399 58.4168 242.44 58.5322 246.018 57.3777C248.212 56.685 250.29 55.4151 251.906 53.6834ZM270.147 67.6526H256.178V63.7274L254.215 64.9973C249.944 67.7681 245.326 69.2689 240.246 69.2689C235.974 69.3844 231.934 68.8071 228.124 67.1908C224.776 65.8055 221.774 63.8428 219.234 61.303C214.155 56.2233 211.73 49.2964 211.73 42.1386C211.73 30.8246 218.311 21.3579 228.932 17.0863C236.205 14.2001 245.557 14.2001 252.714 17.0863C263.451 21.3579 270.147 30.8246 270.147 42.1386V67.6526Z" fill="#936BFF"/>
<path d="M155.323 67.6527V38.7906C155.323 32.7873 150.128 27.7076 143.894 27.7076C137.66 27.7076 132.58 32.7873 132.58 38.7906V67.6527H118.38V39.9451C118.38 26.2068 129.809 14.8928 143.894 14.8928C150.474 14.8928 156.708 17.4327 161.557 21.8197L162.365 22.6279L163.289 21.8197C168.022 17.4327 174.257 14.8928 180.837 14.8928C194.922 14.8928 206.467 26.2068 206.467 39.9451V67.6527H192.267V38.7906C192.267 32.7873 187.187 27.7076 180.837 27.7076C174.603 27.7076 169.523 32.7873 169.523 38.7906V67.6527H155.323Z" fill="currentColor"/>
<path d="M59.1898 67.6527V41.3305C59.1898 26.784 71.3119 14.8928 86.0893 14.8928C100.982 14.8928 113.104 26.784 113.104 41.3305V67.6527H98.904V40.176C98.904 33.3645 93.1316 27.7076 86.0893 27.7076C79.0469 27.7076 73.39 33.3645 73.39 40.176V67.6527H59.1898Z" fill="currentColor"/>
<path d="M53.9143 16.6245V42.9467C53.9143 57.4932 41.7923 69.3844 26.8994 69.3844C12.1221 69.3844 0 57.4932 0 42.9467V16.6245H14.2001V44.1012C14.2001 50.9127 19.8571 56.5696 26.8994 56.5696C33.9418 56.5696 39.7142 50.9127 39.7142 44.1012V16.6245H53.9143Z" fill="currentColor"/>
</svg>
  );
}
