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
    <div className="flex flex-col gap-3">
      <StatusBadge
        ok={!blacklisted}
        okLabel="Hors liste noire"
        failLabel={`Liste noire — ${matches.length} match${matches.length > 1 ? "s" : ""}`}
      />
      {matches.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {matches.map((m, i) => (
            <MatchRow key={i} match={m} />
          ))}
        </div>
      )}
      {data.warning && <Warning text={data.warning as string} />}
      <SourceLink
        href="https://www.abe-infoservice.fr/liste-noire"
        label="abe-infoservice.fr/liste-noire"
      />
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  return (
    <div className="border-l-2 border-[var(--color-bad)] pl-3 py-0.5">
      <p className="text-xs font-medium text-[var(--color-bad)]">{match.matched_value}</p>
      {match.categories.length > 0 && (
        <p className="text-[11px] text-[var(--color-fg-subtle)] mt-0.5">
          {match.categories.join(" · ")}
        </p>
      )}
      {match.source_url && <SourceLink href={match.source_url} label={match.source || ""} />}
    </div>
  );
}
