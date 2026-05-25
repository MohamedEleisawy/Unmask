import { ScoreBar } from "@/shared/ui/ScoreBar";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { SourceLink } from "@/shared/ui/SourceLink";
import type { PartnershipResult } from "./types";

export function PartnershipCard({ result }: { result: PartnershipResult }) {
  return (
    <section className="grid grid-cols-[auto_1fr] gap-x-10 gap-y-3 py-8 border-t border-[var(--color-line)]">
      <span className="num text-2xl text-[var(--color-fg-faint)] leading-none mt-0.5">02</span>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-[var(--color-fg)]">Conformité loi influenceurs</h3>
        <p className="text-[11px] text-[var(--color-fg-subtle)]">Loi n°2023-451 du 9 juin 2023</p>
      </div>

      <div className="col-start-2 flex flex-col gap-3 mt-2">
        <div className="flex items-center gap-4 flex-wrap">
          <ScoreBar score={result.compliance_score} />
          <StatusBadge
            ok={result.has_disclosure}
            okLabel="Mention présente"
            failLabel="Mention manquante"
          />
        </div>

        {result.flags.length > 0 ? (
          <div className="flex flex-col gap-2 mt-1">
            {result.flags.map((f, i) => (
              <FlagRow key={i} flag={f} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-accent)]">Aucune violation détectée.</p>
        )}
      </div>
    </section>
  );
}

function FlagRow({ flag }: { flag: PartnershipResult["flags"][number] }) {
  const color = flag.severity === "violation" ? "var(--color-bad)" : "var(--color-warn)";
  return (
    <div className="border-l-2 pl-3 py-0.5" style={{ borderColor: color }}>
      <p className="text-xs font-medium" style={{ color }}>{flag.rule}</p>
      <p className="text-xs text-[var(--color-fg-muted)] mt-0.5 leading-relaxed">{flag.detail}</p>
      {flag.source_url && <SourceLink href={flag.source_url} label={flag.source} />}
    </div>
  );
}
