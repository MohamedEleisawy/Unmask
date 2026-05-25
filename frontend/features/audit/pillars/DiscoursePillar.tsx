import { ScoreBar } from "@/shared/ui/ScoreBar";
import type { PillarData } from "../types";

type Signal = { type: string; quote?: string; explanation: string };

const VERDICT: Record<string, { text: string; color: string }> = {
  safe: { text: "Sain", color: "var(--color-accent)" },
  suspicious: { text: "Suspect", color: "var(--color-warn)" },
  manipulative: { text: "Manipulatoire", color: "var(--color-bad)" },
};

export function DiscoursePillar({ data }: { data: PillarData }) {
  const score = data.manipulation_score as number;
  const signals = (data.signals as Signal[]) || [];
  const verdict = (data.verdict as string) || "safe";
  const v = VERDICT[verdict] || VERDICT.safe;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 flex-wrap">
        <ScoreBar score={100 - score} />
        <span
          className="text-[11px] uppercase tracking-wider font-medium"
          style={{ color: v.color }}
        >
          {v.text}
        </span>
      </div>
      {data.summary && (
        <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed max-w-[55ch]">
          {data.summary as string}
        </p>
      )}
      {signals.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {signals.map((s, i) => (
            <SignalRow key={i} signal={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  return (
    <div className="border-l-2 border-[var(--color-bad)] pl-3 py-0.5">
      <p className="text-[11px] uppercase tracking-wider font-medium text-[var(--color-bad)]">
        {signal.type.replace(/_/g, " ")}
      </p>
      {signal.quote && (
        <p className="italic text-xs text-[var(--color-fg-muted)] mt-1 leading-relaxed">
          « {signal.quote} »
        </p>
      )}
      <p className="text-xs text-[var(--color-fg-subtle)] mt-1 leading-relaxed">
        {signal.explanation}
      </p>
    </div>
  );
}
