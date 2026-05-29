import { CheckIcon, CrossIcon } from "./icons";

type Props = { ok: boolean; okLabel: string; failLabel: string };

export function StatusBadge({ ok, okLabel, failLabel }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] tracking-wide uppercase px-2 py-1 rounded-md font-medium border ${
        ok
          ? "text-[var(--color-accent)] border-[var(--color-accent-dim)] bg-[color:var(--color-accent-dim)]/15"
          : "text-[var(--color-bad)] border-[var(--color-bad)]/30 bg-[color:var(--color-bad)]/10"
      }`}
    >
      {ok ? <CheckIcon className="w-3 h-3" /> : <CrossIcon className="w-3 h-3" />}
      {ok ? okLabel : failLabel}
    </span>
  );
}
