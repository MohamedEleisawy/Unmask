"use client";

import { useState } from "react";
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
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() && !siren.trim()) {
      setError("Renseignez un nom, une URL ou un SIREN.");
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
        text_to_analyze: text || undefined,
      });
      onResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de contacter l'API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4"
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="text"
          placeholder="Nom, URL YouTube, site web, @handle…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="SIREN">
          <input
            type="text"
            placeholder="503932568"
            value={siren}
            onChange={(e) => setSiren(e.target.value.replace(/\D/g, "").slice(0, 9))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>
        <Field label="Secteur">
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="finance">Finance / Trading</option>
            <option value="coaching">Coaching</option>
            <option value="e-commerce">E-commerce</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="autre">Autre</option>
          </select>
        </Field>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-gray-500 hover:text-gray-300 text-left flex items-center gap-1 transition-colors"
      >
        <span>{showAdvanced ? "▾" : "▸"}</span>
        Options avancées (YouTube, texte à analyser)
      </button>

      {showAdvanced && (
        <div className="flex flex-col gap-3 border-t border-gray-800 pt-4">
          <Field label="URL chaîne YouTube">
            <input
              type="text"
              placeholder="https://youtube.com/@handle"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>
          <Field label="Texte à analyser (description, post, email…)">
            <textarea
              rows={4}
              placeholder="Collez ici un texte suspect pour détecter la manipulation et vérifier la conformité loi 2023..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </Field>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors rounded-xl py-3 font-semibold text-sm cursor-pointer"
      >
        {loading ? <Spinner label="Audit en cours…" /> : "Lancer l'audit complet"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
