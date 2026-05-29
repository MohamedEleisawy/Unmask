import type { AuditEntity, Verdict } from "./types";

type Props = {
  score: number;
  verdict: Verdict;
  entity: AuditEntity;
};

const VERDICT: Record<Verdict, { label: string; color: string }> = {
  fiable: { label: "Fiable", color: "var(--color-accent)" },
  suspect: { label: "Suspect", color: "var(--color-warn)" },
  alerte: { label: "Alerte", color: "var(--color-bad)" },
};

export function ScoreHeader({ score, verdict, entity }: Props) {
  const v = VERDICT[verdict];

  return (
    <section className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-12 items-end pb-8 border-b border-[var(--color-line-strong)]">
      <div className="flex flex-col gap-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-faint)]">
          Score global de crédibilité
        </span>
        <h2 className="text-base text-[var(--color-fg-muted)] leading-snug max-w-[40ch]">
          {entity.name || entity.url || "Entité auditée"}
          {entity.siren && (
            <span className="ml-2 num text-xs text-[var(--color-fg-faint)]">
              SIREN {entity.siren}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: v.color, boxShadow: `0 0 0 4px ${v.color}1f` }}
            aria-hidden
          />
          <span className="text-xs uppercase tracking-wider font-medium" style={{ color: v.color }}>
            {v.label}
          </span>
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 -mb-1">
        <span
          className="num text-7xl md:text-8xl font-medium leading-none tracking-tighter"
          style={{ color: v.color }}
        >
          {score}
        </span>
        <span className="num text-xl text-[var(--color-fg-faint)]">/100</span>
      </div>
    </section>
  );
}
