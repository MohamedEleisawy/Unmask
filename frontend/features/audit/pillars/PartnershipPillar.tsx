import { ScoreBar } from "@/shared/ui/ScoreBar";
import { SourceLink } from "@/shared/ui/SourceLink";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { Warning } from "@/shared/ui/Warning";
import type { PillarData } from "../types";

type Flag = {
  rule: string;
  severity: string;
  detail: string;
  source?: string;
  source_url?: string;
};

export function PartnershipPillar({ data }: { data: PillarData }) {
  const score = data.compliance_score as number;
  const flags = (data.flags as Flag[]) || [];
  const hasDisclosure = data.has_disclosure as boolean;

  if (typeof data.warning === "string" && flags.length === 0) {
    return <Warning text={data.warning} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 flex-wrap">
        <ScoreBar score={score} />
        <StatusBadge ok={hasDisclosure} okLabel="Mention présente" failLabel="Mention manquante" />
      </div>
      {flags.length > 0 ? (
        <div className="flex flex-col gap-2 mt-1">
          {flags.map((f, i) => (
            <FlagRow key={i} flag={f} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-accent)] mt-1">Aucune violation détectée.</p>
      )}
    </div>
  );
}

function FlagRow({ flag }: { flag: Flag }) {
  const color =
    flag.severity === "violation" ? "var(--color-bad)" : "var(--color-warn)";
  return (
    <div className="border-l-2 pl-3 py-0.5" style={{ borderColor: color }}>
      <p className="text-xs font-medium" style={{ color }}>{flag.rule}</p>
      <p className="text-xs text-[var(--color-fg-muted)] mt-0.5 leading-relaxed">{flag.detail}</p>
      {flag.source_url && <SourceLink href={flag.source_url} label={flag.source || ""} />}
    </div>
  );
}