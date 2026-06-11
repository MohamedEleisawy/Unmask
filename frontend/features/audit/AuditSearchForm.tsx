"use client";

import { useState } from "react";
import { fetchFullAudit } from "./api";
import type { AuditResponse } from "./types";

const PILLARS = [
  { num: "01", label: "Identité légale vérifiable" },
  { num: "02", label: "Conformité AMF / ACPR" },
  { num: "03", label: "Réputation publique & OSINT" },
  { num: "04", label: "Présence en ligne" },
  { num: "05", label: "Transparence des partenariats" },
  { num: "06", label: "Cohérence d'engagement" },
];

type Props = { onResults: (r: AuditResponse) => void };

export function AuditSearchForm({ onResults }: Props) {
  const [query, setQuery] = useState("");
  const [siren, setSiren] = useState("");
  const [sector, setSector] = useState("finance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() && !siren.trim()) {
      setError("Renseigne au moins un nom, un @handle, un site web ou un SIREN.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const isUrl = query.startsWith("http") || (query.includes(".") && !query.includes(" "));
      const data = await fetchFullAudit({
        entity_name: !isUrl ? query || undefined : undefined,
        url: isUrl ? query || undefined : undefined,
        siren: siren || undefined,
        sector,
      });
      onResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de contacter l'API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-10 md:pt-16 pb-16">
      {/* Layout: sur desktop, formulaire à gauche / pillars à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-20 items-start">

        {/* Colonne gauche */}
        <div className="flex flex-col gap-8">
          {/* Titre */}
          <div className="flex flex-col gap-3">
            <h1
              className="text-3xl md:text-4xl font-bold font-landing-display leading-tight tracking-tight"
              style={{ color: "var(--au-text)" }}
            >
              Audit de crédibilité
            </h1>
            <p className="text-sm leading-relaxed max-w-[42ch]" style={{ color: "var(--au-text-faint)" }}>
              Vérifiez l’identité légale, la conformité et la réputation d’un influenceur ou d’une marque en quelques secondes.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={submit} className="flex flex-col gap-4">
            {/* Champ principal */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3.5 border transition-colors focus-within:border-[#936bff]/60"
              style={{ background: "var(--au-surface)", borderColor: "var(--au-border-strong)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <circle cx="11" cy="11" r="7" stroke="#4a4a4a" strokeWidth="1.5" />
                <path d="M16.5 16.5L21 21" stroke="#4a4a4a" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="@handle, nom, site web, nom d'entreprise..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-(--au-text-dim)"
                style={{ color: "var(--au-text)" }}
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Effacer la recherche"
                  className="tap-target shrink-0 flex items-center justify-center size-6 transition-opacity hover:opacity-60"
                  style={{ color: "var(--au-text-faint)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            {/* Champs secondaires côte à côte sur md+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldBox label="SIREN (optionnel)">
                <input
                  type="text"
                  placeholder="ex. 503932568"
                  value={siren}
                  onChange={(e) => setSiren(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  className="w-full bg-transparent text-sm focus:outline-none placeholder:text-(--au-text-dim)"
                  style={{ color: "var(--au-text)" }}
                />
              </FieldBox>
              <FieldBox label="Secteur">
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none cursor-pointer appearance-none"
                  style={{ color: "var(--au-text)" }}
                >
                  {[
                    ["finance", "Finance / Trading"],
                    ["coaching", "Coaching"],
                    ["e-commerce", "E-commerce"],
                    ["lifestyle", "Lifestyle"],
                    ["autre", "Autre"],
                  ].map(([v, l]) => (
                    <option key={v} value={v} style={{ background: "var(--au-surface)" }}>{l}</option>
                  ))}
                </select>
              </FieldBox>
            </div>

            {error && (
              <p className="text-xs px-1" style={{ color: "var(--verdict-bad)" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#936bff", color: "#fff" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingDots />
                  Audit en cours...
                </span>
              ) : (
                "Lancer l'audit"
              )}
            </button>
          </form>
        </div>

        {/* Colonne droite : pillars */}
        <aside
          className="rounded-2xl p-6 flex flex-col gap-5 border"
          style={{ background: "var(--au-surface)", borderColor: "var(--au-border)" }}
        >
          <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--au-text-dim)" }}>
            Ce qu’Unmask vérifie
          </p>
          <ul className="flex flex-col divide-y" style={{ borderColor: "var(--au-border)" }}>
            {PILLARS.map(({ num, label }) => (
              <li key={num} className="flex items-center gap-4 py-3">
                <span
                  className="text-xs font-mono tabular-nums shrink-0 w-6 text-right"
                  style={{ color: "#936bff" }}
                >
                  {num}
                </span>
                <span className="text-sm" style={{ color: "var(--au-text-muted)" }}>{label}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed" style={{ color: "var(--au-text-dim)" }}>
            Sources publiques officielles uniquement. Zéro stockage de données personnelles.
          </p>
        </aside>
      </div>
    </div>
  );
}

function FieldBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--au-text-dim)" }}>
        {label}
      </span>
      <div
        className="rounded-xl px-4 py-3 border"
        style={{ background: "var(--au-surface)", borderColor: "var(--au-border-strong)" }}
      >
        {children}
      </div>
    </label>
  );
}

function LoadingDots() {
  return (
    <span className="flex gap-1 items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block size-1.5 rounded-full animate-bounce"
          style={{ background: "#fff", animationDelay: `${i * 100}ms` }}
        />
      ))}
    </span>
  );
}
