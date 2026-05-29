"use client";

import type { AuditResponse, PillarData, ScoreBreakdownRow } from "./types";

type Props = { results: AuditResponse };

const CRITERIA_DETAILS = [
  {
    key: "legal_identity",
    label: "Identité légale vérifiable",
    getStatus: (d?: PillarData) => ({
      label: d?.found ? "Identifié" : "Introuvable",
      color: d?.found ? "#0cdda5" : "#f84b5f",
      desc: d?.found
        ? String((d?.identity as Record<string, unknown> | null)?.nom ?? "Entité trouvée")
        : "Aucune société trouvée pour ce nom.",
    }),
  },
  {
    key: "compliance",
    label: "Conformité AMF / ACPR",
    getStatus: (d?: PillarData) => ({
      label: d?.is_blacklisted ? "Présent en liste noire" : "Hors liste noire",
      color: d?.is_blacklisted ? "#f84b5f" : "#0cdda5",
      desc: d?.is_blacklisted
        ? String((d.matches as { matched_value: string }[] | undefined)?.[0]?.matched_value ?? "Correspondance trouvée")
        : "Non référencé dans les bases AMF / ACPR.",
    }),
  },
  {
    key: "reputation",
    label: "Réputation publique",
    getStatus: (d?: PillarData) => {
      const harmful = (d?.harmful_count as number) ?? 0;
      const available = !!d && d.available !== false;
      return {
        label: !available
          ? "Analyse indisponible"
          : harmful > 0
            ? `${harmful} article${harmful > 1 ? "s" : ""} défavorable${harmful > 1 ? "s" : ""}`
            : "Aucune atteinte à l'image",
        color: !available ? "#5a5a5a" : harmful > 0 ? "#f84b5f" : "#0cdda5",
        desc: !available
          ? "L'analyse de presse n'a pas pu être effectuée."
          : (d?.summary as string) || "Aucun article notable détecté.",
      };
    },
  },
  {
    key: "social_presence",
    label: "Transparence partenariats",
    getStatus: (d?: PillarData) => ({
      label: d ? "Partenariats visibles" : "Aucune donnée",
      color: d ? "#0cdda5" : "#5a5a5a",
      desc: d ? "Les partenariats et mentions AD sont identifiés." : "Données insuffisantes.",
    }),
  },
];

export function AuditResults({ results }: Props) {
  const { global_score, entity, pillars, disclaimer, score_breakdown } = results;
  const entityName = entity.name || entity.url || "Entité auditée";
  const scoreColor = global_score >= 70 ? "#0cdda5" : global_score >= 40 ? "#f5b454" : "#f84b5f";
  const scoreLabel = global_score >= 70 ? "Plutôt fiable" : global_score >= 40 ? "Profil suspect" : "Peu fiable";

  const socialHits = pillars.social_presence as PillarData | undefined;
  const foundHits = ((socialHits?.hits as { platform: string; profile_url: string | null; found: boolean }[] | undefined) ?? []).filter((h) => h.found);

  const identity = (pillars.legal_identity as PillarData | undefined)?.identity as Record<string, unknown> | null | undefined;
  const complianceData = pillars.compliance as PillarData | undefined;

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-8 pb-16">

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
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "#3a3a3a" }}>
                Résultat de l'audit
              </p>
              <h2
                className="text-2xl font-bold font-landing-display truncate"
                style={{ color: "#f84b5f" }}
              >
                @{entityName.replace(/^@/, "")}
              </h2>
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

          {/* Détails entité */}
          {identity && (
            <section className="flex flex-col gap-4">
              <SectionTitle>Identité légale</SectionTitle>
              <div
                className="rounded-2xl p-5 border grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4"
                style={{ background: "#141414", borderColor: "#1e1e1e" }}
              >
                <InfoCell label="Raison sociale" value={String(identity.nom ?? entityName)} highlight />
                {entity.siren && <InfoCell label="SIREN" value={entity.siren} mono />}
                {!!identity.forme_juridique && <InfoCell label="Forme juridique" value={String(identity.forme_juridique)} />}
                {!!identity.date_creation && (
                  <InfoCell
                    label="Création"
                    value={String(identity.date_creation).slice(0, 10)}
                  />
                )}
                {entity.sector && <InfoCell label="Secteur" value={entity.sector} />}
                {entity.url && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest" style={{ color: "#3a3a3a" }}>Site web</span>
                    <a
                      href={entity.url.startsWith("http") ? entity.url : `https://${entity.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm transition-opacity hover:opacity-70 truncate"
                      style={{ color: "#936bff" }}
                    >
                      {entity.url.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Présence en ligne */}
          {foundHits.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionTitle>Présence en ligne</SectionTitle>
              <div className="flex flex-col gap-2">
                {foundHits.map((hit) => (
                  <SocialRow key={hit.platform} platform={hit.platform} url={hit.profile_url} />
                ))}
              </div>
            </section>
          )}

          {/* Critères détaillés */}
          <section className="flex flex-col gap-4">
            <SectionTitle>Interprétation des critères</SectionTitle>
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ borderColor: "#1e1e1e" }}
            >
              {CRITERIA_DETAILS.map((criterion, i) => {
                const data = pillars[criterion.key] as PillarData | undefined;
                const status = criterion.getStatus(data);
                return (
                  <CriterionRow
                    key={criterion.key}
                    label={criterion.label}
                    statusLabel={status.label}
                    statusColor={status.color}
                    description={status.desc}
                    last={i === CRITERIA_DETAILS.length - 1}
                  >
                    {criterion.key === "reputation" && data?.available !== false && (
                      <ReputationDetails data={data} />
                    )}
                  </CriterionRow>
                );
              })}
            </div>
          </section>

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

function SocialRow({ platform, url }: { platform: string; url: string | null }) {
  const platformLabel = platform.toLowerCase().includes("instagram")
    ? "Instagram"
    : platform.toLowerCase().includes("tiktok")
      ? "TikTok"
      : platform.toLowerCase().includes("youtube")
        ? "YouTube"
        : platform.toLowerCase().includes("x")
          ? "X (Twitter)"
          : platform;

  return (
    <div
      className="flex items-center justify-between h-12 rounded-xl px-4 border transition-colors hover:border-[#2a2a2a]"
      style={{ background: "#141414", borderColor: "#1e1e1e" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="size-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "#1e1e1e" }}
        >
          <SocialIcon platform={platform} />
        </div>
        <span className="text-sm font-medium" style={{ color: "#6a6a6a" }}>
          {platformLabel}
        </span>
      </div>
      {url && (
        <a
          href={url}
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

function CriterionRow({
  label,
  statusLabel,
  statusColor,
  description,
  last,
  children,
}: {
  label: string;
  statusLabel: string;
  statusColor: string;
  description: string;
  last: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col px-5 py-4 ${!last ? "border-b" : ""}`}
      style={{ background: "#141414", borderColor: "#1e1e1e" }}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-sm font-medium" style={{ color: "#8a8a8a" }}>{label}</span>
          <span className="text-xs leading-relaxed" style={{ color: "#4a4a4a" }}>{description}</span>
        </div>
        <span
          className="text-xs font-semibold shrink-0 mt-0.5 px-2.5 py-1 rounded-full"
          style={{ color: statusColor, background: `${statusColor}14` }}
        >
          {statusLabel}
        </span>
      </div>
      {children}
    </div>
  );
}

const IMPACT_META: Record<string, { label: string; color: string }> = {
  harmful: { label: "Défavorable", color: "#f84b5f" },
  neutral: { label: "Neutre", color: "#6a6a6a" },
  favorable: { label: "Favorable", color: "#0cdda5" },
};

function ReputationDetails({ data }: { data: PillarData | undefined }) {
  type Article = { title: string; url: string; impact: string; reason: string };
  type Source = { label: string; url: string };
  const articles = ((data?.articles as Article[]) || []).slice(0, 6);
  const sources = ((data?.sources as Source[]) || []).slice(0, 12);
  const rationale = (data?.score_rationale as string) || "";

  if (articles.length === 0 && sources.length === 0 && !rationale) return null;

  return (
    <div className="flex flex-col gap-4 mt-4 pt-4 border-t" style={{ borderColor: "#1e1e1e" }}>
      {rationale && (
        <p className="text-[11px] leading-relaxed px-3 py-2 rounded-lg" style={{ color: "#8a8a8a", background: "#1a1a1a" }}>
          <span className="font-semibold" style={{ color: "#aaa" }}>Justification du score : </span>
          {rationale}
        </p>
      )}
      {articles.length > 0 && (
        <div className="flex flex-col gap-2">
          {articles.map((a, i) => {
            const meta = IMPACT_META[a.impact] ?? IMPACT_META.neutral;
            return (
              <div key={i} className="border-l-2 pl-3 py-0.5" style={{ borderColor: meta.color }}>
                <div className="flex items-center gap-2 flex-wrap">
                  {a.url ? (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium leading-snug transition-opacity hover:opacity-70"
                      style={{ color: "#cfcfcf" }}
                    >
                      {a.title}
                    </a>
                  ) : (
                    <span className="text-xs font-medium leading-snug" style={{ color: "#cfcfcf" }}>
                      {a.title}
                    </span>
                  )}
                  <span
                    className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ color: meta.color, background: `${meta.color}14` }}
                  >
                    {meta.label}
                  </span>
                </div>
                {a.reason && (
                  <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: "#5a5a5a" }}>
                    {a.reason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {sources.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "#3a3a3a" }}>
            Sources analysées ({sources.length})
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] underline decoration-dotted underline-offset-2 transition-colors hover:opacity-70"
                style={{ color: "#6a6a6a" }}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
