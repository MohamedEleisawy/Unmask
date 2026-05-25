import { fmt } from "@/shared/ui/format";
import { ScoreBar } from "@/shared/ui/ScoreBar";
import { SourceLink } from "@/shared/ui/SourceLink";
import { StatBox } from "@/shared/ui/StatBox";
import type { PillarData } from "../types";

type Flag = { severity: string; detail: string };

export function YoutubePillar({ data }: { data: PillarData }) {
  const flags = (data.flags as Flag[]) || [];
  const engagementRatio = data.engagement_ratio as number | undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-x-6">
        <StatBox label="Abonnés" value={fmt(data.subscribers as number)} />
        <StatBox label="Vues totales" value={fmt(data.total_views as number)} />
        <StatBox label="Vidéos" value={fmt(data.video_count as number)} />
      </div>
      {typeof engagementRatio === "number" && (
        <div className="flex items-center gap-4 flex-wrap pt-2">
          <ScoreBar score={data.engagement_score as number} />
          <span className="text-xs text-[var(--color-fg-subtle)]">
            Ratio vues/abonnés <span className="num text-[var(--color-fg)]">{engagementRatio.toFixed(2)}</span>
          </span>
        </div>
      )}
      {flags.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {flags.map((f, i) => (
            <FlagRow key={i} flag={f} />
          ))}
        </div>
      )}
      {data.channel_url && (
        <SourceLink href={data.channel_url as string} label="Voir la chaîne YouTube" />
      )}
    </div>
  );
}

function FlagRow({ flag }: { flag: Flag }) {
  const color = flag.severity === "suspicious" ? "var(--color-bad)" : "var(--color-warn)";
  return (
    <div className="border-l-2 pl-3 py-0.5" style={{ borderColor: color }}>
      <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">{flag.detail}</p>
    </div>
  );
}
