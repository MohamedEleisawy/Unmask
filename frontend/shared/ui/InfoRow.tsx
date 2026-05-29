type Props = { label: string; value?: string; alert?: boolean };

export function InfoRow({ label, value, alert }: Props) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">{label}</p>
      <p className={`text-xs ${alert ? "text-[var(--color-bad)]" : "text-[var(--color-fg)]"}`}>{value}</p>
    </div>
  );
}
