const LINKS = ["About", "Help", "Contact"];

export function LandingFooter() {
  return (
    <footer className="border-t w-full" style={{ background: "var(--au-inset)", borderColor: "var(--au-border)" }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <nav className="flex gap-6">
          {LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="font-landing-body text-[16px] font-normal hover:text-[#936bff] transition-colors"
              style={{ color: "var(--au-text)" }}
            >
              {link}
            </a>
          ))}
        </nav>
        <p className="font-landing-body text-[14px] font-light" style={{ color: "var(--au-text-faint)" }}>
          © 2026 Unmask. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
