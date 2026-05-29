import { ScoreBar } from "@/shared/ui/ScoreBar";
import type { PillarData } from "../types";

type Result = { title: string; url: string; snippet: string; is_alert: boolean };

export function OsintPillar({ data }: { data: PillarData }) {
  const results = (data.results as Result[]) || [];
  const alertCount = data.alert_count as number;
  const score = data.reputation_score as number;
  const alerts = results.filter((r) => r.is_alert).slice(0, 3);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 flex-wrap">
        <ScoreBar score={score} />
        {alertCount > 0 ? (
          <span className="text-[11px] uppercase tracking-wider font-medium text-[var(--color-bad)]">
            {alertCount} alerte{alertCount > 1 ? "s" : ""} détectée{alertCount > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-[11px] uppercase tracking-wider font-medium text-[var(--color-accent)]">
            Aucune alerte
          </span>
        )}
      </div>
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {alerts.map((r, i) => (
            <AlertRow key={i} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertRow({ result }: { result: Result }) {
  return (
    <div className="border-l-2 border-[var(--color-bad)] pl-3 py-0.5">
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-[var(--color-fg)] hover:text-[var(--color-bad)] transition-colors font-medium leading-snug block"
      >
        {result.title}
      </a>
      <p className="text-xs text-[var(--color-fg-subtle)] mt-1 leading-relaxed line-clamp-2">
        {result.snippet}
      </p>
    </div>
  );
}
