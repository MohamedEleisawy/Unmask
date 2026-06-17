"use client";

import { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  /** Décalage de stagger en ms (entrées en cascade dans une grille). */
  delay?: number;
  /** Balise rendue (par défaut div) — permet de garder la sémantique du parent. */
  as?: "div" | "section" | "li" | "article";
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Révèle son contenu au défilement : fondu + montée pilotés en CSS
 * (.ld-scroll-reveal), déclenchés une seule fois via IntersectionObserver.
 * Le mouvement réduit est géré par la feuille de style (contenu visible
 * d'emblée). On observe avec une marge basse pour lancer l'animation juste
 * avant que la section n'entre pleinement dans le viewport.
 */
export function Reveal({ children, delay = 0, as = "div", className, style }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || revealed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);

  const Tag = as;
  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-revealed={revealed}
      className={`ld-scroll-reveal${className ? ` ${className}` : ""}`}
      style={delay ? { ...style, ["--reveal-delay" as string]: `${delay}ms` } : style}
    >
      {children}
    </Tag>
  );
}
