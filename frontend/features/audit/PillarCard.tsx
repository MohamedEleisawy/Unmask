import type { PillarData } from "./types";

type Props = {
  number: string;
  title: string;
  subtitle: string;
  data: PillarData | undefined;
  render: (d: PillarData) => React.ReactNode;
  fallbackMessage?: string;
};

export function PillarCard({ number, title, subtitle, data, render, fallbackMessage }: Props) {
  const unavailable = !data || data.available === false;

  return (
    <article className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_minmax(180px,1fr)_2fr] gap-x-6 md:gap-x-10 gap-y-3 py-8 first:pt-6 last:pb-6 group">
      <span className="num text-2xl text-[var(--color-fg-faint)] leading-none mt-0.5 select-none group-hover:text-[var(--color-fg-subtle)] transition-colors">
        {number.padStart(2, "0")}
      </span>

      <div className="flex flex-col gap-1 col-span-1 md:col-span-1">
        <h3 className="text-sm font-medium text-[var(--color-fg)] tracking-tight">{title}</h3>
        <p className="text-[11px] text-[var(--color-fg-subtle)] leading-snug">{subtitle}</p>
        {unavailable && (
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)] mt-1">
            Indisponible
          </span>
        )}
      </div>

      <div className="col-span-2 md:col-span-1 min-w-0">
        {unavailable ? (
          <p className="text-xs text-[var(--color-fg-subtle)] italic">
            {(data?.warning as string) || fallbackMessage || "Donnée non disponible pour les inputs fournis."}
          </p>
        ) : (
          render(data!)
        )}
      </div>
    </article>
  );
}
