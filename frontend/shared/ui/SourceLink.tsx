import { ArrowUpRightIcon } from "./icons";

type Props = { href: string; label: string };

export function SourceLink({ href, label }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] mt-2 transition-colors group"
    >
      <span className="underline decoration-dotted decoration-[var(--color-fg-faint)] underline-offset-4 group-hover:decoration-[var(--color-accent)]">
        {label}
      </span>
      <ArrowUpRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-px group-hover:-translate-y-px" />
    </a>
  );
}
