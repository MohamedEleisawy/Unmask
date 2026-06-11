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

/** Bascule clair/sombre, mémorisée (localStorage). Défaut = auto (système). */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Lecture du thème effectif après montage (évite tout mismatch d'hydratation).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(effectiveTheme());
  }, []);

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
      onClick={toggle}
      aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
      className="tap-target size-9 rounded-lg flex items-center justify-center transition-all active:scale-95"
      style={{ color: "var(--au-text-muted)", background: "var(--au-inset)" }}
    >
      {theme === "dark" ? (
        // Soleil → propose le mode clair
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // Lune → propose le mode sombre
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
