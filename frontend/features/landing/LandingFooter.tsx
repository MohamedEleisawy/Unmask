const LINKS = [
  { label: "Accueil", href: "/" },
  { label: "Mentions légales", href: "/mentions-legales" },
];

/**
 * Footer — barre violette reprise de la maquette Figma (node 963:3285).
 * Liens (Inter 16px, #e1e1e1) puis mention de copyright. Padding x16 y64.
 */
export function LandingFooter() {
  return (
    <footer className="w-full bg-[#936bff] px-[16px] py-[64px] md:px-10" data-node-id="963:3285">
      {/* Mobile : pile. Desktop : rangée contenue, liens / copyright aux extrémités. */}
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-[24px] md:flex-row md:items-center md:justify-between md:gap-8">
        <nav className="flex items-center gap-[24px]">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-['Inter',var(--font-landing-body)] text-[16px] leading-[24px] font-normal text-[#e1e1e1] transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <p className="font-landing-body text-[16px] font-light text-[#dcdcdc]">
          © 2026 Unmask. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
