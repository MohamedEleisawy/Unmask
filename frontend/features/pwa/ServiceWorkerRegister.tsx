"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker (/sw.js) — uniquement en PRODUCTION, pour ne pas
 * interférer avec le HMR de Turbopack en développement. Best-effort : tout échec
 * est silencieux et n'impacte jamais le rendu de l'application.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* enregistrement impossible : l'app reste pleinement fonctionnelle en ligne */
      });
    };

    // Attend l'inactivité de la page pour ne pas concurrencer le premier rendu.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
