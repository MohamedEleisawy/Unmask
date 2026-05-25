import type { DiscourseResult } from "./types";

const VERDICT: Record<DiscourseResult["verdict"], { text: string; color: string }> = {
  safe: { text: "Sain", color: "var(--color-accent)" },
  suspicious: { text: "Suspect", color: "var(--color-warn)" },
  manipulative: { text: "Manipulatoire", color: "var(--color-bad)" },
};

export function DiscourseCard({ result }: { result: DiscourseResult }) {
  return (
    <section className="grid grid-cols-[auto_1fr] gap-x-10 gap-y-3 py-8 border-t border-[var(--color-line)]">
      <span className="num text-2xl text-[var(--color-fg-faint)] leading-none mt-0.5">03</span>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-[var(--color-fg)]">Analyse du discours</h3>
        <p className="text-[11px] text-[var(--color-fg-subtle)]">Détection IA de signaux de manipulation</p>
      </div>

      <div className="col-start-2">
        {!result.available ? (
          <p className="text-xs text-[var(--color-fg-subtle)] italic">{result.warning}</p>
        ) : (
          <Body result={result} />
        )}
      </div>
    </section>
  );
}

function Body({ result }: { result: DiscourseResult }) {
  const v = VERDICT[result.verdict];

  return (
    <div className="flex flex-col gap-4 mt-2">
      <div className="flex items-baseline gap-2">
        <span className="num text-4xl font-medium leading-none tracking-tighter" style={{ color: v.color }}>
          {result.manipulation_score}
        </span>
        <span className="num text-xs text-[var(--color-fg-faint)]">/100 manipulation</span>
        <span
          className="ml-3 text-[11px] uppercase tracking-wider font-medium"
          style={{ color: v.color }}
        >
          {v.text}
        </span>
      </div>

      {result.summary && (
        <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed max-w-[60ch]">
          {result.summary}
        </p>
      )}

      {result.signals.length > 0 ? (
        <div className="flex flex-col gap-2">
          {result.signals.map((s, i) => (
            <div key={i} className="border-l-2 border-[var(--color-bad)] pl-3 py-0.5">
              <p className="text-[11px] uppercase tracking-wider font-medium text-[var(--color-bad)]">
                {s.type.replace(/_/g, " ")}
              </p>
              {s.quote && (
                <p className="italic text-xs text-[var(--color-fg-muted)] mt-1 leading-relaxed">
                  « {s.quote} »
                </p>
              )}
              <p className="text-xs text-[var(--color-fg-subtle)] mt-1 leading-relaxed">{s.explanation}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-accent)]">Aucun signal de manipulation détecté.</p>
      )}
    </div>
  );
}
