"use client";

import { useState } from "react";
import type { AuditResponse, AuditTrailEntry, Coverage, DomainIntelligence, PillarData, ScoreAlert, ScoreBreakdownRow, Timeline } from "./types";
import { generateAuditPdf } from "./generatePdf";
import { VERDICT, scoreColor, verdictWash } from "@/shared/ui/verdict";

type Props = { results: AuditResponse };

type SocialHit = {
  platform: string;
  profile_url: string | null;
  found: boolean;
  username?: string;
  followers?: string;
  verified?: boolean;
  official?: boolean;
  confidence?: number;
  verification_status?: string;
  confidence_reasons?: string[];
};

export function AuditResults({ results }: Props) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const handleDownloadPdf = async () => {
    setPdfBusy(true);
    try {
      await generateAuditPdf(results);
    } finally {
      setPdfBusy(false);
    }
  };

  const { global_score, entity, pillars, disclaimer, score_breakdown, audit_trail, timeline, alerts, coverage, domain_intelligence } = results;
  const entityName = entity.name || entity.url || "Entité auditée";
  const verdictColor = scoreColor(global_score);
  const scoreLabel = global_score >= 70 ? "Profil vérifié" : global_score >= 40 ? "Partiellement vérifié" : "Peu d'éléments vérifiables";

  const socialData = pillars.social_presence as PillarData | undefined;
  const allSocialHits = (socialData?.hits as SocialHit[] | undefined) ?? [];
  const foundHits = allSocialHits.filter((h) => h.found);
  const missingHits = allSocialHits.filter((h) => !h.found);

  const legalData = pillars.legal_identity as PillarData | undefined;
  const identity = legalData?.identity as Record<string, unknown> | null | undefined;
  const legalFound = !!legalData?.found && !!identity;
  const complianceData = pillars.compliance as PillarData | undefined;

  const resolved = pillars.identity_resolution as PillarData | undefined;
  const realName = (resolved?.real_name as string | null) || null;
  const photo = (resolved?.image_url as string | null) || null;
  const reputationData = pillars.reputation as PillarData | undefined;

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-8 pb-16">

      {/* Barre d'actions */}
      <div className="flex justify-end mb-4 print:hidden">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={pdfBusy}
          className="flex items-center gap-2 text-sm font-medium rounded-xl px-4 py-2 border transition-colors hover:border-(--au-border-strong) disabled:opacity-50"
          style={{ background: "var(--au-surface)", borderColor: "var(--au-border)", color: "var(--au-text)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="#0cdda5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {pdfBusy ? "Génération…" : "Télécharger le rapport PDF"}
        </button>
      </div>

      {/* Layout desktop: 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-12 items-start">

        {/* Colonne principale */}
        <div className="flex flex-col gap-8">

          <AlertBanner alerts={alerts} />

          {/* Header résultat + score */}
          <div
            className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-6 border"
            style={{ background: "var(--au-surface)", borderColor: "var(--au-border)" }}
          >
            <ScoreRing score={global_score} color={verdictColor} />
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={`Photo de ${realName || entityName}`}
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="size-16 rounded-full object-cover shrink-0 border"
                style={{ borderColor: "var(--au-border-strong)" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <p className="text-[0.625rem] uppercase tracking-[0.12em] font-medium" style={{ color: "var(--au-text-dim)" }}>
                Résultat de l’audit
              </p>
              <h1
                className="text-2xl font-bold tracking-tight truncate"
                style={{ color: verdictColor }}
              >
                @{entityName.replace(/^@/, "")}
              </h1>
              {realName && realName.toLowerCase() !== entityName.toLowerCase() && (
                <p className="text-xs" style={{ color: "var(--au-text-muted)" }}>
                  Identité : {realName}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="inline-block size-2 rounded-full shrink-0"
                  style={{ background: verdictColor, boxShadow: `0 0 0 3px ${verdictWash(verdictColor)}` }}
                />
                <span className="text-sm font-medium" style={{ color: verdictColor }}>
                  {scoreLabel}
                </span>
              </div>
              <p className="text-xs leading-relaxed mt-1 max-w-[38ch]" style={{ color: "var(--au-text-faint)" }}>
                Avec les informations disponibles, le profil présente un score de crédibilité de {global_score}%.
              </p>
              <CoverageLine coverage={coverage} />
            </div>
          </div>

          {/* Périmètre analysé — clarifie ce qui a servi à générer le score */}
          <AnalyzedScope name={entity.name} url={entity.url} />

          {/* Entreprise associée — purement descriptif, n'influence pas le score */}
          <section className="flex flex-col gap-4">
            <SectionTitle>Entreprise associée</SectionTitle>
            {legalFound && identity ? (
              <div
                className="rounded-2xl p-5 border grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4"
                style={{ background: "var(--au-surface)", borderColor: "var(--au-border)" }}
              >
                <InfoCell label="Nom" value={String(identity.nom ?? entityName)} highlight />
                {!!(entity.siren || identity.siren) && (
                  <InfoCell label="SIREN" value={String(entity.siren ?? identity.siren)} mono />
                )}
                {!!identity.siret && <InfoCell label="SIRET" value={String(identity.siret)} mono />}
                {!!identity.forme_juridique && <InfoCell label="Statut juridique" value={String(identity.forme_juridique)} />}
                {!!identity.date_creation && (
                  <InfoCell label="Date de création" value={formatFrDate(String(identity.date_creation))} />
                )}
                {identity.est_actif !== undefined && identity.est_actif !== null && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--au-text-dim)" }}>État</span>
                    <span className="text-sm font-medium" style={{ color: identity.est_actif ? VERDICT.good : VERDICT.bad }}>
                      {identity.est_actif ? "Active" : "Radiée"}
                    </span>
                  </div>
                )}
                {!!identity.activite && <InfoCell label="Activité" value={String(identity.activite)} />}
                {!!identity.dirigeant && <InfoCell label="Dirigeant" value={String(identity.dirigeant)} />}
                {entity.sector && entity.sector.toLowerCase() !== "autre" && (
                  <InfoCell label="Secteur" value={entity.sector} />
                )}
              </div>
            ) : (
              <div
                className="rounded-2xl p-5 border text-xs leading-relaxed"
                style={{ background: "var(--au-surface)", borderColor: "var(--au-border)", color: "var(--au-text-faint)" }}
              >
                Aucune entreprise identifiée dans les bases publiques consultées.
                <span className="block mt-1" style={{ color: "var(--au-text-dim)" }}>
                  Ne pas posséder de structure déclarée ne retire aucun point au score.
                </span>
              </div>
            )}
          </section>

          {/* Présence en ligne — toujours affichée, jamais masquée par les alertes réputation */}
          <section className="flex flex-col gap-4">
            <SectionTitle>Présence en ligne</SectionTitle>
            {foundHits.length > 0 ? (
              <div className="flex flex-col gap-2">
                {foundHits.map((hit) => (
                  <SocialRow key={hit.platform} hit={hit} />
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl p-5 border text-xs"
                style={{ background: "var(--au-surface)", borderColor: "var(--au-border)", color: "var(--au-text-faint)" }}
              >
                Aucun compte officiel n’a pu être confirmé sur les plateformes analysées.
              </div>
            )}
            {missingHits.length > 0 && (
              <p className="text-[11px]" style={{ color: "var(--au-text-dim)" }}>
                Non détecté : {missingHits.map((m) => platformLabel(m.platform)).join(" · ")}
              </p>
            )}
          </section>

          {/* Réputation publique & preuves */}
          <section className="flex flex-col gap-4">
            <SectionTitle>Réputation publique</SectionTitle>
            <ReputationSection data={reputationData} />
          </section>

          {/* Preuves trouvées — uniquement les contenus concernant réellement la personne */}
          <EvidenceSection data={reputationData} />

          {/* Chronologie reconstruite à partir des articles datés */}
          {timeline && timeline.entries.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionTitle>Chronologie</SectionTitle>
              <TimelineView timeline={timeline} />
            </section>
          )}

          {/* Sources techniques consultées — repliable, distinct des preuves */}
          {audit_trail && audit_trail.length > 0 && (
            <details className="group rounded-2xl border" style={{ background: "var(--au-surface)", borderColor: "var(--au-border)" }}>
              <summary
                className="flex items-center justify-between gap-2 px-5 py-3 cursor-pointer select-none text-sm font-semibold list-none"
                style={{ color: "var(--au-text-muted)" }}
              >
                <span>Sources techniques consultées ({audit_trail.length})</span>
                <svg className="transition-transform group-open:rotate-180" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="#6a6a6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="px-2 pb-2">
                <AuditTrailView trail={audit_trail} />
              </div>
            </details>
          )}

          {/* Disclaimer */}
          <p className="text-xs leading-relaxed" style={{ color: "var(--au-text-dim)" }}>
            {disclaimer}
          </p>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-20">
          {/* Conformité */}
          <section className="flex flex-col gap-4">
            <SectionTitle>Conformité</SectionTitle>
            <BlacklistCard data={complianceData} />
          </section>

          {/* Âge du nom de domaine (RDAP) — signal informatif, hors score */}
          {domain_intelligence && domain_intelligence.available && (
            <section className="flex flex-col gap-4">
              <SectionTitle>Nom de domaine</SectionTitle>
              <DomainCard data={domain_intelligence} />
            </section>
          )}

          {/* Résumé score */}
          <div
            className="rounded-2xl p-5 border flex flex-col gap-4"
            style={{ background: "var(--au-surface)", borderColor: "var(--au-border)" }}
          >
            <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "var(--au-text-dim)" }}>
              Score global
            </p>
            <div className="flex items-end gap-2">
              <span className="num text-5xl font-bold" style={{ color: verdictColor }}>
                {global_score}
              </span>
              <span className="num text-xl mb-1" style={{ color: "var(--au-text-dim)" }}>/100</span>
            </div>
            <CoverageLine coverage={coverage} />
            <ScoreBreakdown rows={score_breakdown} />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

function AlertBanner({ alerts }: { alerts?: ScoreAlert[] }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a, i) => {
        const critical = a.severity === "critique";
        const color = critical ? VERDICT.bad : VERDICT.warn;
        return (
          <div
            key={i}
            className="rounded-2xl p-5 border flex items-start gap-3"
            style={{ background: verdictWash(color), borderColor: `color-mix(in srgb, ${color} 34%, transparent)` }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
              <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold" style={{ color }}>{a.message}</p>
              {a.details && a.details.length > 0 && (
                <ul className="flex flex-col gap-0.5">
                  {a.details.map((d, j) => (
                    <li key={j} className="text-xs" style={{ color: "var(--au-text-muted)" }}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CoverageLine({ coverage }: { coverage?: Coverage }) {
  if (!coverage) return null;
  const color =
    coverage.confidence === "élevée" ? VERDICT.good :
    coverage.confidence === "moyenne" ? VERDICT.warn : VERDICT.bad;
  return (
    <p className="text-[11px]" style={{ color: "var(--au-text-faint)" }}>
      Score basé sur {coverage.evaluated}/{coverage.total} sources ·{" "}
      <span style={{ color }}>confiance {coverage.confidence}</span>
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold" style={{ color: "var(--au-text-muted)" }}>
      {children}
    </h2>
  );
}

function AnalyzedScope({ name, url }: { name?: string; url?: string }) {
  return (
    <section className="flex flex-col gap-4">
      <SectionTitle>Éléments analysés</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ScopeItem emoji="👤" label="Personne auditée" value={name || "—"} active={!!name} />
        <ScopeItem emoji="🌐" label="Site web analysé" value={url || "Aucun site fourni"} active={!!url} />
      </div>
    </section>
  );
}

function ScopeItem({ emoji, label, value, active }: { emoji: string; label: string; value: string; active: boolean }) {
  return (
    <div
      className="rounded-2xl p-4 border flex items-center gap-3"
      style={{ background: "var(--au-surface)", borderColor: "var(--au-border)" }}
    >
      <span className="text-xl shrink-0" aria-hidden="true">{emoji}</span>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--au-text-dim)" }}>{label}</span>
        <span className="text-sm font-medium truncate" style={{ color: active ? "var(--au-text)" : "var(--au-text-faint)" }}>
          {value}
        </span>
      </div>
    </div>
  );
}

function InfoCell({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--au-text-dim)" }}>{label}</span>
      <span
        className={`text-sm truncate ${mono ? "font-mono tabular-nums" : "font-medium"}`}
        style={{ color: highlight ? "#eee" : "var(--au-text-muted)" }}
      >
        {value}
      </span>
    </div>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative shrink-0 size-[96px] flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--au-border)" strokeWidth="6" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="relative flex items-baseline gap-0.5">
        <span className="num text-[22px] font-bold leading-none" style={{ color }}>
          {score}
        </span>
        <span className="num text-sm" style={{ color }}>%</span>
      </div>
    </div>
  );
}

function ScoreBreakdown({ rows }: { rows?: ScoreBreakdownRow[] }) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--au-text-dim)" }}>
        Barème par critère
      </p>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => {
          const color = r.available && r.score !== null ? scoreColor(r.score) : "var(--au-text-dim)";
          return (
            <li key={r.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs truncate" style={{ color: "var(--au-text-muted)" }}>{r.label}</span>
                <span className="text-[10px] shrink-0" style={{ color: "var(--au-text-faint)" }}>
                  poids {r.effective_weight}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--au-border)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${r.available && r.score !== null ? r.score : 0}%`,
                      background: color,
                      transition: "width var(--animate-duration-reveal) var(--ease-out)",
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium tabular-nums shrink-0 w-12 text-right" style={{ color }}>
                  {r.available && r.score !== null ? `${r.score}/100` : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] leading-snug" style={{ color: "var(--au-text-faint)" }}>
                  {r.reason}
                </span>
                <span className="text-[10px] tabular-nums shrink-0" style={{ color: "var(--au-text-faint)" }}>
                  {r.available ? `+${r.points} pts` : "—"}
                </span>
              </div>
              {r.details && r.details.length > 0 && (
                <ul className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                  {r.details.map((d, i) => (
                    <li key={i} className="text-[10px]" style={{ color: "var(--au-text-faint)" }}>{d}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-[10px] leading-relaxed pt-1 border-t" style={{ color: "var(--au-text-dim)", borderColor: "var(--au-border)" }}>
        Score = réputation publique. Identité, réseaux et entreprise sont affichés à titre informatif et n&apos;entrent pas dans le score.
      </p>
    </div>
  );
}

function formatFrDate(raw: string): string {
  // "2019-03-14" → "14 mars 2019" ; renvoie l'entrée brute si non parsable.
  const d = new Date(raw.slice(0, 10));
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function platformLabel(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return "Instagram";
  if (p.includes("tiktok")) return "TikTok";
  if (p.includes("youtube")) return "YouTube";
  if (p.includes("x") || p.includes("twitter")) return "X (Twitter)";
  return platform;
}

function confidenceColor(confidence: number): string {
  return confidence >= 80 ? VERDICT.good : confidence >= 70 ? VERDICT.warn : "var(--au-text-muted)";
}

function SocialRow({ hit }: { hit: SocialHit }) {
  const label = platformLabel(hit.platform);
  const username = hit.username?.replace(/^@/, "");
  const confidence = typeof hit.confidence === "number" ? hit.confidence : null;
  const verified = hit.verified === true;
  const official = hit.official === true;
  const statusLabel = official ? "Officiel" : "Probablement officiel";
  const statusColor = official ? VERDICT.good : VERDICT.warn;

  const reasons = (hit.confidence_reasons ?? []).slice(0, 4).join(" · ");

  return (
    <div
      className="flex flex-col gap-1.5 rounded-xl px-4 py-3 border transition-colors hover:border-(--au-border-strong)"
      style={{ background: "var(--au-surface)", borderColor: "var(--au-border)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="size-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--au-border)" }}
          >
            <SocialIcon platform={hit.platform} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium flex items-center gap-1" style={{ color: "var(--au-text)" }}>
              {label}
              {verified && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill={VERDICT.good} aria-label="Compte vérifié">
                  <path d="M12 2l2.4 1.8 3 .2.9 2.9 2.4 1.8-1 2.8 1 2.8-2.4 1.8-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9L3.3 15l1-2.8-1-2.8 2.4-1.8.9-2.9 3-.2z" />
                  <path d="M9.5 12.5l1.8 1.8 3.5-3.8" stroke="var(--verdict-good-on)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="text-xs truncate flex items-center gap-2" style={{ color: "var(--au-text-faint)" }}>
              {username && <span className="truncate">@{username}</span>}
              {hit.followers && (
                <span className="shrink-0" style={{ color: "var(--au-text-muted)" }}>· {hit.followers} abonnés</span>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline-block"
            style={{ color: statusColor, background: verdictWash(statusColor) }}
          >
            {statusLabel}
          </span>
          {confidence !== null && (
            <span
              className="text-[11px] font-medium tabular-nums w-9 text-right"
              style={{ color: confidenceColor(confidence) }}
              title="Score de confiance"
            >
              {confidence}%
            </span>
          )}
          {hit.profile_url && (
            <a
              href={hit.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ouvrir le profil ${label}${username ? ` @${username}` : ""} (nouvel onglet)`}
              className="tap-target size-7 rounded-lg flex items-center justify-center shrink-0 transition-all hover:opacity-70 active:scale-95"
              style={{ background: "var(--au-border-strong)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="#808080" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
        </div>
      </div>
      {reasons && (
        <p className="text-[10px] leading-snug pl-11" style={{ color: "var(--au-text-faint)" }}>
          {reasons}
        </p>
      )}
    </div>
  );
}

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="#6a6a6a" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="#6a6a6a" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="#6a6a6a" />
    </svg>
  );
  if (p.includes("tiktok")) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M9 12a4 4 0 1 0 4 4V4c.333 1.333 1.6 4 4 4" stroke="#6a6a6a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (p.includes("youtube")) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="4" stroke="#6a6a6a" strokeWidth="1.5" />
      <path d="M10 9.5L15 12L10 14.5V9.5Z" fill="#6a6a6a" />
    </svg>
  );
  return <span className="text-xs font-bold" style={{ color: "var(--au-text-muted)" }}>{platform[0]?.toUpperCase()}</span>;
}

function BlacklistCard({ data }: { data: PillarData | undefined }) {
  const isBlacklisted = data?.is_blacklisted as boolean | undefined;
  const present = isBlacklisted === true;
  const accentColor = present ? VERDICT.bad : VERDICT.good;

  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-4"
      style={{ background: verdictWash(accentColor), borderColor: `color-mix(in srgb, ${accentColor} 28%, transparent)` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold" style={{ color: "var(--au-text)" }}>
            Présence liste noire
          </p>
          <p className="text-xs" style={{ color: "var(--au-text-faint)" }}>
            Bases AMF et ACPR
          </p>
        </div>
        <div
          className="size-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: verdictWash(accentColor) }}
        >
          {present ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <ComplianceLine label="AMF" present={present} />
        <ComplianceLine label="ACPR" present={present} />
      </div>
    </div>
  );
}

function ComplianceLine({ label, present }: { label: string; present: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--au-text-faint)" }}>{label}</span>
      <span
        className="text-xs font-medium"
        style={{ color: present ? VERDICT.bad : VERDICT.good }}
      >
        {present ? "Présent" : "Non présent"}
      </span>
    </div>
  );
}

const DOMAIN_RISK_META: Record<string, { label: string; color: string }> = {
  critical: { label: "Critique", color: VERDICT.bad },
  high: { label: "Élevé", color: VERDICT.bad },
  medium: { label: "Modéré", color: VERDICT.warn },
  low: { label: "Faible", color: VERDICT.good },
};

function formatAge(days: number): string {
  if (days < 31) return `${days} jour${days > 1 ? "s" : ""}`;
  if (days < 365) {
    const m = Math.round(days / 30);
    return `${m} mois`;
  }
  const y = Math.floor(days / 365);
  const rem = Math.round((days % 365) / 30);
  return rem > 0 ? `${y} an${y > 1 ? "s" : ""} ${rem} mois` : `${y} an${y > 1 ? "s" : ""}`;
}

function DomainCard({ data }: { data: DomainIntelligence }) {
  const meta = (data.risk_level && DOMAIN_RISK_META[data.risk_level]) || {
    label: "Indéterminé",
    color: "var(--au-text-muted)",
  };
  const recent = data.risk_level === "critical" || data.risk_level === "high";

  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-4"
      style={{
        background: recent ? verdictWash(meta.color) : "var(--au-surface)",
        borderColor: recent ? `color-mix(in srgb, ${meta.color} 28%, transparent)` : "var(--au-border)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--au-text)" }}>
            {data.domain}
          </p>
          <p className="text-xs" style={{ color: "var(--au-text-faint)" }}>
            Âge du domaine (RDAP)
          </p>
        </div>
        <span
          className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{ color: meta.color, background: verdictWash(meta.color) }}
        >
          Risque {meta.label}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {data.age_days !== null && (
          <DomainLine label="Ancienneté" value={formatAge(data.age_days)} valueColor={meta.color} />
        )}
        {data.created_at && (
          <DomainLine label="Création" value={formatFrDate(data.created_at)} />
        )}
        {data.registrar && <DomainLine label="Hébergeur" value={data.registrar} />}
      </div>

      {recent && (
        <p className="text-[11px] leading-relaxed pt-2 border-t" style={{ color: "var(--au-text-faint)", borderColor: `color-mix(in srgb, ${meta.color} 20%, transparent)` }}>
          Un domaine récent n’est pas une preuve de fraude, mais c’est un signal de prudence. Ce critère n’affecte pas le score.
        </p>
      )}
    </div>
  );
}

function DomainLine({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs shrink-0" style={{ color: "var(--au-text-faint)" }}>{label}</span>
      <span className="text-xs font-medium truncate text-right" style={{ color: valueColor || "var(--au-text-muted)" }}>
        {value}
      </span>
    </div>
  );
}

function ReputationSection({ data }: { data?: PillarData }) {
  const available = !!data && data.available !== false;
  if (!available) {
    return (
      <div
        className="rounded-2xl p-5 border text-xs leading-relaxed"
        style={{ background: "var(--au-surface)", borderColor: "var(--au-border)", color: "var(--au-text-faint)" }}
      >
        Analyse de presse indisponible (service d’analyse IA non joignable).
        <span className="block mt-1" style={{ color: "var(--au-text-dim)" }}>
          L’absence d’analyse n’est pas considérée comme un signal négatif.
        </span>
      </div>
    );
  }
  const articles = (data?.articles as { impact?: string }[] | undefined) ?? [];
  const fav = articles.filter((a) => a.impact === "favorable").length;
  const neu = articles.filter((a) => a.impact === "neutral").length;
  const harm = articles.filter((a) => a.impact === "harmful").length;
  const n = articles.length;
  const summary = (data?.summary as string) || "Aucun article notable détecté.";
  const rationale = (data?.score_rationale as string) || "";
  const color = harm > 0 ? VERDICT.bad : VERDICT.good;

  return (
    <div className="rounded-2xl p-5 border flex flex-col gap-3" style={{ background: "var(--au-surface)", borderColor: "var(--au-border)" }}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs leading-relaxed flex-1" style={{ color: "var(--au-text-muted)" }}>{summary}</p>
        <span
          className="text-xs font-semibold shrink-0 px-2.5 py-1 rounded-full"
          style={{ color, background: verdictWash(color) }}
        >
          {n} article{n > 1 ? "s" : ""} trouvé{n > 1 ? "s" : ""}
        </span>
      </div>
      {n > 0 && (
        <div className="flex flex-wrap gap-2">
          <ImpactChip color={VERDICT.good} n={fav} label="favorable" />
          <ImpactChip color="var(--au-text-muted)" n={neu} label="neutre" />
          <ImpactChip color={VERDICT.bad} n={harm} label="défavorable" />
        </div>
      )}
      {rationale && (
        <p className="text-[11px] leading-relaxed px-3 py-2 rounded-lg" style={{ color: "var(--au-text-muted)", background: "var(--au-inset)" }}>
          <span className="font-semibold" style={{ color: "var(--au-text-muted)" }}>Justification du score : </span>
          {rationale}
        </p>
      )}
    </div>
  );
}

function ImpactChip({ color, n, label }: { color: string; n: number; label: string }) {
  return (
    <span
      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ color, background: verdictWash(color) }}
    >
      {n} {label}{n > 1 ? "s" : ""}
    </span>
  );
}

function eventColor(type: string): string {
  if (type === "condamnation") return VERDICT.bad;
  if (type === "enquete" || type === "plainte") return VERDICT.warn;
  return "var(--au-text-muted)";
}

function TimelineView({ timeline }: { timeline: Timeline }) {
  return (
    <div className="rounded-2xl p-5 border flex flex-col gap-4" style={{ background: "var(--au-surface)", borderColor: "var(--au-border)" }}>
      <ol className="flex flex-col gap-4">
        {timeline.entries.map((y) => (
          <li key={y.year} className="flex gap-4">
            <span className="text-sm font-bold tabular-nums w-12 shrink-0" style={{ color: "var(--au-text)" }}>{y.year}</span>
            <ul className="flex flex-col gap-1.5 flex-1 border-l pl-4" style={{ borderColor: "var(--au-border)" }}>
              {y.events.map((e, i) => (
                <li key={i} className="flex flex-col">
                  <span className="text-xs font-medium" style={{ color: eventColor(e.type) }}>{e.label}</span>
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-[11px] transition-opacity hover:opacity-70" style={{ color: "var(--au-text-muted)" }}>
                      {e.title}
                    </a>
                  ) : (
                    <span className="text-[11px]" style={{ color: "var(--au-text-muted)" }}>{e.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {!timeline.has_conviction && (
        <p className="text-[11px] pt-2 border-t" style={{ color: "var(--au-text-faint)", borderColor: "var(--au-border)" }}>
          Aucune condamnation publique trouvée à ce jour.
        </p>
      )}
    </div>
  );
}

function AuditTrailView({ trail }: { trail: AuditTrailEntry[] }) {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "var(--au-border)" }}>
      {trail.map((t, i) => (
        <div
          key={`${t.source}-${i}`}
          className={`flex items-center justify-between gap-3 px-4 py-3 ${i < trail.length - 1 ? "border-b" : ""}`}
          style={{ background: "var(--au-surface)", borderColor: "var(--au-border)" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="shrink-0" title={t.consulted ? "Consultée" : "Non consultée"}>
              {!t.consulted ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19" stroke="#6a6a6a" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              ) : (
                // Consultée : check vert si info trouvée, check gris si « rien à signaler ».
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill={t.found ? verdictWash(VERDICT.good) : "color-mix(in srgb, var(--au-text-muted) 12%, transparent)"} />
                  <path d="M8 12.5L11 15.5L16.5 9" stroke={t.found ? VERDICT.good : "var(--au-text-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="text-sm truncate" style={{ color: "var(--au-text)" }}>{t.source}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] truncate max-w-40 sm:max-w-55 text-right" style={{ color: t.found ? "var(--au-text-muted)" : "var(--au-text-faint)" }}>
              {t.result}
            </span>
            {t.evidence_url && (
              <a
                href={t.evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ouvrir la source : ${t.source} (nouvel onglet)`}
                className="tap-target size-6 rounded-md flex items-center justify-center shrink-0 transition-all hover:opacity-70"
                style={{ background: "var(--au-border-strong)" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="#808080" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const IMPACT_META: Record<string, { label: string; color: string }> = {
  harmful: { label: "Défavorable", color: VERDICT.bad },
  neutral: { label: "Neutre", color: "var(--au-text-muted)" },
  favorable: { label: "Favorable", color: VERDICT.good },
};

function mediaName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

type EvidenceArticle = {
  title: string;
  url: string;
  impact: string;
  reason: string;
  event_type?: string;
  year?: number | null;
};

// Gravité (gradation juridique) — du plus faible au plus grave.
const EVENT_LABELS: Record<string, string> = {
  accusation: "Accusation",
  plainte: "Plainte",
  enquete: "Enquête",
  condamnation: "Condamnation",
};

function EvidenceSection({ data }: { data?: PillarData }) {
  const available = !!data && data.available !== false;
  if (!available) return null;
  const articles = (data?.articles as EvidenceArticle[] | undefined) ?? [];
  if (articles.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle>Preuves trouvées ({articles.length})</SectionTitle>
      <div className="flex flex-col gap-2">
        {articles.map((a, i) => {
          const meta = IMPACT_META[a.impact] ?? IMPACT_META.neutral;
          const media = mediaName(a.url);
          return (
            <div
              key={i}
              className="rounded-xl border p-4 flex flex-col gap-1.5"
              style={{ background: "var(--au-surface)", borderColor: `color-mix(in srgb, ${meta.color} 22%, var(--au-border))` }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-medium" style={{ color: "var(--au-text-muted)" }}>{media || "Source"}</span>
                {!!a.year && <span className="text-[11px]" style={{ color: "var(--au-text-faint)" }}>· {a.year}</span>}
                <span
                  className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ color: meta.color, background: verdictWash(meta.color) }}
                >
                  {meta.label}
                </span>
                {a.event_type && EVENT_LABELS[a.event_type] && (
                  <span
                    className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ color: eventColor(a.event_type), background: verdictWash(eventColor(a.event_type)) }}
                  >
                    {EVENT_LABELS[a.event_type]}
                  </span>
                )}
              </div>
              {a.url ? (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium leading-snug transition-opacity hover:opacity-70"
                  style={{ color: "var(--au-text)" }}
                >
                  {a.title}
                </a>
              ) : (
                <span className="text-sm font-medium leading-snug" style={{ color: "var(--au-text)" }}>{a.title}</span>
              )}
              {a.reason && (
                <p className="text-xs leading-relaxed" style={{ color: "var(--au-text-muted)" }}>{a.reason}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
