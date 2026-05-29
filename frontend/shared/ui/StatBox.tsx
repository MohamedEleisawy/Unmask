type Props = { label: string; value: string };

export function StatBox({ label, value }: Props) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] text-[var(--color-fg-faint)] uppercase tracking-wider">{label}</p>
      <p className="num text-sm text-[var(--color-fg)]">{value}</p>
    </div>
  );
}
