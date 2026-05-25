import { InfoRow } from "@/shared/ui/InfoRow";
import { SourceLink } from "@/shared/ui/SourceLink";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { Warning } from "@/shared/ui/Warning";
import type { PillarData } from "../types";

export function LegalPillar({ data }: { data: PillarData }) {
  const found = data.found as boolean;
  const identity = data.identity as Record<string, unknown> | null;

  return (
    <div>
      <StatusBadge ok={found} okLabel="Entité trouvée" failLabel="Introuvable" />
      {identity && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <InfoRow label="Nom" value={identity.nom as string} />
          <InfoRow label="SIREN" value={identity.siren as string} />
          <InfoRow
            label="Statut"
            value={(identity.est_actif as boolean) ? "Active" : "Radiée"}
            alert={!identity.est_actif as boolean}
          />
          <InfoRow label="Forme" value={identity.forme_juridique as string} />
          <InfoRow label="Création" value={identity.date_creation as string} />
        </div>
      )}
      {identity?.source_url && (
        <SourceLink href={identity.source_url as string} label="Vérifier sur data.gouv.fr" />
      )}
      {data.warning && <Warning text={data.warning as string} />}
    </div>
  );
}
