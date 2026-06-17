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
      {/* Mobile : colonne unique. Desktop : split asymétrique 6/5, asset à droite. */}
      <div className="mx-auto flex w-full max-w-[342px] flex-col items-start gap-[24px] md:max-w-[1200px] md:grid md:grid-cols-[1.15fr_1fr] md:items-center md:gap-16">

        {/* Colonne contenu */}
        <div className="flex flex-col items-start gap-[24px] md:max-w-[560px]">
          {/* Titre + paragraphe (Figma node 963:3186, gap 16px) */}
          <div className="ld-reveal flex flex-col items-start gap-[16px]">
            <h1 className="text-balance font-landing-display text-[48px] leading-[48px] tracking-[0.3516px] text-[var(--ld-text)] md:text-[56px] md:leading-[54px] md:tracking-[-0.5px] lg:text-[72px] lg:leading-[68px]">
              Un feed ne dit{" "}
              <span className="whitespace-nowrap">
                pas <span className="text-[#936bff]">tout</span>.
              </span>
            </h1>
            <div className="flex max-w-[320px] flex-col gap-3 font-landing-body text-[14px] leading-[20px] tracking-[-0.1504px] text-pretty text-[var(--ld-text)] md:max-w-[460px] md:text-[16px] md:leading-[24px]">
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

        {/* Colonne asset — aperçu de rapport, desktop uniquement */}
        <div className="ld-hero-in hidden md:block" style={{ ["--reveal-delay" as string]: "120ms", animationDelay: "120ms" }}>
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

/**
 * Aperçu de rapport d'audit — mini-composant réel (pas une fausse capture en div).
 * Suit l'étoile du Nord « dossier de vérification » (DESIGN.md) : le score d'abord,
 * en mono tabulaire coloré par le verdict, puis les vérifications en grille de lignes.
 * Pas de pastilles arc-en-ciel, pas de chips teintées, pas d'ombre portée
 * (profondeur par empilement tonal). Un seul accent de verdict : le vert « fiable ».
 */
function HeroVisual() {
  // Vérifications descriptives : coche neutre + valeur. La valeur-mesure (ratio,
  // ancienneté) passe en mono tabulaire — marqueur du fait, cf. « Règle du Chiffre Mono ».
  const checks: { label: string; value: string; mono?: boolean }[] = [
    { label: "Identité légale", value: "SIREN actif" },
    { label: "Liste noire AMF", value: "Absent" },
    { label: "Réputation presse", value: "0 alerte" },
  ];

  return (
    <div className="relative ml-auto w-full max-w-[360px]">
      <div className="absolute -inset-6 -z-10 rounded-[32px] bg-[#936bff]/10 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-[var(--ld-border-solid)] bg-[var(--ld-surface)]">

        {/* En-tête : identité auditée + verdict doublé (point + ring + libellé). */}
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
          <div className="flex flex-col gap-0.5">
            <p className="font-landing-body text-[10px] uppercase tracking-[0.18em] text-[var(--ld-text-faint)]">
              Rapport d&apos;audit
            </p>
            <p className="font-landing-body text-[18px] font-bold leading-tight text-[var(--ld-text)]">
              @mentor_finance
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--ld-score)]/30 bg-[var(--ld-score)]/10 px-2 py-1 font-landing-body text-[11px] font-semibold text-[var(--ld-score)]">
            <CheckIcon className="size-3" />
            Fiable
          </span>
        </div>

        {/* Score — la signature. Mono tabulaire géant, coloré par le verdict (vert). */}
        <div className="flex items-baseline gap-2 border-y border-[var(--ld-border-solid)] bg-[var(--ld-surface-alt)] px-6 py-5">
          <span className="font-[family-name:var(--font-mono)] text-[56px] font-medium leading-none tracking-[-0.04em] tabular-nums text-[var(--ld-score)]">
            87
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[18px] tabular-nums text-[var(--ld-text-faint)]">
            /100
          </span>
          <span className="ml-auto self-center text-right font-landing-body text-[11px] leading-snug text-[var(--ld-text-muted)]">
            Indice de
            <br />
            confiance
          </span>
        </div>

        {/* Vérifications — grille de lignes tabulaire (jamais des cartes empilées). */}
        <ul className="flex flex-col px-6 py-2">
          {checks.map((c) => (
            <li
              key={c.label}
              className="flex items-center justify-between gap-3 border-b border-[var(--ld-border)] py-2.5 last:border-b-0"
            >
              <span className="flex items-center gap-2.5 font-landing-body text-[13px] text-[var(--ld-text-muted)]">
                <CheckIcon className="size-3.5 shrink-0 text-[var(--ld-score)]" />
                {c.label}
              </span>
              <span
                className={
                  c.mono
                    ? "font-[family-name:var(--font-mono)] text-[12px] tabular-nums text-[var(--ld-value)]"
                    : "font-landing-body text-[12px] font-medium text-[var(--ld-value)]"
                }
              >
                {c.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Coche fine — marqueur neutre de vérification (suit currentColor). */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
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
