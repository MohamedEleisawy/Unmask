"use client";

import { useEffect, useState } from "react";

/** Thème effectif courant : data-theme explicite, sinon préférence système. */
function effectiveTheme(): "light" | "dark" {
  if (typeof document !== "undefined") {
    const t = document.documentElement.dataset.theme;
    if (t === "light" || t === "dark") return t;
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

/**
 * Bascule clair/sombre — switch pilule avec pastille glissante.
 * Soleil (mode clair) à gauche, lune (mode sombre) à droite ; la pastille sombre
 * glisse vers l'icône active. Mémorisé (localStorage), défaut = auto (système).
 */
export function ThemeToggle() {
  // SSR ne connaît pas le thème : on rend un état neutre, puis on lit le thème
  // effectif au montage (le script anti-FOUC a déjà posé data-theme côté client).
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(effectiveTheme());
  }, []);

  const mounted = theme !== null;
  const isDark = theme === "dark";

  const toggle = () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* stockage indisponible : on bascule quand même pour la session */
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={mounted ? isDark : undefined}
      onClick={toggle}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className="tap-target relative inline-flex h-[30px] w-[58px] shrink-0 items-center rounded-full bg-white p-[3px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] transition-colors"
    >
      {/* Icônes fixes sur la piste */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-[8px]">
        <SunIcon className="size-[14px] text-[#1a1320]" />
        <MoonIcon className="size-[14px] text-[#9aa0aa]" />
      </span>

      {/* Pastille glissante — masquée tant que le thème n'est pas connu (anti-flash) */}
      <span
        className="relative z-10 flex size-[24px] items-center justify-center rounded-full bg-[#1d1526] text-white transition-transform duration-[var(--animate-duration-state)] [transition-timing-function:var(--ease-out)]"
        style={{
          transform: isDark ? "translateX(28px)" : "translateX(0)",
          visibility: mounted ? "visible" : "hidden",
        }}
      >
        {isDark ? <MoonIcon className="size-[13px]" /> : <SunIcon className="size-[13px]" />}
      </span>
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
