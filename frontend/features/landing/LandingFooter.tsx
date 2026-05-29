const LINKS = ["About", "Help", "Contact"];

export function LandingFooter() {
  return (
    <footer className="bg-[#242424] border-t border-white/[0.06] w-full">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <nav className="flex gap-6">
          {LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="font-landing-body text-[#eee] text-[16px] font-normal hover:text-[#936bff] transition-colors"
            >
              {link}
            </a>
          ))}
        </nav>
        <p className="font-landing-body text-[#dcdcdc]/50 text-[14px] font-light">
          © 2026 Unmask. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
