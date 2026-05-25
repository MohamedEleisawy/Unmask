import { ScoreBar } from "@/shared/ui/ScoreBar";
import type { PillarData } from "../types";

type Signal = { type: string; quote?: string; explanation: string };

const VERDICT_LABEL: Record<string, { text: string; color: string }> = {
  safe: { text: "Sain", color: "text-green-400" },
  suspicious: { text: "Suspect", color: "text-yellow-400" },
  manipulative: { text: "Manipulatoire", color: "text-red-400" },
};

export function DiscoursePillar({ data }: { data: PillarData }) {
  const score = data.manipulation_score as number;
  const signals = (data.signals as Signal[]) || [];
  const verdict = (data.verdict as string) || "safe";
  const v = VERDICT_LABEL[verdict] || VERDICT_LABEL.safe;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <ScoreBar score={100 - score} />
        <span className={`text-xs font-semibold ${v.color}`}>{v.text}</span>
      </div>
      {data.summary && <p className="text-xs text-gray-400 mb-2">{data.summary as string}</p>}
      {signals.map((s, i) => (
        <SignalRow key={i} signal={s} />
      ))}
    </div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  return (
    <div className="mb-2 p-2 rounded-lg bg-red-900/20 border border-red-900/50 text-xs">
      <p className="font-semibold text-red-300">{signal.type}</p>
      {signal.quote && <p className="italic text-gray-400 mt-0.5">« {signal.quote} »</p>}
      <p className="text-gray-500 mt-0.5">{signal.explanation}</p>
    </div>
  );
}
