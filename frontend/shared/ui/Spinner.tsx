type Props = { label: string };

export function Spinner({ label }: Props) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="relative inline-block w-3.5 h-3.5">
        <span className="absolute inset-0 rounded-full border border-[var(--color-bg)]/30" />
        <span className="absolute inset-0 rounded-full border border-[var(--color-bg)] border-t-transparent animate-spin" />
      </span>
      {label}
    </span>
  );
}
