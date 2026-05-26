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
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">
          Texte à analyser — email, post, description, discours
        </span>
        <textarea
          rows={8}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Colle ici un email, un post Instagram, une caption TikTok, une description YouTube, un argumentaire… L'analyse détecte les techniques de manipulation et l'absence de mentions de partenariat (loi 2023)."
          className="w-full bg-transparent border-b border-[var(--color-line-strong)] focus:border-[var(--color-accent)] py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-faint)] focus:outline-none resize-none transition-colors leading-relaxed"
          autoFocus
        />
        <span className="num text-[10px] text-[var(--color-fg-faint)] self-end">
          {text.length} caractères
        </span>
      </label>

      {error && <p className="text-xs text-[var(--color-bad)]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="self-start inline-flex items-center gap-2 bg-[var(--color-accent)] text-[var(--color-bg)] hover:bg-[var(--color-accent)]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:translate-y-px px-5 py-2.5 rounded-md text-sm font-semibold cursor-pointer"
      >
        {loading ? <Spinner label="Analyse en cours" /> : "Analyser le texte"}
      </button>
    </form>
  );
}
