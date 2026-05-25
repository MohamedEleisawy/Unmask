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

  if (data.warning && flags.length === 0) {
    return <Warning text={data.warning as string} />;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <ScoreBar score={score} />
        <StatusBadge ok={hasDisclosure} okLabel="Mention partenariat ✓" failLabel="Pas de mention" />
      </div>
      {flags.map((f, i) => (
        <FlagRow key={i} flag={f} />
      ))}
      {flags.length === 0 && <p className="text-xs text-green-400">Aucune violation détectée.</p>}
    </div>
  );
}

function FlagRow({ flag }: { flag: Flag }) {
  const tone =
    flag.severity === "violation"
      ? "bg-red-900/30 border border-red-800 text-red-300"
      : "bg-yellow-900/30 border border-yellow-800 text-yellow-300";
  return (
    <div className={`mb-2 p-2 rounded-lg text-xs ${tone}`}>
      <p className="font-semibold">{flag.rule}</p>
      <p className="text-gray-400 mt-0.5">{flag.detail}</p>
      {flag.source_url && <SourceLink href={flag.source_url} label={flag.source || ""} />}
    </div>
  );
}
