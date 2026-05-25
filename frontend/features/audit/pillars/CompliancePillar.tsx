import { SourceLink } from "@/shared/ui/SourceLink";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { Warning } from "@/shared/ui/Warning";
import type { PillarData } from "../types";

type Match = {
  matched_value: string;
  categories: string[];
  source?: string;
  source_url?: string;
};

export function CompliancePillar({ data }: { data: PillarData }) {
  const blacklisted = data.is_blacklisted as boolean;
  const matches = (data.matches as Match[]) || [];

  return (
    <div>
      <StatusBadge
        ok={!blacklisted}
        okLabel="Absent de la liste noire"
        failLabel={`Liste noire AMF (${matches.length} correspondance${matches.length > 1 ? "s" : ""})`}
      />
      {matches.map((m, i) => (
        <MatchRow key={i} match={m} />
      ))}
      {data.warning && <Warning text={data.warning as string} />}
      <SourceLink
        href="https://www.abe-infoservice.fr/liste-noire"
        label="Consulter la liste noire ABE Infoservice"
      />
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  return (
    <div className="mt-2 p-2 rounded-lg bg-red-900/30 border border-red-800 text-xs text-red-300">
      <p className="font-semibold">{match.matched_value}</p>
      <p className="text-gray-400">{match.categories?.join(", ")}</p>
      {match.source_url && <SourceLink href={match.source_url} label={match.source || ""} />}
    </div>
  );
}
