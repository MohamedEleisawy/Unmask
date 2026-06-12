"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Valide un site : domaine nu (monsite.fr) ou URL complète (https://monsite.fr). */
function isValidWebsite(raw: string): boolean {
  const host = raw.trim().replace(/^https?:\/\//i, "").split("/")[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host);
}

export function LandingHero() {
  const [query, setQuery] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = query.trim();
    const site = website.trim();
    if (!name) {
      setError("Indiquez le nom de la personne à auditer.");
      return;
    }
    if (site && !isValidWebsite(site)) {
      setError("Adresse de site invalide (ex. monsite.fr ou https://monsite.fr).");
      return;
    }
    // Le nom part toujours en `q` ; le site (optionnel) en `site` → mappé sur
    // le champ `url` de l'API côté page audit (contrat existant, consommé par RDAP).
    const params = new URLSearchParams({ q: name });
    if (site) params.set("site", site);
    router.push(`/audit?${params.toString()}`);
  }

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 md:px-10">
      {/* Mobile : centré / Desktop : split asymétrique */}
      <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:justify-between pt-24 md:pt-32 pb-16 md:pb-28 gap-10 md:gap-16">

        {/* Colonne gauche */}
        <div className="flex flex-col items-center md:items-start gap-6 md:max-w-[520px]">
          <h1 className="font-landing-display font-bold text-[#f84b5f] text-[32px] md:text-[52px] leading-tight tracking-tight">
            Un feed ne dit<br className="hidden md:block" /> pas tout.
          </h1>
          <p
            className="font-landing-body text-[16px] md:text-[18px] leading-relaxed max-w-[340px] md:max-w-[400px]"
            style={{ color: "var(--au-text-muted)" }}
          >
            Insérez un nom ou un pseudo pour vérifier l&apos;identité et la crédibilité d&apos;un influenceur, coach ou vendeur en ligne.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col items-center md:items-start gap-3 w-full md:w-auto">
            {/* Champ obligatoire — la personne à auditer */}
            <PillField
              icon={<img alt="" className="absolute inset-0 size-full object-contain" src="/landing/search-dark.svg" />}
              value={query}
              onChange={(v) => { setQuery(v); setError(null); }}
              placeholder="Nom de la personne ou pseudo"
              ariaLabel="Nom de la personne, de l'influenceur ou de l'entrepreneur"
            />

            {/* Champ optionnel — le site web officiel (active l'analyse RDAP) */}
            <PillField
              icon={<GlobeIcon />}
              value={website}
              onChange={(v) => { setWebsite(v); setError(null); }}
              placeholder="Site web officiel (optionnel)"
              ariaLabel="Site web officiel (optionnel)"
              inputMode="url"
            />

            <p className="font-landing-body text-[12px] leading-snug max-w-[340px] text-center md:text-left" style={{ color: "var(--au-text-faint)" }}>
              Si un site est fourni, Unmask analysera également le nom de domaine (ancienneté, registrar et signaux de confiance).
            </p>

            {error && (
              <p role="alert" className="font-landing-body text-[12px] max-w-[340px] text-center md:text-left" style={{ color: "#f84b5f" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="font-landing-body font-bold bg-[#936bff] text-[#eee] text-[16px] h-[49px] px-6 rounded-[32px] whitespace-nowrap hover:bg-[#7d54f0] active:scale-95 transition-all w-[310px] md:w-auto"
            >
              Vérifier ce profil
            </button>
          </form>
        </div>

        {/* Colonne droite — visible desktop uniquement */}
        <div className="hidden md:block relative shrink-0">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

/** Champ « pilule » blanc réutilisable (nom + site), au design de la marque. */
function PillField({
  icon,
  value,
  onChange,
  placeholder,
  ariaLabel,
  inputMode,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
  inputMode?: "url";
}) {
  return (
    <div className="relative w-[310px] md:w-[340px] h-[49px] rounded-[32px] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#936bff]">
      <div className="absolute inset-0 bg-[#eee] rounded-[32px]" />
      <div className="absolute inset-0 flex items-center gap-2 px-[18px]">
        <div className="relative shrink-0 size-4">{icon}</div>
        <input
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="bg-transparent font-landing-body text-[13px] text-[#25141d] placeholder:text-[#25141d]/50 outline-none w-full"
        />
      </div>
    </div>
  );
}

/** Globe — icône du champ site web (teinte sombre pour la pilule blanche). */
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 size-full" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="#25141d" strokeWidth="1.6" />
      <path d="M3 12h18" stroke="#25141d" strokeWidth="1.6" />
      <path d="M12 3c2.4 2.5 2.4 15.5 0 18M12 3c-2.4 2.5-2.4 15.5 0 18" stroke="#25141d" strokeWidth="1.6" />
    </svg>
  );
}

function HeroVisual() {
  const badges = [
    { label: "Identité légale", color: "#0cdda5", text: "#100400", detail: "SIREN vérifié" },
    { label: "Conformité AMF", color: "#936bff", text: "#fff3e1", detail: "Hors liste noire" },
    { label: "Réputation OSINT", color: "#fec530", text: "#100400", detail: "0 alerte détectée" },
    { label: "Engagement YouTube", color: "#f84b5f", text: "#fff3e1", detail: "Ratio cohérent" },
  ];

  return (
    <div className="relative w-[340px] h-[320px]">
      {/* Glow ambient */}
      <div className="absolute inset-0 rounded-3xl bg-[#936bff]/10 blur-3xl" />

      {/* Carte centrale */}
      <div
        className="absolute inset-0 rounded-2xl border overflow-hidden flex flex-col justify-between p-6"
        style={{ background: "var(--au-surface)", borderColor: "var(--au-border)" }}
      >
        <div className="flex flex-col gap-1">
          <p className="font-landing-body text-[11px] uppercase tracking-widest" style={{ color: "var(--au-text-faint)" }}>Rapport d&apos;audit</p>
          <p className="font-landing-body font-bold text-[20px]" style={{ color: "var(--au-text)" }}>@mentor_finance</p>
        </div>

        <div className="flex flex-col gap-3">
          {badges.map((b) => (
            <div key={b.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: b.color }}
                />
                <span className="font-landing-body text-[13px]" style={{ color: "var(--au-text-muted)" }}>{b.label}</span>
              </div>
              <span
                className="font-landing-body text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: b.color + "22", color: b.color }}
              >
                {b.detail}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--au-border)" }}>
          <span className="font-landing-body text-[11px]" style={{ color: "var(--au-text-faint)" }}>Score global</span>
          <span className="font-landing-body font-bold text-[#936bff] text-[22px]">87 / 100</span>
        </div>
      </div>
    </div>
  );
}
