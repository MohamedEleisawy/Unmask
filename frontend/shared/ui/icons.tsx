type IconProps = { className?: string };

const STROKE = 1.5;

function base(props: IconProps) {
  return {
    className: props.className ?? "w-4 h-4",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: STROKE,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

export function CrossIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4l9 16H3L12 4z" />
      <path d="M12 11v4" />
      <path d="M12 18v.01" strokeWidth={2} />
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function ChevronIcon({ className, open }: IconProps & { open: boolean }) {
  return (
    <svg
      {...base({ className })}
      style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function DotIcon({ className, tone = "accent" }: IconProps & { tone?: "accent" | "warn" | "bad" | "muted" }) {
  const fill = tone === "accent" ? "var(--color-accent)" : tone === "warn" ? "var(--color-warn)" : tone === "bad" ? "var(--color-bad)" : "var(--color-fg-faint)";
  return (
    <span
      className={className ?? "inline-block w-1.5 h-1.5 rounded-full"}
      style={{ background: fill, boxShadow: `0 0 0 3px ${fill}22` }}
      aria-hidden
    />
  );
}
