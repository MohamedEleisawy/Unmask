type Props = { score: number };

export function ScoreBar({ score }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const tone =
    score >= 70
      ? "var(--color-accent)"
      : score >= 40
        ? "var(--color-warn)"
        : "var(--color-bad)";
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-[3px] bg-[var(--color-line-strong)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${clamped}%`, background: tone, transition: "width var(--animate-duration-reveal) var(--ease-out)" }}
        />
      </div>
      <span className="num text-[11px] text-[var(--color-fg-muted)]">{score}<span className="text-[var(--color-fg-faint)]">/100</span></span>
    </div>
  );
}
