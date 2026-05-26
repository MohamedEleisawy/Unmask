"use client";

import { useState } from "react";
import { ChevronIcon, SearchIcon } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/Spinner";
import { fetchFullAudit } from "./api";
import type { AuditResponse } from "./types";

type Props = {
  onResults: (r: AuditResponse) => void;
  onReset: () => void;
};

export function AuditForm({ onResults, onReset }: Props) {
  const [query, setQuery] = useState("");
  const [siren, setSiren] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [sector, setSector] = useState("finance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() && !siren.trim()) {
      setError("Renseigne au moins un nom, un @handle, un site web ou un SIREN.");
      return;
    }
    setLoading(true);
    setError(null);
    onReset();

    try {
      const isUrl = query.startsWith("http") || query.includes(".");
      const data = await fetchFullAudit({
        entity_name: !isUrl ? query || undefined : undefined,
        url: isUrl ? query || undefined : undefined,
        siren: siren || undefined,
        youtube_url: youtubeUrl || undefined,
        sector,
      });
      onResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de contacter l'API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full flex flex-col gap-5">
      <div className="relative flex items-center border-b border-[var(--color-line-strong)] focus-within:border-[var(--color-accent)] transition-colors">
        <SearchIcon className="w-4 h-4 text-[var(--color-fg-subtle)] flex-shrink-0" />
        <input
          type="text"
          placeholder="Nom prénom, @handle Insta/TikTok, site web, ou nom d'entreprise…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent pl-3 py-4 text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-faint)] focus:outline-none"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-8 gap-y-4 items-end">
        <UnderlineField label="SIREN — 9 chiffres (fiabilise le critère identité légale)">
          <input
            type="text"
            placeholder="ex. 503932568"
            value={siren}
            onChange={(e) => setSiren(e.target.value.replace(/\D/g, "").slice(0, 9))}
            className="num w-full bg-transparent border-b border-[var(--color-line)] focus:border-[var(--color-fg-subtle)] py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-faint)] focus:outline-none transition-colors"
          />
        </UnderlineField>
        <UnderlineField label="Secteur déclaré (ajuste la vérification AMF/ACPR)">
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="bg-transparent border-b border-[var(--color-line)] py-2 text-sm text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-fg-subtle)] cursor-pointer"
          >
            <option value="finance" className="bg-[var(--color-surface)]">Finance / Trading</option>
            <option value="coaching" className="bg-[var(--color-surface)]">Coaching</option>
            <option value="e-commerce" className="bg-[var(--color-surface)]">E-commerce</option>
            <option value="lifestyle" className="bg-[var(--color-surface)]">Lifestyle</option>
            <option value="autre" className="bg-[var(--color-surface)]">Autre</option>
          </select>
        </UnderlineField>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="self-start inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] transition-colors"
      >
        <ChevronIcon className="w-3 h-3" open={showAdvanced} />
        Champs additionnels
      </button>

      {showAdvanced && (
        <div className="flex flex-col gap-4 border-l border-[var(--color-line)] pl-5 ml-1">
          <UnderlineField label="URL chaîne YouTube (active le sous-signal d'engagement)">
            <input
              type="text"
              placeholder="https://youtube.com/@nom-de-la-chaine"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full bg-transparent border-b border-[var(--color-line)] focus:border-[var(--color-fg-subtle)] py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-faint)] focus:outline-none transition-colors"
            />
          </UnderlineField>
          <p className="text-[11px] text-[var(--color-fg-faint)] leading-relaxed">
            Besoin d'analyser un texte brut (caption, email, description) ? Utilise l'onglet{" "}
            <span className="text-[var(--color-fg-subtle)]">Analyse de texte</span> en haut à droite.
          </p>
        </div>
      )}

      {error && <p className="text-xs text-[var(--color-bad)]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="self-start inline-flex items-center gap-2 bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent)]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:translate-y-px px-5 py-2.5 rounded-md text-sm font-semibold cursor-pointer"
      >
        {loading ? <Spinner label="Audit en cours" /> : "Lancer l'audit"}
      </button>
    </form>
  );
}

function UnderlineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">{label}</span>
      {children}
    </label>
  );
}
