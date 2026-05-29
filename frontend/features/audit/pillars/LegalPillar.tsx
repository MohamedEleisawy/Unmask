import { InfoRow } from "@/shared/ui/InfoRow";
import { SourceLink } from "@/shared/ui/SourceLink";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { Warning } from "@/shared/ui/Warning";
import type { PillarData } from "../types";

export function LegalPillar({ data }: { data: PillarData }) {
  const found = data.found as boolean;
  const identity = data.identity as Record<string, unknown> | null;

  return (
    <div className="flex flex-col gap-3">
      <StatusBadge ok={found} okLabel="Entité enregistrée" failLabel="Introuvable" />
      {identity && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-1">
          <InfoRow label="Raison sociale" value={identity.nom as string} />
          <InfoRow label="SIREN" value={identity.siren as string} />
          <InfoRow
            label="Statut"
            value={(identity.est_actif as boolean) ? "Active" : "Radiée"}
            alert={!identity.est_actif as boolean}
          />
          <InfoRow label="Forme juridique" value={identity.forme_juridique as string} />
          <InfoRow label="Création" value={identity.date_creation as string} />
        </div>
      )}
      {typeof identity?.source_url === "string" && (
        <SourceLink href={identity.source_url} label="annuaire-entreprises.data.gouv.fr" />
      )}
      {typeof data.warning === "string" && <Warning text={data.warning} />}
    </div>
  );
}
