"use client";

import { forwardRef, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowRight } from "@/features/landing/landingIcons";

/** Valide un site : domaine nu (monsite.fr) ou URL complète (https://monsite.fr). */
function isValidWebsite(raw: string): boolean {
  const host = raw.trim().replace(/^https?:\/\//i, "").split("/")[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host);
}

/**
 * Hero — habillage visuel repris de la maquette Figma (node 963:3185) :
 * titre Quatty 48px avec mot d'accent violet, paragraphe Satoshi 14px.
 * Le formulaire de recherche (nom + site optionnel + validation) est conservé,
 * le bouton « Vérifier un profil » le soumet.
 */
export function LandingHero() {
  const [query, setQuery] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Quel champ porte l'erreur courante — pilote aria-invalid et le retour de focus.
  const [errorField, setErrorField] = useState<"name" | "site" | null>(null);
  const router = useRouter();

  const nameRef = useRef<HTMLInputElement>(null);
  const siteRef = useRef<HTMLInputElement>(null);

  // ids stables pour relier messages/aides aux champs (aria-describedby).
  const errorId = useId();
  const siteHintId = useId();

  function clearError() {
    setError(null);
    setErrorField(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = query.trim();
    const site = website.trim();
    if (!name) {
      setError("Indiquez le nom de la personne à auditer.");
      setErrorField("name");
      nameRef.current?.focus(); // ramène le focus sur le champ fautif
      return;
    }
    if (site && !isValidWebsite(site)) {
      setError("Adresse de site invalide (ex. monsite.fr ou https://monsite.fr).");
      setErrorField("site");
      siteRef.current?.focus();
      return;
    }
    const params = new URLSearchParams({ q: name });
    if (site) params.set("site", site);
    router.push(`/audit?${params.toString()}`);
  }

  return (
    <section className="w-full px-[24px] md:px-10" data-node-id="963:3184">
      {/* Mobile : colonne unique. Desktop : colonne unique large (maquette node 1262:7252,
          largeur 824px), alignée à gauche — pas de visuel à droite. */}
      <div className="mx-auto flex w-full max-w-[342px] flex-col items-start gap-[24px] md:max-w-[1153px]">

        {/* Colonne contenu — largeur maquette 824px, bord gauche aligné sur les autres sections. */}
        <div className="flex w-full flex-col items-start gap-[24px] md:max-w-[824px]">
          {/* Titre + paragraphe (Figma node 1262:7254, gap 16px) */}
          <div className="ld-reveal flex flex-col items-start gap-[16px]">
            <h1 className="text-balance font-landing-display text-[48px] leading-[48px] tracking-[0.3516px] text-[var(--ld-text)] md:text-[52px]">
              Un feed ne dit{" "}
              <span className="whitespace-nowrap">
                pas <span className="text-[#936bff]">tout</span>.
              </span>
            </h1>
            <div className="flex max-w-[320px] flex-col gap-3 font-landing-body text-[14px] leading-[20px] tracking-[-0.1504px] text-pretty text-[var(--ld-text)] md:max-w-[824px] md:text-[16px]">
              <p>
                Consultez en quelques secondes les informations publiques disponibles
                sur un influenceur, coach ou vendeur en ligne.
              </p>
              <p>
                Unmask analyse des sources ouvertes, vérifie des critères de
                transparence et génère un indice de confiance accompagné de toutes les
                informations utilisées pour son calcul.
              </p>
            </div>
          </div>

          {/* Formulaire de recherche — conservé, habillé marque. */}
          <form onSubmit={handleSubmit} className="ld-reveal flex w-full flex-col items-start gap-3" style={{ ["--reveal-delay" as string]: "90ms" }}>
            <PillField
              ref={nameRef}
              icon={<SearchIcon />}
              value={query}
              onChange={(v) => { setQuery(v); clearError(); }}
              placeholder="Nom de la personne ou pseudo"
              ariaLabel="Nom de la personne, de l'influenceur ou de l'entrepreneur"
              required
              invalid={errorField === "name"}
              describedBy={errorField === "name" ? errorId : undefined}
            />

            <PillField
              ref={siteRef}
              icon={<GlobeIcon />}
              value={website}
              onChange={(v) => { setWebsite(v); clearError(); }}
              placeholder="Site web officiel (optionnel)"
              ariaLabel="Site web officiel (optionnel)"
              inputMode="url"
              invalid={errorField === "site"}
              // décrit toujours le champ par l'aide ; ajoute l'erreur quand le site est fautif
              describedBy={errorField === "site" ? `${siteHintId} ${errorId}` : siteHintId}
            />

            <p id={siteHintId} className="max-w-[320px] font-landing-body text-[12px] leading-snug text-[var(--ld-text-muted)] md:max-w-[420px]">
              Si un site est fourni, Unmask analysera également le nom de domaine
              (ancienneté, registrar et signaux de confiance).
            </p>

            {error && (
              <p id={errorId} role="alert" className="max-w-[320px] font-landing-body text-[12px] text-[#f84b5f]">
                {error}
              </p>
            )}

            {/* Bouton « Vérifier un profil » — Figma node 963:3191 */}
            <button
              type="submit"
              className="group flex h-[36px] items-center justify-center gap-[6px] rounded-[12px] bg-[#936bff] px-[8px] font-landing-body text-[14px] leading-[20px] tracking-[-0.1504px] text-[#eee] transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-[#7d54f0] active:-translate-y-px active:scale-[0.98] md:h-[44px] md:px-5 md:text-[15px]"
            >
              Vérifier un profil
              <IconArrowRight className="size-[16px] transition-transform duration-150 ease-[var(--ease-out)] group-hover:translate-x-0.5" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

/** Champ « pilule » blanc réutilisable (nom + site), au design de la marque. */
const PillField = forwardRef<HTMLInputElement, {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
  inputMode?: "url";
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
}>(function PillField(
  { icon, value, onChange, placeholder, ariaLabel, inputMode, required, invalid, describedBy },
  ref,
) {
  return (
    <div className="relative h-[49px] w-full rounded-[32px] text-[var(--ld-text)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#936bff]">
      <div className="absolute inset-0 rounded-[32px] bg-[var(--ld-surface)] shadow-[inset_0_0_0_1px_var(--ld-border)]" />
      <div className="absolute inset-0 flex items-center gap-2 px-[18px]">
        <div className="relative size-4 shrink-0 text-[var(--ld-text-faint)]">{icon}</div>
        <input
          ref={ref}
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-required={required || undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="w-full bg-transparent font-landing-body text-[13px] text-[var(--ld-text)] outline-none placeholder:text-[var(--ld-text-faint)]"
        />
      </div>
    </div>
  );
});

/** Loupe — icône du champ nom (suit la couleur du conteneur via currentColor). */
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="absolute inset-0 size-full" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
    </svg>
  );
}

/** Globe — icône du champ site web (suit la couleur du conteneur via currentColor). */
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="absolute inset-0 size-full" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.4 2.5 2.4 15.5 0 18M12 3c-2.4 2.5-2.4 15.5 0 18" />
    </svg>
  );
}
