import type { AuditEntity, Verdict } from "./types";

type Props = {
  score: number;
  verdict: Verdict;
  entity: AuditEntity;
};

const VERDICT_STYLE: Record<Verdict, { bg: string; border: string; text: string; label: string }> = {
  fiable: { bg: "bg-green-900/50", border: "border-green-700", text: "text-green-300", label: "Fiable" },
  suspect: { bg: "bg-yellow-900/50", border: "border-yellow-700", text: "text-yellow-300", label: "Suspect" },
  alerte: { bg: "bg-red-900/50", border: "border-red-700", text: "text-red-300", label: "Alerte" },
};

export function ScoreHeader({ score, verdict, entity }: Props) {
  const style = VERDICT_STYLE[verdict];
  const barColor = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className={`rounded-2xl border p-6 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Score global de crédibilité</p>
          <p className="text-xs text-gray-500">
            {entity.name && <span className="text-gray-300">{entity.name}</span>}
            {entity.siren && <span className="ml-2 text-gray-500">SIREN {entity.siren}</span>}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-4xl font-black ${style.text}`}>
            {score}
            <span className="text-2xl">/100</span>
          </p>
          <p className={`text-sm font-semibold ${style.text}`}>{style.label}</p>
        </div>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
