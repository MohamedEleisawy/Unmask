import { ScoreBar } from "@/shared/ui/ScoreBar";
import type { PillarData } from "../types";

type Result = { title: string; url: string; snippet: string; is_alert: boolean };

export function OsintPillar({ data }: { data: PillarData }) {
  const results = (data.results as Result[]) || [];
  const alertCount = data.alert_count as number;
  const score = data.reputation_score as number;
  const alerts = results.filter((r) => r.is_alert).slice(0, 3);

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <ScoreBar score={score} />
        {alertCount > 0 ? (
          <span className="text-xs text-red-400 font-semibold">{alertCount} alerte(s) trouvée(s)</span>
        ) : (
          <span className="text-xs text-green-400">Aucune alerte détectée</span>
        )}
      </div>
      {alerts.map((r, i) => (
        <AlertRow key={i} result={r} />
      ))}
    </div>
  );
}

function AlertRow({ result }: { result: Result }) {
  return (
    <div className="mb-2 p-2 rounded-lg bg-red-900/20 border border-red-900/50 text-xs">
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-red-300 hover:underline font-medium"
      >
        {result.title}
      </a>
      <p className="text-gray-500 mt-0.5 line-clamp-2">{result.snippet}</p>
    </div>
  );
}
