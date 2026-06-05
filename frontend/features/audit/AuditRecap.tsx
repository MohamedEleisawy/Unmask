import type { AuditResponse, PillarData } from "./types";

type Props = { results: AuditResponse };

function get(data: PillarData | undefined, key: string): unknown {
  return data?.[key];
}

export function AuditRecap({ results }: Props) {
  const { pillars, resolved_identity, entity } = results;

  const legal    = pillars.legal_identity;
  const social   = pillars.social_presence;
  const rep      = pillars.reputation;
  const osint    = pillars.osint;
  const sector   = pillars.sector_compliance;
  const comp     = pillars.compliance;

  // Identité légale
  const legalFound   = get(legal, "found") as boolean | undefined;
  const legalId      = get(legal, "identity") as Record<string, unknown> | null | undefined;
  const isActif      = legalId ? (legalId.est_actif as boolean) : null;

  // Réseaux sociaux
  const hits = (get(social, "hits") as Array<{ platform: string; found: boolean; profile_url?: string }>) ?? [];

  // Réputation médias
  const repScore    = get(rep, "reputation_score") as number | undefined;
  const repSummary  = get(rep, "summary") as string | undefined;
  const harmful     = (get(rep, "harmful_count") as number) ?? 0;

  // OSINT
  const osintScore  = get(osint, "reputation_score") as number | undefined;
  const osintAlerts = (get(osint, "alert_count") as number) ?? 0;

  // Secteurs interdits
  const sectorStatus  = get(sector, "status") as string | undefined;
  const sectorLabel   = get(sector, "label") as string | undefined;

  // Conformité AMF
  const blacklisted = get(comp, "is_blacklisted") as boolean | undefined;

  return (
    <div className="rounded-lg border border-[var(--color-line-strong)] bg-surface overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-[var(--color-line)] bg-surface-raised">
        <span className="text-[10px] uppercase tracking-[0.18em] text-fg-faint font-medium">
          Synthèse de l'audit
        </span>
      </div>

      <div className="divide-y divide-[var(--color-line)]">

        {/* Identité */}
        <Row icon="👤" label="Identité">
          <span className="text-fg">{entity.name}</span>
          {resolved_identity?.real_name && resolved_identity.real_name.toLowerCase() !== entity.name?.toLowerCase() && (
            <span className="text-fg-subtle ml-2">
              → vrai nom : <span className="text-fg">{resolved_identity.real_name}</span>
              {resolved_identity.confidence === "high" && (
                <span className="ml-1 text-accent text-[10px] uppercase tracking-wider">confirmé</span>
              )}
            </span>
          )}
        </Row>

        {/* Statut légal */}
        {legalFound !== undefined && (
          <Row icon="🏢" label="Société enregistrée">
            {!legalFound ? (
              <span className="text-fg-subtle">Aucune structure juridique trouvée</span>
            ) : (
              <span className={isActif ? "text-accent" : "text-fg-subtle"}>
                {legalId?.nom as string}
                <span className="ml-2 text-[11px]">
                  {isActif ? "• Active" : "• Radiée (fermée)"}
                </span>
              </span>
            )}
          </Row>
        )}

        {/* Réseaux sociaux */}
        {hits.length > 0 && (
          <Row icon="📱" label="Réseaux sociaux">
            <div className="flex flex-wrap gap-2">
              {hits.map((h) => (
                <a
                  key={h.platform}
                  href={h.found ? h.profile_url : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    h.found
                      ? "border-[var(--color-accent)]/30 text-accent bg-[var(--color-accent)]/5 hover:bg-[var(--color-accent)]/10"
                      : "border-[var(--color-line-strong)] text-fg-faint"
                  }`}
                >
                  {h.platform} {h.found ? "✓" : "—"}
                </a>
              ))}
            </div>
          </Row>
        )}

        {/* Réputation médias */}
        {repScore !== undefined && (
          <Row icon="📰" label="Réputation médias">
            <Score value={repScore} />
            {harmful > 0 && (
              <span className="ml-2 text-[var(--color-bad)] text-[11px]">
                {harmful} article{harmful > 1 ? "s" : ""} négatif{harmful > 1 ? "s" : ""}
              </span>
            )}
            {repSummary && <span className="ml-2 text-fg-subtle text-[11px] line-clamp-1">{repSummary}</span>}
          </Row>
        )}

        {/* OSINT */}
        {osintScore !== undefined && (
          <Row icon="🔍" label="Presse / signalements">
            <Score value={osintScore} />
            {osintAlerts > 0 ? (
              <span className="ml-2 text-[var(--color-bad)] text-[11px]">
                {osintAlerts} article{osintAlerts > 1 ? "s" : ""} négatif{osintAlerts > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="ml-2 text-fg-subtle text-[11px]">Aucun article négatif détecté</span>
            )}
          </Row>
        )}

        {/* Secteurs interdits */}
        {sectorStatus && (
          <Row icon="⚖️" label="Secteurs interdits (loi 2023)">
            <StatusPill status={sectorStatus} />
            {sectorLabel && <span className="ml-2 text-fg-subtle text-[11px] line-clamp-1">{sectorLabel}</span>}
          </Row>
        )}

        {/* Conformité AMF */}
        {blacklisted !== undefined && (
          <Row icon="🏛️" label="Liste noire AMF/ACPR">
            {blacklisted ? (
              <span className="text-[var(--color-bad)] text-[11px] font-medium uppercase tracking-wider">Présent sur la liste noire</span>
            ) : (
              <span className="text-accent text-[11px]">Hors liste noire</span>
            )}
          </Row>
        )}

      </div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5">
      <span className="text-sm mt-0.5 w-5 shrink-0">{icon}</span>
      <span className="text-[11px] uppercase tracking-wider text-fg-faint w-40 shrink-0 mt-0.5">{label}</span>
      <div className="flex flex-wrap items-center gap-1 text-xs">{children}</div>
    </div>
  );
}

function Score({ value }: { value: number }) {
  const color = value >= 75 ? "var(--color-accent)" : value >= 40 ? "var(--color-warn)" : "var(--color-bad)";
  return (
    <span className="num font-semibold text-sm" style={{ color }}>
      {value}/100
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    clean:       "text-accent border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5",
    disclosed:   "text-[var(--color-warn)] border-[var(--color-warn)]/30 bg-[var(--color-warn)]/5",
    undisclosed: "text-[var(--color-bad)] border-[var(--color-bad)]/30 bg-[var(--color-bad)]/5",
  };
  const labels: Record<string, string> = {
    clean: "Aucun signal", disclosed: "Signal + disclaimer", undisclosed: "Signal sans mention",
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${styles[status] ?? styles.disclosed}`}>
      {labels[status] ?? status}
    </span>
  );
}
