type Props = { ok: boolean; okLabel: string; failLabel: string };

export function StatusBadge({ ok, okLabel, failLabel }: Props) {
  return (
    <span
      className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border font-medium ${
        ok
          ? "bg-green-900/40 text-green-300 border-green-700"
          : "bg-red-900/40 text-red-300 border-red-700"
      }`}
    >
      {ok ? "✓ " : "✗ "}
      {ok ? okLabel : failLabel}
    </span>
  );
}
