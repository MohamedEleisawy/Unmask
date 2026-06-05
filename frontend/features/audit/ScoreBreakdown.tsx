import type { ScoreCriterion } from "./types";

type Props = { breakdown: ScoreCriterion[] };

const KEY_ICON: Record<string, string> = {
  legal_identity: "🏢",
  compliance:     "🏛️",
  reputation:     "📰",
};

export function ScoreBreakdown({ breakdown }: Props) {
  if (!breakdown?.length) return null;

  return (
    <div className="rounded-lg border border-[var(--color-line-strong)] overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-[var(--color-line)] bg-[var(--color-surface-raised)] flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-faint)] font-medium">
          Critères de notation
        </span>
        <span className="text-[10px] text-[var(--color-fg-faint)]">
          Score global calculé sur {breakdown.filter(c => c.available).length}/{breakdown.length} critères disponibles
        </span>
      </div>

      <div className="divide-y divide-[var(--color-line)]">
        {breakdown.map((c) => (
          <CriterionRow key={c.key} criterion={c} />
        ))}
      </div>
    </div>
  );
}

function CriterionRow({ criterion: c }: { criterion: ScoreCriterion }) {
  const icon   = KEY_ICON[c.key] ?? "📊";
  const score  = c.score ?? 0;
  const color  = score >= 75 ? "var(--color-accent)" : score >= 40 ? "var(--color-warn)" : "var(--color-bad)";

  return (
    <div className="px-4 py-3 flex flex-col gap-2">
      {/* En-tête ligne */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-medium text-[var(--color-fg)]">{c.label}</span>
          <span className="text-[10px] text-[var(--color-fg-faint)] shrink-0">
            poids {c.effective_weight}%
          </span>
        </div>

        {c.available ? (
          <div className="flex items-center gap-3 shrink-0">
            <span className="num text-sm font-semibold" style={{ color }}>
              {score}/100
            </span>
            <span className="num text-xs text-[var(--color-fg-faint)]">
              +{c.points} pts
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-[var(--color-fg-faint)] italic">Non calculé</span>
        )}
      </div>

      {/* Barre de progression */}
      {c.available && (
        <div className="h-1 w-full rounded-full bg-[var(--color-line-strong)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${score}%`, background: color }}
          />
        </div>
      )}

      {/* Justification */}
      <p className="text-[11px] text-[var(--color-fg-subtle)] leading-relaxed">
        {c.reason}
      </p>
    </div>
  );
}
