"use client";

import type { AuditResponse, AuditTrailEntry, PillarData, ScoreBreakdownRow, Timeline } from "./types";

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
};

export function AuditResults({ results }: Props) {
  const { global_score, entity, pillars, disclaimer, score_breakdown, audit_trail, timeline } = results;
  const entityName = entity.name || entity.url || "Entité auditée";
  const scoreColor = global_score >= 70 ? "#0cdda5" : global_score >= 40 ? "#f5b454" : "#f84b5f";
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
          onClick={() => window.print()}
          className="flex items-center gap-2 text-sm font-medium rounded-xl px-4 py-2 border transition-colors hover:border-[#3a3a3a]"
          style={{ background: "#141414", borderColor: "#1e1e1e", color: "#cfcfcf" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="#0cdda5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Télécharger le rapport PDF
        </button>
      </div>

      {/* Layout desktop: 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-12 items-start">

        {/* Colonne principale */}
        <div className="flex flex-col gap-8">

          {/* Header résultat + score */}
          <div
            className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-6 border"
            style={{ background: "#141414", borderColor: "#1e1e1e" }}
          >
            <ScoreRing score={global_score} color={scoreColor} />
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={realName || entityName}
                className="size-16 rounded-full object-cover shrink-0 border"
                style={{ borderColor: "#2a2a2a" }}
              />
            )}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#3a3a3a" }}>
                Résultat de l’audit
              </p>
              <h2
                className="text-2xl font-bold font-landing-display truncate"
                style={{ color: scoreColor }}
              >
                @{entityName.replace(/^@/, "")}
              </h2>
              {realName && realName.toLowerCase() !== entityName.toLowerCase() && (
                <p className="text-xs" style={{ color: "#6a6a6a" }}>
                  Identité : {realName}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="inline-block size-2 rounded-full shrink-0"
                  style={{ background: scoreColor, boxShadow: `0 0 0 3px ${scoreColor}22` }}
                />
                <span className="text-sm font-medium" style={{ color: scoreColor }}>
                  {scoreLabel}
                </span>
              </div>
              <p className="text-xs leading-relaxed mt-1 max-w-[38ch]" style={{ color: "#4a4a4a" }}>
                Avec les informations disponibles, le profil présente un score de crédibilité de {global_score}%.
              </p>
            </div>
          </div>

          {/* Entreprise associée — purement descriptif, n'influence pas le score */}
          <section className="flex flex-col gap-4">
            <SectionTitle>Entreprise associée</SectionTitle>
            {legalFound && identity ? (
              <div
                className="rounded-2xl p-5 border grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4"
                style={{ background: "#141414", borderColor: "#1e1e1e" }}
              >
                <InfoCell label="Nom" value={String(identity.nom ?? entityName)} highlight />
                {!!(entity.siren || identity.siren) && (
                  <InfoCell label="SIREN" value={String(entity.siren ?? identity.siren)} mono />
                )}
                {!!identity.siret && <InfoCell label="SIRET" value={String(identity.siret)} mono />}
                {!!identity.forme_juridique && <InfoCell label="Statut juridique" value={String(identity.forme_juridique)} />}
                {!!identity.date_creation && (
                  <InfoCell label="Date de création" value={String(identity.date_creation).slice(0, 10)} />
                )}
                {!!identity.activite && <InfoCell label="Activité" value={String(identity.activite)} />}
                {!!identity.dirigeant && <InfoCell label="Dirigeant" value={String(identity.dirigeant)} />}
                {entity.sector && <InfoCell label="Secteur" value={entity.sector} />}
              </div>
            ) : (
              <div
                className="rounded-2xl p-5 border text-xs leading-relaxed"
                style={{ background: "#141414", borderColor: "#1e1e1e", color: "#5a5a5a" }}
              >
                Aucune entreprise identifiée dans les bases publiques consultées.
                <span className="block mt-1" style={{ color: "#3a3a3a" }}>
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
                style={{ background: "#141414", borderColor: "#1e1e1e", color: "#5a5a5a" }}
              >
                Aucun compte officiel n’a pu être confirmé sur les plateformes analysées.
              </div>
            )}
            {missingHits.length > 0 && (
              <p className="text-[11px]" style={{ color: "#3a3a3a" }}>
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
            <details className="group rounded-2xl border" style={{ background: "#141414", borderColor: "#1e1e1e" }}>
              <summary
                className="flex items-center justify-between gap-2 px-5 py-3 cursor-pointer select-none text-sm font-semibold list-none"
                style={{ color: "#6a6a6a" }}
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
          <p className="text-xs leading-relaxed" style={{ color: "#3a3a3a" }}>
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

          {/* Résumé score */}
          <div
            className="rounded-2xl p-5 border flex flex-col gap-4"
            style={{ background: "#141414", borderColor: "#1e1e1e" }}
          >
            <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#3a3a3a" }}>
              Score global
            </p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold tabular-nums" style={{ color: scoreColor }}>
                {global_score}
              </span>
              <span className="text-xl mb-1" style={{ color: "#3a3a3a" }}>/100</span>
            </div>
            <ScoreBreakdown rows={score_breakdown} />
          </div>
        </div>

      </div>

      {/* Rapport imprimable (masqué à l'écran, visible à l'impression / export PDF) */}
      <PrintableReport results={results} />
    </div>
  );
}

/* ---- Sub-components ---- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold" style={{ color: "#6a6a6a" }}>
      {children}
    </h3>
  );
}

function InfoCell({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest" style={{ color: "#3a3a3a" }}>{label}</span>
      <span
        className={`text-sm truncate ${mono ? "font-mono tabular-nums" : "font-medium"}`}
        style={{ color: highlight ? "#eee" : "#8a8a8a" }}
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
      <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0 -rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#1e1e1e" strokeWidth="6" />
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
        <span className="text-[22px] font-bold tabular-nums leading-none" style={{ color }}>
          {score}
        </span>
        <span className="text-sm" style={{ color }}>%</span>
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  return score >= 70 ? "#0cdda5" : score >= 40 ? "#f5b454" : "#f84b5f";
}

function ScoreBreakdown({ rows }: { rows?: ScoreBreakdownRow[] }) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest" style={{ color: "#3a3a3a" }}>
        Barème par critère
      </p>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => {
          const color = r.available && r.score !== null ? scoreColor(r.score) : "#3a3a3a";
          return (
            <li key={r.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs truncate" style={{ color: "#8a8a8a" }}>{r.label}</span>
                <span className="text-[10px] shrink-0" style={{ color: "#4a4a4a" }}>
                  poids {r.effective_weight}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1e1e1e" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${r.available && r.score !== null ? r.score : 0}%`, background: color }}
                  />
                </div>
                <span className="text-[11px] font-medium tabular-nums shrink-0 w-12 text-right" style={{ color }}>
                  {r.available && r.score !== null ? `${r.score}/100` : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] leading-snug" style={{ color: "#4a4a4a" }}>
                  {r.reason}
                </span>
                <span className="text-[10px] tabular-nums shrink-0" style={{ color: "#5a5a5a" }}>
                  {r.available ? `+${r.points} pts` : "—"}
                </span>
              </div>
              {r.details && r.details.length > 0 && (
                <ul className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                  {r.details.map((d, i) => (
                    <li key={i} className="text-[10px]" style={{ color: "#5a5a5a" }}>{d}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-[10px] leading-relaxed pt-1 border-t" style={{ color: "#3a3a3a", borderColor: "#1e1e1e" }}>
        Score global = somme des points. Les critères non calculables redistribuent leur poids sur les autres.
      </p>
    </div>
  );
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
  return confidence >= 80 ? "#0cdda5" : confidence >= 70 ? "#f5b454" : "#6a6a6a";
}

function SocialRow({ hit }: { hit: SocialHit }) {
  const label = platformLabel(hit.platform);
  const username = hit.username?.replace(/^@/, "");
  const confidence = typeof hit.confidence === "number" ? hit.confidence : null;
  const verified = hit.verified === true;
  const official = hit.official === true;
  const statusLabel = official ? "Officiel" : "Probablement officiel";
  const statusColor = official ? "#0cdda5" : "#f5b454";

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors hover:border-[#2a2a2a]"
      style={{ background: "#141414", borderColor: "#1e1e1e" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="size-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "#1e1e1e" }}
        >
          <SocialIcon platform={hit.platform} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium flex items-center gap-1" style={{ color: "#cfcfcf" }}>
            {label}
            {verified && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#0cdda5" aria-label="Compte vérifié">
                <path d="M12 2l2.4 1.8 3 .2.9 2.9 2.4 1.8-1 2.8 1 2.8-2.4 1.8-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9L3.3 15l1-2.8-1-2.8 2.4-1.8.9-2.9 3-.2z" />
                <path d="M9.5 12.5l1.8 1.8 3.5-3.8" stroke="#141414" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="text-xs truncate flex items-center gap-2" style={{ color: "#5a5a5a" }}>
            {username && <span className="truncate">@{username}</span>}
            {hit.followers && (
              <span className="shrink-0" style={{ color: "#6a6a6a" }}>· {hit.followers} abonnés</span>
            )}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline-block"
          style={{ color: statusColor, background: `${statusColor}14` }}
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
            className="size-7 rounded-lg flex items-center justify-center shrink-0 transition-all hover:opacity-70 active:scale-95"
            style={{ background: "#2a2a2a" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M7 17L17 7M17 7H7M17 7V17" stroke="#808080" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        )}
      </div>
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
  return <span className="text-xs font-bold" style={{ color: "#6a6a6a" }}>{platform[0]?.toUpperCase()}</span>;
}

function BlacklistCard({ data }: { data: PillarData | undefined }) {
  const isBlacklisted = data?.is_blacklisted as boolean | undefined;
  const present = isBlacklisted === true;
  const accentColor = present ? "#f84b5f" : "#0cdda5";
  const bgColor = present ? "#1f0a0c" : "#061512";

  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-4"
      style={{ background: bgColor, borderColor: present ? "#f84b5f22" : "#0cdda522" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold" style={{ color: "#eee" }}>
            Présence liste noire
          </p>
          <p className="text-xs" style={{ color: "#5a5a5a" }}>
            Bases AMF et ACPR
          </p>
        </div>
        <div
          className="size-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${accentColor}18` }}
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
      <span className="text-xs" style={{ color: "#4a4a4a" }}>{label}</span>
      <span
        className="text-xs font-medium"
        style={{ color: present ? "#f84b5f" : "#0cdda5" }}
      >
        {present ? "Présent" : "Non présent"}
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
        style={{ background: "#141414", borderColor: "#1e1e1e", color: "#5a5a5a" }}
      >
        Analyse de presse indisponible (service d’analyse IA non joignable).
        <span className="block mt-1" style={{ color: "#3a3a3a" }}>
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
  const color = harm > 0 ? "#f84b5f" : "#0cdda5";

  return (
    <div className="rounded-2xl p-5 border flex flex-col gap-3" style={{ background: "#141414", borderColor: "#1e1e1e" }}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs leading-relaxed flex-1" style={{ color: "#8a8a8a" }}>{summary}</p>
        <span
          className="text-xs font-semibold shrink-0 px-2.5 py-1 rounded-full"
          style={{ color, background: `${color}14` }}
        >
          {n} article{n > 1 ? "s" : ""} trouvé{n > 1 ? "s" : ""}
        </span>
      </div>
      {n > 0 && (
        <div className="flex flex-wrap gap-2">
          <ImpactChip color="#0cdda5" n={fav} label="favorable" />
          <ImpactChip color="#8a8a8a" n={neu} label="neutre" />
          <ImpactChip color="#f84b5f" n={harm} label="défavorable" />
        </div>
      )}
      {rationale && (
        <p className="text-[11px] leading-relaxed px-3 py-2 rounded-lg" style={{ color: "#8a8a8a", background: "#1a1a1a" }}>
          <span className="font-semibold" style={{ color: "#aaa" }}>Justification du score : </span>
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
      style={{ color, background: `${color}14` }}
    >
      {n} {label}{n > 1 ? "s" : ""}
    </span>
  );
}

function eventColor(type: string): string {
  if (type === "condamnation") return "#f84b5f";
  if (type === "enquete" || type === "plainte") return "#f5b454";
  return "#8a8a8a";
}

function TimelineView({ timeline }: { timeline: Timeline }) {
  return (
    <div className="rounded-2xl p-5 border flex flex-col gap-4" style={{ background: "#141414", borderColor: "#1e1e1e" }}>
      <ol className="flex flex-col gap-4">
        {timeline.entries.map((y) => (
          <li key={y.year} className="flex gap-4">
            <span className="text-sm font-bold tabular-nums w-12 shrink-0" style={{ color: "#cfcfcf" }}>{y.year}</span>
            <ul className="flex flex-col gap-1.5 flex-1 border-l pl-4" style={{ borderColor: "#1e1e1e" }}>
              {y.events.map((e, i) => (
                <li key={i} className="flex flex-col">
                  <span className="text-xs font-medium" style={{ color: eventColor(e.type) }}>{e.label}</span>
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-[11px] transition-opacity hover:opacity-70" style={{ color: "#6a6a6a" }}>
                      {e.title}
                    </a>
                  ) : (
                    <span className="text-[11px]" style={{ color: "#6a6a6a" }}>{e.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {!timeline.has_conviction && (
        <p className="text-[11px] pt-2 border-t" style={{ color: "#5a5a5a", borderColor: "#1e1e1e" }}>
          Aucune condamnation publique trouvée à ce jour.
        </p>
      )}
    </div>
  );
}

function AuditTrailView({ trail }: { trail: AuditTrailEntry[] }) {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "#1e1e1e" }}>
      {trail.map((t, i) => (
        <div
          key={`${t.source}-${i}`}
          className={`flex items-center justify-between gap-3 px-4 py-3 ${i < trail.length - 1 ? "border-b" : ""}`}
          style={{ background: "#141414", borderColor: "#1e1e1e" }}
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
                  <circle cx="12" cy="12" r="10" fill={t.found ? "#0cdda51f" : "#6a6a6a1f"} />
                  <path d="M8 12.5L11 15.5L16.5 9" stroke={t.found ? "#0cdda5" : "#8a8a8a"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="text-sm truncate" style={{ color: "#cfcfcf" }}>{t.source}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] truncate max-w-40 sm:max-w-55 text-right" style={{ color: t.found ? "#8a8a8a" : "#5a5a5a" }}>
              {t.result}
            </span>
            {t.evidence_url && (
              <a
                href={t.evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                className="size-6 rounded-md flex items-center justify-center shrink-0 transition-all hover:opacity-70"
                style={{ background: "#2a2a2a" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
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
  harmful: { label: "Défavorable", color: "#f84b5f" },
  neutral: { label: "Neutre", color: "#6a6a6a" },
  favorable: { label: "Favorable", color: "#0cdda5" },
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
              className="rounded-xl border p-4 flex flex-col gap-1.5 border-l-2"
              style={{ background: "#141414", borderColor: "#1e1e1e", borderLeftColor: meta.color }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-medium" style={{ color: "#8a8a8a" }}>{media || "Source"}</span>
                {!!a.year && <span className="text-[11px]" style={{ color: "#5a5a5a" }}>· {a.year}</span>}
                <span
                  className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ color: meta.color, background: `${meta.color}14` }}
                >
                  {meta.label}
                </span>
              </div>
              {a.url ? (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium leading-snug transition-opacity hover:opacity-70"
                  style={{ color: "#cfcfcf" }}
                >
                  {a.title}
                </a>
              ) : (
                <span className="text-sm font-medium leading-snug" style={{ color: "#cfcfcf" }}>{a.title}</span>
              )}
              {a.reason && (
                <p className="text-xs leading-relaxed" style={{ color: "#6a6a6a" }}>{a.reason}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---- Rapport PDF imprimable (thème clair, 1-2 pages) ---- */

function verdictLabel(score: number): string {
  return score >= 70 ? "Profil vérifié" : score >= 40 ? "Partiellement vérifié" : "Peu d'éléments vérifiables";
}

function PrintableReport({ results }: { results: AuditResponse }) {
  const { global_score, entity, pillars, score_breakdown, audit_trail } = results;
  const name = (entity.name || entity.url || "Entité auditée").replace(/^@/, "");

  const resolved = pillars.identity_resolution as PillarData | undefined;
  const realName = (resolved?.real_name as string) || null;
  const photo = (resolved?.image_url as string) || null;

  const social = pillars.social_presence as PillarData | undefined;
  const foundHits = ((social?.hits as SocialHit[] | undefined) ?? []).filter((h) => h.found);

  const legal = pillars.legal_identity as PillarData | undefined;
  const identity = legal?.identity as Record<string, unknown> | null | undefined;
  const legalFound = !!legal?.found && !!identity;

  const reputation = pillars.reputation as PillarData | undefined;
  const repAvailable = !!reputation && reputation.available !== false;
  const articles = (reputation?.articles as EvidenceArticle[] | undefined) ?? [];
  const harmful = articles.filter((a) => a.impact === "harmful");

  const accent = global_score >= 70 ? "#0a8f6a" : global_score >= 40 ? "#b67d10" : "#c0392b";

  const h2: React.CSSProperties = { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", margin: "14px 0 6px" };
  const card: React.CSSProperties = { border: "1px solid #e2e2e2", borderRadius: 8, padding: "8px 12px" };
  const small: React.CSSProperties = { fontSize: 11, color: "#444", lineHeight: 1.4 };

  return (
    <div className="print-report" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12, color: "#111", padding: 4 }}>
      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "2px solid #111", paddingBottom: 12 }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888" }}>Rapport d’audit Unmask</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>@{name}</div>
          {realName && realName.toLowerCase() !== name.toLowerCase() && (
            <div style={{ fontSize: 12, color: "#555" }}>Identité : {realName}</div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: accent, lineHeight: 1 }}>{global_score}<span style={{ fontSize: 16, color: "#999" }}>/100</span></div>
          <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>{verdictLabel(global_score)}</div>
        </div>
      </div>

      {/* Score par critère */}
      {score_breakdown && score_breakdown.length > 0 && (
        <>
          <div style={h2}>Score de crédibilité</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {score_breakdown.map((r) => (
              <div key={r.key} style={{ ...small, display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span>{r.label}</span>
                <strong>{r.available && r.score !== null ? `${r.score}/100` : "Non évalué"}</strong>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Réseaux sociaux */}
      <div style={h2}>Réseaux sociaux officiels</div>
      {foundHits.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {foundHits.map((h) => (
            <div key={h.platform} style={{ ...small }}>
              <strong>{platformLabel(h.platform)}</strong> @{(h.username || "").replace(/^@/, "")}
              {" · "}{h.official ? "officiel" : "probable"} ({h.confidence}%)
            </div>
          ))}
        </div>
      ) : (
        <div style={small}>Aucun compte officiel confirmé.</div>
      )}

      {/* Entreprise */}
      <div style={h2}>Entreprise associée</div>
      {legalFound && identity ? (
        <div style={{ ...card, ...small, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
          <span>Nom : <strong>{String(identity.nom ?? name)}</strong></span>
          {!!identity.siren && <span>SIREN : {String(identity.siren)}</span>}
          {!!identity.siret && <span>SIRET : {String(identity.siret)}</span>}
          {!!identity.forme_juridique && <span>Statut : {String(identity.forme_juridique)}</span>}
          {!!identity.date_creation && <span>Création : {String(identity.date_creation).slice(0, 10)}</span>}
          {!!identity.dirigeant && <span>Dirigeant : {String(identity.dirigeant)}</span>}
          {!!identity.activite && <span style={{ gridColumn: "1 / -1" }}>Activité : {String(identity.activite)}</span>}
        </div>
      ) : (
        <div style={small}>Aucune entreprise identifiée dans les bases publiques consultées.</div>
      )}

      {/* Réputation publique */}
      <div style={h2}>Réputation publique</div>
      {repAvailable ? (
        <div style={small}>
          <div>{(reputation?.summary as string) || "Aucun article notable détecté."}</div>
          <div style={{ marginTop: 4 }}>
            <strong>{articles.length}</strong> article(s) — {articles.filter((a) => a.impact === "favorable").length} favorable(s), {articles.filter((a) => a.impact === "neutral").length} neutre(s), {harmful.length} défavorable(s)
          </div>
        </div>
      ) : (
        <div style={small}>Analyse de réputation indisponible (non pénalisant).</div>
      )}

      {/* Principales alertes */}
      {harmful.length > 0 && (
        <>
          <div style={h2}>Principales alertes</div>
          <ul style={{ ...small, margin: 0, paddingLeft: 16 }}>
            {harmful.slice(0, 5).map((a, i) => (
              <li key={i} style={{ marginBottom: 2 }}>
                <strong>{mediaName(a.url) || "Source"}{a.year ? ` (${a.year})` : ""}</strong> — {a.title}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Sources utilisées */}
      {audit_trail && audit_trail.length > 0 && (
        <>
          <div style={h2}>Sources techniques consultées</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
            {audit_trail.map((t: AuditTrailEntry, i) => (
              <div key={i} style={small}>{t.source} — {t.result}</div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 14, paddingTop: 8, borderTop: "1px solid #ddd", fontSize: 9, color: "#999" }}>
        {results.disclaimer} — Généré le {new Date().toLocaleDateString("fr-FR")}.
      </div>
    </div>
  );
}
