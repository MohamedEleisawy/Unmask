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
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <StatBox label="Abonnés" value={fmt(data.subscribers as number)} />
        <StatBox label="Total vues" value={fmt(data.total_views as number)} />
        <StatBox label="Vidéos" value={fmt(data.video_count as number)} />
      </div>
      {typeof engagementRatio === "number" && (
        <div className="flex items-center gap-2 mb-3">
          <ScoreBar score={data.engagement_score as number} />
          <span className="text-xs text-gray-400">
            Ratio vues/abonnés : {engagementRatio.toFixed(2)}
          </span>
        </div>
      )}
      {flags.map((f, i) => (
        <FlagRow key={i} flag={f} />
      ))}
      {data.channel_url && <SourceLink href={data.channel_url as string} label="Voir la chaîne YouTube" />}
    </div>
  );
}

function FlagRow({ flag }: { flag: Flag }) {
  const tone =
    flag.severity === "suspicious"
      ? "bg-red-900/30 border border-red-800 text-red-300"
      : "bg-yellow-900/30 border border-yellow-800 text-yellow-300";
  return <div className={`mb-2 p-2 rounded-lg text-xs ${tone}`}>{flag.detail}</div>;
}
