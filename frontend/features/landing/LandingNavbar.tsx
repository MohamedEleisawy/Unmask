"use client";

import { useState } from "react";
import { ThemeToggle } from "@/shared/ThemeToggle";

/** Liens du menu — repris du footer (À propos, Aide, Contact). */
const MENU_LINKS = ["À propos", "Aide", "Contact"];

/**
 * Navbar de la landing — barre violette (#936bff) reprise de la maquette Figma
 * (node 963:3172, h 68px). Logo à gauche, puis ThemeToggle ET menu hamburger
 * (les deux conservés). Le hamburger ouvre la navigation.
 */
export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-[#936bff]" data-node-id="963:3172">
      {/* Mobile : largeur 342px (Figma node 963:3173). Desktop : conteneur 1200px. */}
      <div className="mx-auto flex h-[68px] w-full max-w-[342px] items-center justify-between px-0 py-[22px] md:h-[72px] md:max-w-[1200px] md:px-10 md:py-0">
        <LandingLogo />

        {/* Liens inline — desktop uniquement, sur une seule ligne */}
        <nav className="hidden items-center gap-8 md:flex">
          {MENU_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="font-landing-body text-[16px] text-[#eee] transition-opacity hover:opacity-80"
            >
              {link}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Hamburger — mobile uniquement */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            className="tap-target flex size-6 items-center justify-center text-[#eee] transition-opacity active:scale-95 md:hidden"
          >
            {/* Menu / Hamburger_MD — Figma node 963:3183 */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M5 7h14M5 12h14M5 17h14" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Panneau du menu — révélé par le hamburger (mobile uniquement) */}
      {open && (
        <nav className="mx-auto w-full max-w-[342px] pb-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {MENU_LINKS.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  onClick={() => setOpen(false)}
                  className="block rounded-[12px] px-3 py-2 font-landing-body text-[16px] text-[#eee] transition-colors hover:bg-white/10"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

/** Logo Unmask — forcé en blanc sur la barre violette. */
function LandingLogo() {
  return (
    <svg width="76" height="14" viewBox="0 0 66 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Unmask" className="h-[14px] w-[76px]">
      <path d="M10.3809 11.7657V7.18792C10.3809 4.65809 12.489 2.59006 15.059 2.59006C17.6491 2.59006 19.7573 4.65809 19.7573 7.18792V11.7657H17.2877V6.98714C17.2877 5.80254 16.2838 4.81872 15.059 4.81872C13.8343 4.81872 12.8504 5.80254 12.8504 6.98714V11.7657H10.3809ZM27.0997 11.7657V6.7462C27.0997 5.70215 26.1962 4.81872 25.112 4.81872C24.0278 4.81872 23.1443 5.70215 23.1443 6.7462V11.7657H20.6747V6.94698C20.6747 4.5577 22.6625 2.59006 25.112 2.59006C26.2564 2.59006 27.3406 3.03178 28.1839 3.79474L28.3244 3.93529L28.4851 3.79474C29.3083 3.03178 30.3925 2.59006 31.5369 2.59006C33.9864 2.59006 35.9942 4.5577 35.9942 6.94698V11.7657H33.5246V6.7462C33.5246 5.70215 32.6412 4.81872 31.5369 4.81872C30.4527 4.81872 29.5693 5.70215 29.5693 6.7462V11.7657H27.0997Z" fill="#eee"/>
      <path d="M43.8968 9.33626C44.2983 8.9347 44.5594 8.39259 44.6397 7.85049C44.9007 6.14386 43.8365 4.5577 41.9894 4.5577C40.865 4.5577 39.9213 5.18012 39.4997 6.2041C39.2186 6.88675 39.2186 7.77018 39.4997 8.45283C39.7808 9.1154 40.2627 9.63743 40.9453 9.91852C41.5477 10.1595 42.2504 10.1795 42.8728 9.97875C43.2543 9.85829 43.6157 9.63743 43.8968 9.33626ZM47.0691 11.7657H44.6397V11.083L44.2983 11.3039C43.5555 11.7858 42.7523 12.0468 41.8689 12.0468C41.126 12.0669 40.4233 11.9665 39.7607 11.6854C39.1785 11.4444 38.6564 11.1031 38.2147 10.6614C37.3313 9.77797 36.9096 8.5733 36.9096 7.32846C36.9096 5.36082 38.0541 3.71443 39.9013 2.97154C41.1662 2.4696 42.7925 2.4696 44.0373 2.97154C45.9046 3.71443 47.0691 5.36082 47.0691 7.32846V11.7657Z" fill="#fff"/>
      <path d="M9.37641 2.89123V7.46901C9.37641 9.99883 7.26822 12.0669 4.67817 12.0669C2.10819 12.0669 0 9.99883 0 7.46901V2.89123H2.46959V7.66979C2.46959 8.85439 3.45341 9.83821 4.67817 9.83821C5.90292 9.83821 6.90682 8.85439 6.90682 7.66979V2.89123H9.37641Z" fill="#eee"/>
      <path d="M56.2927 6.38776e-06V7.20799L59.7461 2.91131L62.4967 2.89123L58.9429 7.32846L62.4967 11.7657L59.7461 11.7456L57.5776 9.03509L56.2927 10.6212V11.7657H53.8833V6.38776e-06H56.2927Z" fill="#fff"/>
      <path d="M53.8487 8.99166C53.9325 9.195 53.9889 9.40684 54.0796 9.61109L55.0307 4.72241C54.4791 5.19688 53.731 6.69746 52.8372 6.08736C52.0644 5.55984 51.858 4.60245 50.8366 4.31977C50.5347 4.2372 50.2172 4.23086 49.9123 4.30129C49.2255 4.45951 48.6494 5.01671 48.8306 5.75387C49.0637 6.70235 50.1596 6.86797 50.9559 7.00528C51.588 7.11427 52.3547 7.40461 52.871 7.7769C53.3031 8.08233 53.6418 8.50307 53.8487 8.99166Z" fill="#fff"/>
      <path d="M46.7688 6.51376C46.76 6.41836 46.7596 6.28945 46.7598 6.10187L46.7688 6.51376C46.7975 6.82518 46.915 6.77968 47.3863 7.25317C47.9064 7.77555 48.5835 8.08411 49.2806 8.30801C50.1599 8.59042 51.1066 8.50247 51.7003 9.35929C51.8377 9.55746 51.921 9.8236 51.9218 10.0638C51.9253 10.3398 51.8186 10.6057 51.6256 10.8021C51.2989 11.131 50.8386 11.272 50.3864 11.2688C49.9085 11.2654 49.4783 11.1235 49.1391 10.7791C48.6584 10.291 48.5234 9.52517 47.8227 9.27289C47.4744 9.1475 47.118 9.0913 46.8319 9.38995L46.7688 6.51376Z" fill="#fff"/>
      <circle cx="64.087" cy="10.9164" r="1.13043" fill="#eee"/>
    </svg>
  );
}
