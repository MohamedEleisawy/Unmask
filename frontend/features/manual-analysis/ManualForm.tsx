"use client";

import { Spinner } from "@/shared/ui/Spinner";

type Props = {
  text: string;
  onTextChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
};

export function ManualForm({ text, onTextChange, onSubmit, loading, error }: Props) {
  return (
    <form onSubmit={onSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
          Texte à analyser (email, post Instagram, description YouTube, discours…)
        </label>
        <textarea
          rows={8}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Collez ici un texte suspect…"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          autoFocus
        />
        <p className="text-xs text-gray-600 mt-1">{text.length} caractères</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors rounded-xl py-3 font-semibold text-sm cursor-pointer"
      >
        {loading ? <Spinner label="Analyse en cours…" /> : "Analyser le texte"}
      </button>
    </form>
  );
}
