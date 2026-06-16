"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

/**
 * Rapport d'audit — implémentation des maquettes Figma (mobile 963:3563/3623,
 * desktop 963:4020). Thème clair --ld, héros violet plein largeur avec l'anneau
 * de score, contenu en cartes (--ld-surface-alt) sur une colonne mobile / deux
 * colonnes desktop (contenu à gauche, carte de score sticky à droite).
 *
 * Les deux écrans Figma sont deux états du même rapport : l'arrivée (héros +
 * score centré) puis le déroulé. La transition est l'entrée séquencée des
 * sections au montage (.ld-reveal), neutralisée si prefers-reduced-motion.
 *
 * Aucun bloc existant n'a été retiré : alerte critique, conformité AMF/ACPR,
 * âge de domaine RDAP, couverture et export PDF sont conservés et restylés.
 */
export function AuditResults({ results }: Props) {
  const router = useRouter();
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

  // --- Animation du score (phase A) : remplissage 0→score + compteur. ---
  // Démarre à 0 puis monte une fois (au montage). Respecte reduced-motion :
  // dans ce cas on affiche directement le score final, sans interpolation.
  const [animScore, setAnimScore] = useState(0);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (reduce) { setAnimScore(global_score); return; }
    let raf = 0;
    const duration = 900;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out (décélération exponentielle, cf. DESIGN.md)
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimScore(Math.round(global_score * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [global_score]);

  // --- Compactage au scroll (phase B, mobile) : bascule au seuil. ---
  // Une sentinelle placée en bas du héros : tant qu'elle est visible, le gros
  // anneau est dans le viewport ; dès qu'elle sort par le haut, on épingle le
  // badge de score dans la navbar (fondu + scale).
  const heroSentinel = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const el = heroSentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setPinned(!entry.isIntersecting),
      { rootMargin: "-68px 0px 0px 0px" }, // hauteur de la navbar sticky
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  // Carte « Résultat de l'audit » — partagée hero mobile / colonne droite desktop.
  const scoreCard = (
    <ScoreResultCard
      score={global_score}
      animScore={animScore}
      coverage={coverage}
      onDownload={handleDownloadPdf}
      pdfBusy={pdfBusy}
    />
  );

  // Index de révélation : chaque section entre en décalé (.ld-reveal).
  let step = 0;
  const reveal = () => ({ "--reveal-delay": `${step++ * 70}ms` } as React.CSSProperties);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--ld-bg)]">
      {/* Navbar violette — chevron retour + logo (Figma node 963:3564 / desktop). */}
      <header className="sticky top-0 z-[var(--z-sticky)] w-full bg-[#936bff]">
        <div className="mx-auto flex h-[68px] w-full max-w-[1200px] items-center justify-between px-[24px] md:px-10">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Revenir à l'accueil"
            className="tap-target flex size-[40px] items-center justify-center rounded-[12px] bg-[#e7e7e7] text-[#101010] transition-transform active:scale-95"
          >
            <ChevronLeftIcon />
          </button>
          {/* Centre : logo (desktop) ; badge de score épinglé au scroll (mobile,
              phase B). Le badge bascule en visible une fois le héros sorti. */}
          <div className="hidden md:block">
            <UnmaskLogo />
          </div>
          <div
            className="md:hidden"
            style={{
              opacity: pinned ? 1 : 0,
              transform: pinned ? "scale(1)" : "scale(0.6)",
              transition: "opacity var(--animate-duration-state) var(--ease-out), transform var(--animate-duration-state) var(--ease-out)",
              pointerEvents: pinned ? "auto" : "none",
            }}
            aria-hidden={!pinned}
          >
            <ScoreBadge score={animScore} />
          </div>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfBusy}
            aria-label="Télécharger l'audit en PDF"
            className="tap-target flex size-[40px] items-center justify-center rounded-[12px] bg-[#e7e7e7] text-[#101010] transition-transform active:scale-95 disabled:opacity-50 md:hidden"
          >
            <MoreIcon />
          </button>
          {/* Desktop : actions à droite déplacées dans la carte de score. */}
          <span className="hidden size-[40px] md:block" aria-hidden="true" />
        </div>
      </header>

      {/* Héros violet — titre + anneau de score (Figma node 963:3608).
          Phase B : quand le score s'épingle dans la navbar, le gros héros
          s'efface (fondu + léger scale) pour éviter le doublon. Sur desktop,
          la carte de score passe en colonne droite sticky. */}
      <section
        className="ld-hero-in w-full bg-[#936bff] md:hidden"
        style={{
          opacity: pinned ? 0 : 1,
          transform: pinned ? "scale(0.97)" : "scale(1)",
          transition: "opacity var(--animate-duration-state) var(--ease-out), transform var(--animate-duration-state) var(--ease-out)",
        }}
      >
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-[32px] px-[40px] pt-[24px] pb-[48px]">
          <div className="flex items-center gap-[8px]">
            <ArrowUpRightIcon className="size-[20px] text-[#eee]" />
            <h1 className="font-landing-body text-[20px] font-bold text-[#eee]">Résultat de l&apos;audit</h1>
          </div>
          <ScoreRing score={animScore} />
          <p className="text-center font-landing-body text-[16px] font-medium leading-snug text-[#eee]">
            Avec les informations disponibles, le profil présente un score de
            crédibilité de {global_score}%.
          </p>
        </div>
      </section>
      {/* Sentinelle de fin de héros — pilote la bascule du badge (mobile). */}
      <div ref={heroSentinel} className="h-px w-full md:hidden" aria-hidden="true" />

      {/* Contenu */}
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-[16px] py-[16px] md:px-10 md:py-10">
        <div className="grid grid-cols-1 items-start gap-[16px] md:grid-cols-[1fr_360px] md:gap-10">

          {/* Colonne principale */}
          <div className="flex flex-col gap-[16px] md:gap-[24px]">

            <div style={reveal()} className="ld-reveal"><AlertBanner alerts={alerts} /></div>

            {/* Profil — entreprise + photo (Figma node 963:3570) */}
            <SectionCard title="Profil" icon={<UserCircleIcon />} style={reveal()}>
              <ProfileBlock
                name={realName || entityName}
                photo={photo}
                identity={legalFound ? identity : null}
                entity={entity}
              />
            </SectionCard>

            {/* Présence en ligne (Figma node Présence) */}
            <SectionCard title="Présence en ligne" icon={<GlobeIcon />} style={reveal()}>
              {foundHits.length > 0 ? (
                <div className="flex flex-col">
                  {foundHits.map((hit, i) => (
                    <SocialRow key={hit.platform} hit={hit} last={i === foundHits.length - 1} />
                  ))}
                </div>
              ) : (
                <EmptyNote>Aucun compte officiel n&apos;a pu être confirmé sur les plateformes analysées.</EmptyNote>
              )}
              {missingHits.length > 0 && (
                <p className="px-[8px] pt-[8px] font-landing-body text-[12px] text-[var(--ld-label)]">
                  Non détecté : {missingHits.map((m) => platformLabel(m.platform)).join(" · ")}
                </p>
              )}
            </SectionCard>

            {/* Score global — barème par critère (Figma node Score global).
                Sur mobile sous la présence ; conservé pour desktop aussi. */}
            <div className="md:hidden">
              <SectionCard title="Score global" icon={<PieIcon />} style={reveal()}>
                <ScoreBreakdown rows={score_breakdown} />
              </SectionCard>
            </div>

            {/* Réputation publique */}
            <SectionCard title="Réputation publique" icon={<UsersIcon />} style={reveal()}>
              <ReputationSection data={reputationData} />
            </SectionCard>

            {/* Preuves trouvées */}
            <EvidenceSection data={reputationData} style={reveal()} />

            {/* Chronologie */}
            {timeline && timeline.entries.length > 0 && (
              <SectionCard title="Chronologie" icon={<ClockIcon />} style={reveal()}>
                <TimelineView timeline={timeline} />
              </SectionCard>
            )}

            {/* Conformité AMF/ACPR — conservé, restylé (hors maquette visuelle). */}
            <SectionCard title="Conformité" icon={<ShieldIcon />} style={reveal()}>
              <BlacklistCard data={complianceData} />
            </SectionCard>

            {/* Âge du domaine (RDAP) — conservé, restylé. */}
            {domain_intelligence && domain_intelligence.available && (
              <SectionCard title="Nom de domaine" icon={<GlobeIcon />} style={reveal()}>
                <DomainCard data={domain_intelligence} />
              </SectionCard>
            )}

            {/* Sources analysées (Figma node Sources analysées) */}
            <SectionCard title="Sources analysées" icon={<SearchIcon />} style={reveal()}>
              <SourcesAnalyzed trail={audit_trail} hits={allSocialHits} />
            </SectionCard>

            {/* Disclaimer */}
            <p className="px-[8px] font-landing-body text-[12px] leading-relaxed text-[var(--ld-text-faint)]">
              {disclaimer}
            </p>
          </div>

          {/* Colonne droite (desktop) — carte de score sticky. */}
          <aside className="ld-reveal hidden md:sticky md:top-[92px] md:block">
            {scoreCard}
          </aside>
        </div>
      </main>

      {/* Footer violet */}
      <footer className="w-full bg-[#936bff] px-[16px] py-[64px] md:px-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-[24px]">
          <nav className="flex items-center gap-[24px]">
            {["À propos", "Aide", "Contact"].map((l) => (
              <a key={l} href="#" className="font-['Inter',var(--font-landing-body)] text-[16px] leading-[24px] text-[#eee] transition-colors hover:text-white">
                {l}
              </a>
            ))}
          </nav>
          <p className="font-landing-body text-[16px] font-light text-[#eee]">
            © 2026 Unmask. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ---- Coquilles de section (cartes Figma : --ld-surface-alt, r12, p8) ---- */

function SectionCard({
  title,
  icon,
  children,
  style,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section
      style={style}
      className="ld-reveal flex flex-col gap-[8px] rounded-[12px] bg-[var(--ld-surface-alt)] p-[8px]"
    >
      <div className="flex items-center gap-[8px] p-[8px]">
        <span className="text-[var(--ld-text-muted)]" aria-hidden="true">{icon}</span>
        <h2 className="font-landing-body text-[16px] font-medium text-[var(--ld-text-muted)] md:text-[20px]">
          {title}
        </h2>
      </div>
      <div className="h-[2px] w-full rounded-[9px] bg-[var(--ld-border-solid)]" aria-hidden="true" />
      {children}
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="p-[16px] font-landing-body text-[14px] leading-relaxed text-[var(--ld-text-faint)]">
      {children}
    </p>
  );
}

/* ---- Carte « Résultat de l'audit » (héros mobile / colonne droite desktop) ---- */

function ScoreResultCard({
  score,
  animScore,
  coverage,
  onDownload,
  pdfBusy,
}: {
  score: number;
  animScore: number;
  coverage?: Coverage;
  onDownload: () => void;
  pdfBusy: boolean;
}) {
  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col items-center gap-[16px] rounded-[12px] bg-[var(--ld-surface-alt)] p-[24px]">
        <div className="flex items-center gap-[8px]">
          <ArrowUpRightIcon className="size-[18px] text-[var(--ld-text-muted)]" />
          <h2 className="font-landing-body text-[18px] font-bold text-[var(--ld-text)]">Résultat de l&apos;audit</h2>
        </div>
        <ScoreRing score={animScore} onSurface />
        <p className="text-center font-landing-body text-[14px] font-medium leading-snug text-[var(--ld-text-muted)]">
          Avec les informations disponibles, le profil présente un score de
          crédibilité de {score}%.
        </p>
        <CoverageLine coverage={coverage} />
      </div>
      <button
        type="button"
        onClick={onDownload}
        disabled={pdfBusy}
        className="flex h-[44px] items-center justify-center gap-[8px] rounded-[12px] bg-[#936bff] px-[12px] font-landing-body text-[16px] font-bold text-[#eee] transition-all hover:bg-[#7d54f0] active:scale-[0.98] disabled:opacity-50"
      >
        <DownloadIcon />
        {pdfBusy ? "Génération…" : "Télécharger l'audit"}
      </button>
      <button
        type="button"
        onClick={() => {
          if (typeof navigator !== "undefined" && navigator.share) {
            void navigator.share({ title: "Rapport Unmask", url: window.location.href }).catch(() => {});
          } else if (typeof navigator !== "undefined" && navigator.clipboard) {
            void navigator.clipboard.writeText(window.location.href).catch(() => {});
          }
        }}
        className="flex h-[44px] items-center justify-center gap-[8px] rounded-[12px] bg-[var(--ld-surface-alt)] px-[12px] font-landing-body text-[16px] font-medium text-[var(--ld-text)] transition-colors hover:bg-[var(--ld-border-solid)]"
      >
        <LinkIcon />
        Partager l&apos;audit
      </button>
    </div>
  );
}

/**
 * Anneau de score — frange turquoise/grise sur 180px, centre 150px.
 * `onSurface` adapte le centre au fond clair (--ld) plutôt qu'au violet.
 */
function ScoreRing({ score, onSurface }: { score: number; onSurface?: boolean }) {
  const r = 82;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const track = onSurface ? "var(--ld-border-solid)" : "rgba(255,255,255,0.35)";

  return (
    <div className="relative size-[180px] shrink-0" role="img" aria-label={`Score de crédibilité : ${score}%`}>
      <svg width="180" height="180" viewBox="0 0 180 180" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="90" cy="90" r={r} fill="none" stroke={track} strokeWidth="12" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="#0cdda5"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-[15px] flex items-center justify-center rounded-full border-[3px] border-[var(--ld-border-solid)] bg-[var(--ld-surface-alt)]">
        <span className="num font-landing-body text-[48px] font-black leading-none text-[var(--ld-score)]">{score}%</span>
      </div>
    </div>
  );
}

/**
 * Badge de score compact — version réduite de l'anneau, épinglée dans la navbar
 * au scroll (phase B, mobile). Anneau 48px turquoise + % au centre, sur fond
 * clair pour rester lisible sur la barre violette (cf. Image 2/3 de la maquette).
 */
function ScoreBadge({ score }: { score: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative size-[48px] shrink-0" role="img" aria-label={`Score : ${score}%`}>
      <svg width="48" height="48" viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke="#0cdda5" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
      </svg>
      <div className="absolute inset-[5px] flex items-center justify-center rounded-full bg-[#f6f6f6]">
        <span className="num font-landing-body text-[13px] font-black leading-none text-[#0a7a59]">{score}%</span>
      </div>
    </div>
  );
}

/* ---- Profil (NOM / STATUT / dates / SIREN…) — Figma node 963:3570 ---- */

function ProfileBlock({
  name,
  photo,
  identity,
  entity,
}: {
  name: string;
  photo: string | null;
  identity: Record<string, unknown> | null | undefined;
  entity: AuditResponse["entity"];
}) {
  const cells: { label: string; value: string }[] = [];
  if (identity) {
    if (identity.forme_juridique) cells.push({ label: "Statut", value: String(identity.forme_juridique) });
    if (identity.date_creation) cells.push({ label: "Date de création", value: formatFrDate(String(identity.date_creation)) });
    if (entity.siren || identity.siren) cells.push({ label: "Siren", value: String(entity.siren ?? identity.siren) });
    if (identity.activite) cells.push({ label: "Activité", value: String(identity.activite) });
    if (identity.siret) cells.push({ label: "Siret", value: String(identity.siret) });
    if (identity.dirigeant) cells.push({ label: "Dirigeant", value: String(identity.dirigeant) });
  }

  return (
    <div className="flex flex-col gap-[16px] p-[16px] md:p-[24px]">
      <div className="flex items-center gap-[24px] md:gap-[40px]">
        {/* Photo cerclée turquoise */}
        <div className="flex shrink-0 items-center rounded-full border-4 border-[#0cdda5] p-[10px]">
          <div className="flex size-[100px] items-center justify-center overflow-hidden rounded-full border border-[#525252] bg-[var(--ld-bg)]">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={`Photo de ${name}`}
                width={100}
                height={100}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="size-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <UserIcon className="size-[40px] text-[var(--ld-label)]" />
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
          <InfoCell label="Nom" value={name} strong />
          {!!identity?.forme_juridique && <InfoCell label="Statut" value={String(identity.forme_juridique)} />}
          {!!identity?.date_creation && <InfoCell label="Date de création" value={formatFrDate(String(identity.date_creation))} />}
        </div>
      </div>
      {cells.length > 2 && (
        <div className="grid grid-cols-2 gap-x-[26px] gap-y-[16px]">
          {cells.slice(2).map((c) => (
            <InfoCell key={c.label} label={c.label} value={c.value} />
          ))}
        </div>
      )}
      {!identity && (
        <p className="font-landing-body text-[12px] leading-relaxed text-[var(--ld-text-faint)]">
          Aucune entreprise identifiée dans les bases publiques consultées. Ne
          pas posséder de structure déclarée ne retire aucun point au score.
        </p>
      )}
    </div>
  );
}

function InfoCell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="font-landing-body text-[12px] font-medium uppercase text-[var(--ld-label)]">{label}</span>
      <span className={`font-landing-body text-[14px] text-[var(--ld-value)] ${strong ? "font-bold" : "font-medium"} break-words`}>
        {value}
      </span>
    </div>
  );
}

/* ---- Sous-sections (données conservées de l'audit, restylées --ld) ---- */

function AlertBanner({ alerts }: { alerts?: ScoreAlert[] }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="flex flex-col gap-[8px]">
      {alerts.map((a, i) => {
        const critical = a.severity === "critique";
        const color = critical ? VERDICT.bad : VERDICT.warn;       // icône + bordure (décor, vif)
        const inkColor = critical ? "var(--chip-coral)" : "var(--chip-amber)"; // texte, AA sur le wash
        return (
          <div
            key={i}
            className="flex items-start gap-3 rounded-[12px] border p-[16px]"
            style={{ background: verdictWash(color), borderColor: `color-mix(in srgb, ${color} 34%, transparent)` }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
              <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex flex-col gap-1">
              <p className="font-landing-body text-[14px] font-semibold" style={{ color: inkColor }}>{a.message}</p>
              {a.details && a.details.length > 0 && (
                <ul className="flex flex-col gap-0.5">
                  {a.details.map((d, j) => (
                    <li key={j} className="font-landing-body text-[12px] text-[var(--ld-text-muted)]">{d}</li>
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
    <p className="text-center font-landing-body text-[12px] text-[var(--ld-text-faint)]">
      Score basé sur {coverage.evaluated}/{coverage.total} sources ·{" "}
      <span style={{ color }}>confiance {coverage.confidence}</span>
    </p>
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
  return confidence >= 80 ? VERDICT.good : confidence >= 70 ? VERDICT.warn : "var(--ld-text-muted)";
}

function SocialRow({ hit, last }: { hit: SocialHit; last?: boolean }) {
  const label = platformLabel(hit.platform);
  const username = hit.username?.replace(/^@/, "");
  const official = hit.official === true;
  const statusLabel = official ? "officiel" : "probable";
  const statusColor = official ? "var(--chip-violet)" : "var(--chip-amber)";

  return (
    <div className={`flex items-center justify-between gap-3 px-[8px] py-[16px] ${last ? "" : "border-b border-[var(--ld-border-solid)]"}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ld-surface)]">
          <SocialIcon platform={hit.platform} />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="font-landing-body text-[14px] font-medium text-[var(--ld-text)]">{label}</span>
          <span className="flex items-center gap-2 truncate font-landing-body text-[12px] text-[var(--ld-text-faint)]">
            {username && <span className="truncate text-[var(--ld-username)]">@{username}</span>}
            {hit.followers && <span className="shrink-0 text-[var(--ld-text-muted)]">· {hit.followers} abonnés</span>}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-full px-2 py-0.5 font-landing-body text-[11px] font-semibold" style={{ color: statusColor, background: verdictWash(statusColor) }}>
          {statusLabel}
        </span>
        {hit.confidence != null && (
          <span className="w-9 text-right font-landing-body text-[11px] font-medium tabular-nums" style={{ color: confidenceColor(hit.confidence) }}>
            {hit.confidence}%
          </span>
        )}
        {hit.profile_url && (
          <a
            href={hit.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ouvrir le profil ${label}${username ? ` @${username}` : ""} (nouvel onglet)`}
            className="tap-target flex size-8 items-center justify-center rounded-[8px] bg-[var(--ld-surface)] transition-opacity hover:opacity-70 active:scale-95"
          >
            <ArrowUpRightIcon className="size-[14px] text-[var(--ld-text-muted)]" />
          </a>
        )}
      </div>
    </div>
  );
}

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="#936bff" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="#936bff" strokeWidth="1.6" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="#936bff" />
    </svg>
  );
  if (p.includes("tiktok")) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 12a4 4 0 1 0 4 4V4c.333 1.333 1.6 4 4 4" stroke="var(--ld-text)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (p.includes("youtube")) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="4" stroke="#f84b5f" strokeWidth="1.6" />
      <path d="M10 9.5L15 12L10 14.5V9.5Z" fill="#f84b5f" />
    </svg>
  );
  return <span className="font-landing-body text-[13px] font-bold text-[var(--ld-text)]">{platform[0]?.toUpperCase()}</span>;
}

function ScoreBreakdown({ rows }: { rows?: ScoreBreakdownRow[] }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="flex flex-col">
      {rows.map((r, i) => {
        const color = r.available && r.score !== null ? scoreColor(r.score) : "var(--ld-text-faint)";
        return (
          <BreakdownRow key={r.key} row={r} color={color} last={i === rows.length - 1} />
        );
      })}
      <p className="px-[8px] pt-[12px] font-landing-body text-[11px] leading-relaxed text-[var(--ld-text-faint)]">
        Score global = somme des points. Les critères non calculables redistribuent leur poids sur les autres.
      </p>
    </div>
  );
}

function BreakdownRow({ row, color, last }: { row: ScoreBreakdownRow; color: string; last?: boolean }) {
  const [open, setOpen] = useState(false);
  const value = row.available && row.score !== null ? row.score : 0;
  const unavailable = !row.available || row.score === null;
  return (
    <div className={`flex flex-col gap-[8px] px-[8px] py-[12px] ${last ? "" : "border-b border-[var(--ld-border-solid)]"}`}>
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
          <div className="flex items-center gap-1.5">
            <span className="font-landing-body text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--ld-label)]">{row.label}</span>
            <span className="text-[var(--ld-text-faint)]" title={row.reason} aria-hidden="true">
              <HelpIcon />
            </span>
          </div>
          {unavailable ? (
            <span className="flex items-center gap-1.5 font-landing-body text-[14px] font-medium text-[var(--ld-text-muted)]">
              <WarnDotIcon /> {row.reason || "Indisponible"}
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-10 font-landing-body text-[14px] font-bold tabular-nums text-[var(--ld-value)]">{value}%</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--ld-border-solid)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${value}%`, background: color, transition: "width var(--animate-duration-reveal) var(--ease-out)" }}
                />
              </div>
            </div>
          )}
        </div>
        {(row.details?.length || row.reason) && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Masquer le détail" : "Voir le détail"}
            className="tap-target flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--ld-surface)] transition-transform active:scale-95"
          >
            <ChevronDownIcon className={open ? "rotate-180" : ""} />
          </button>
        )}
      </div>
      {open && (
        <div className="flex flex-col gap-1 pl-0.5">
          <p className="font-landing-body text-[12px] leading-snug text-[var(--ld-text-muted)]">{row.reason}</p>
          {row.details && row.details.length > 0 && (
            <ul className="flex flex-wrap gap-x-2 gap-y-0.5">
              {row.details.map((d, i) => (
                <li key={i} className="font-landing-body text-[11px] text-[var(--ld-text-faint)]">{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ReputationSection({ data }: { data?: PillarData }) {
  const available = !!data && data.available !== false;
  if (!available) {
    return (
      <div className="flex items-start gap-2 p-[16px]">
        <WarnDotIcon />
        <p className="font-landing-body text-[14px] leading-relaxed text-[var(--ld-text-muted)]">
          Analyse de réputation indisponible.
          <span className="block text-[var(--ld-text-faint)]">L&apos;absence d&apos;analyse n&apos;est pas considérée comme un signal négatif.</span>
        </p>
      </div>
    );
  }
  const articles = (data?.articles as { impact?: string }[] | undefined) ?? [];
  const fav = articles.filter((a) => a.impact === "favorable").length;
  const neu = articles.filter((a) => a.impact === "neutral").length;
  const harm = articles.filter((a) => a.impact === "harmful").length;
  const summary = (data?.summary as string) || "Aucun article notable détecté.";

  return (
    <div className="flex flex-col gap-[16px] p-[16px]">
      <span className="font-landing-body text-[12px] font-medium uppercase text-[var(--ld-label)]">Articles trouvés :</span>
      <div className="flex flex-wrap gap-2">
        <ImpactChip color="var(--chip-violet)" n={fav} label="favorable" />
        <ImpactChip color="var(--chip-amber)" n={neu} label="mitigé" />
        <ImpactChip color="var(--chip-coral)" n={harm} label="défavorable" />
      </div>
      <p className="font-landing-body text-[14px] leading-relaxed text-[var(--ld-value)]">{summary}</p>
      <p className="font-landing-body text-[14px] leading-relaxed text-[var(--ld-text-muted)]">
        L&apos;absence d&apos;analyse n&apos;est pas considérée comme un signal négatif
      </p>
    </div>
  );
}

function ImpactChip({ color, n, label }: { color: string; n: number; label: string }) {
  return (
    <span className="rounded-full px-2.5 py-1 font-landing-body text-[12px] font-medium" style={{ color, background: verdictWash(color) }}>
      {n} {label}{n > 1 ? "s" : ""}
    </span>
  );
}

const EVENT_LABELS: Record<string, string> = {
  accusation: "Accusation",
  plainte: "Plainte",
  enquete: "Enquête",
  condamnation: "Condamnation",
};

function eventColor(type: string): string {
  if (type === "condamnation") return "var(--chip-coral)";
  if (type === "enquete" || type === "plainte") return "var(--chip-amber)";
  return "var(--ld-text-muted)";
}

type EvidenceArticle = {
  title: string;
  url: string;
  impact: string;
  reason: string;
  event_type?: string;
  year?: number | null;
};

function EvidenceSection({ data, style }: { data?: PillarData; style?: React.CSSProperties }) {
  const available = !!data && data.available !== false;
  const articles = (data?.articles as EvidenceArticle[] | undefined) ?? [];
  if (!available || articles.length === 0) return null;

  return (
    <SectionCard title={`Preuves trouvées (${articles.length})`} icon={<DocIcon />} style={style}>
      <div className="flex flex-col">
        {articles.map((a, i) => (
          <EvidenceRow key={i} article={a} last={i === articles.length - 1} />
        ))}
      </div>
    </SectionCard>
  );
}

function EvidenceRow({ article, last }: { article: EvidenceArticle; last?: boolean }) {
  const [open, setOpen] = useState(false);
  const media = mediaName(article.url);
  return (
    <div className={`flex flex-col gap-[8px] px-[8px] py-[16px] ${last ? "" : "border-b border-[var(--ld-border-solid)]"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {article.event_type && EVENT_LABELS[article.event_type] && (
            <span className="rounded-full px-2 py-0.5 font-landing-body text-[12px] font-semibold" style={{ color: eventColor(article.event_type), background: verdictWash(eventColor(article.event_type)) }}>
              {EVENT_LABELS[article.event_type]}
            </span>
          )}
        </div>
        {article.reason && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Masquer le détail" : "Voir le détail"}
            className="tap-target flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--ld-surface)] transition-transform active:scale-95"
          >
            <ChevronDownIcon className={open ? "rotate-180" : ""} />
          </button>
        )}
      </div>
      {article.url ? (
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="font-landing-body text-[14px] font-bold leading-snug text-[var(--ld-value)] transition-opacity hover:opacity-70">
          {article.title}
        </a>
      ) : (
        <span className="font-landing-body text-[14px] font-bold leading-snug text-[var(--ld-value)]">{article.title}</span>
      )}
      {open && article.reason && (
        <p className="font-landing-body text-[12px] leading-relaxed text-[var(--ld-text-muted)]">{article.reason}</p>
      )}
      <span className="font-landing-body text-[12px] text-[var(--ld-text-faint)]">
        {media || "Source"}{article.year ? ` · ${article.year}` : ""}
      </span>
    </div>
  );
}

function mediaName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function timelineDot(type: string): string {
  if (type === "condamnation") return "#c70017";
  if (type === "enquete" || type === "plainte") return "#f5b454";
  return "var(--ld-text-muted)";
}

function TimelineView({ timeline }: { timeline: Timeline }) {
  return (
    <div className="flex flex-col gap-[16px] p-[16px]">
      <ol className="flex flex-col">
        {timeline.entries.flatMap((y) =>
          y.events.map((e, i) => (
            <li key={`${y.year}-${i}`} className="flex gap-[16px]">
              <div className="flex flex-col items-center">
                <span className="size-[20px] shrink-0 rounded-full border-[3px]" style={{ borderColor: timelineDot(e.type) }} aria-hidden="true" />
                <span className="w-[3px] flex-1 bg-[var(--ld-border-solid)]" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-[6px] pb-[24px]">
                <span className="w-fit rounded-full px-2 py-0.5 font-landing-body text-[12px] font-semibold" style={{ color: eventColor(e.type), background: verdictWash(eventColor(e.type)) }}>
                  {EVENT_LABELS[e.type] ?? e.label}
                </span>
                {e.url ? (
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="font-landing-body text-[14px] text-[var(--ld-value)] transition-opacity hover:opacity-70">{e.title}</a>
                ) : (
                  <span className="font-landing-body text-[14px] text-[var(--ld-value)]">{e.title}</span>
                )}
                <span className="font-landing-body text-[12px] text-[var(--ld-text-faint)]">{y.year}</span>
              </div>
            </li>
          )),
        )}
      </ol>
      {!timeline.has_conviction && (
        <p className="font-landing-body text-[12px] text-[var(--ld-text-faint)]">Aucune condamnation publique trouvée à ce jour.</p>
      )}
    </div>
  );
}

/* ---- Sources analysées — fusion audit_trail + réseaux (Figma) ---- */

function SourcesAnalyzed({ trail, hits }: { trail?: AuditTrailEntry[]; hits: SocialHit[] }) {
  const rows: { label: string; result: string; url?: string | null; tone?: "official" | "probable" }[] = [];
  for (const t of trail ?? []) rows.push({ label: t.source, result: t.result, url: t.evidence_url });
  for (const h of hits.filter((x) => x.found)) {
    rows.push({
      label: platformLabel(h.platform),
      result: h.username ? `@${h.username.replace(/^@/, "")}` : (h.found ? "Trouvé" : ""),
      url: h.profile_url,
      tone: h.official ? "official" : "probable",
    });
  }
  if (rows.length === 0) return <EmptyNote>Aucune source consultée.</EmptyNote>;

  return (
    <div className="flex flex-col">
      {rows.map((r, i) => (
        <div key={`${r.label}-${i}`} className={`flex items-center justify-between gap-3 px-[8px] py-[16px] ${i < rows.length - 1 ? "border-b border-[var(--ld-border-solid)]" : ""}`}>
          <span className="font-landing-body text-[14px] font-medium text-[var(--ld-value)]">{r.label}</span>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-landing-body text-[13px]" style={{ color: r.tone ? "var(--ld-username)" : "var(--ld-text-faint)" }}>{r.result}</span>
            {r.tone && (
              <span className="rounded-full px-2 py-0.5 font-landing-body text-[11px] font-semibold" style={{ color: r.tone === "official" ? "var(--chip-violet)" : "var(--chip-amber)", background: verdictWash(r.tone === "official" ? "var(--chip-violet)" : "var(--chip-amber)") }}>
                {r.tone === "official" ? "officiel" : "probable"}
              </span>
            )}
            {r.url && (
              <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`Ouvrir la source ${r.label} (nouvel onglet)`} className="tap-target flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--ld-surface)] transition-opacity hover:opacity-70">
                <ArrowUpRightIcon className="size-[14px] text-[var(--ld-text-muted)]" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- Conformité AMF/ACPR & domaine (conservés, restylés --ld) ---- */

function BlacklistCard({ data }: { data: PillarData | undefined }) {
  const present = (data?.is_blacklisted as boolean | undefined) === true;
  const color = present ? VERDICT.bad : VERDICT.good;
  return (
    <div className="flex flex-col gap-[12px] p-[16px]">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="font-landing-body text-[14px] font-semibold text-[var(--ld-value)]">Présence liste noire</p>
          <p className="font-landing-body text-[12px] text-[var(--ld-text-faint)]">Bases AMF et ACPR</p>
        </div>
        <span className="rounded-full px-2.5 py-1 font-landing-body text-[12px] font-semibold" style={{ color, background: verdictWash(color) }}>
          {present ? "Présent" : "Non présent"}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {["AMF", "ACPR"].map((l) => (
          <div key={l} className="flex items-center justify-between">
            <span className="font-landing-body text-[12px] text-[var(--ld-text-faint)]">{l}</span>
            <span className="font-landing-body text-[12px] font-medium" style={{ color: present ? VERDICT.bad : VERDICT.good }}>
              {present ? "Présent" : "Non présent"}
            </span>
          </div>
        ))}
      </div>
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
  if (days < 365) return `${Math.round(days / 30)} mois`;
  const y = Math.floor(days / 365);
  const rem = Math.round((days % 365) / 30);
  return rem > 0 ? `${y} an${y > 1 ? "s" : ""} ${rem} mois` : `${y} an${y > 1 ? "s" : ""}`;
}

function DomainCard({ data }: { data: DomainIntelligence }) {
  const meta = (data.risk_level && DOMAIN_RISK_META[data.risk_level]) || { label: "Indéterminé", color: "var(--ld-text-muted)" };
  const recent = data.risk_level === "critical" || data.risk_level === "high";
  return (
    <div className="flex flex-col gap-[12px] p-[16px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <p className="truncate font-landing-body text-[14px] font-semibold text-[var(--ld-value)]">{data.domain}</p>
          <p className="font-landing-body text-[12px] text-[var(--ld-text-faint)]">Âge du domaine (RDAP)</p>
        </div>
        <span className="shrink-0 rounded-full px-2.5 py-1 font-landing-body text-[12px] font-semibold" style={{ color: meta.color, background: verdictWash(meta.color) }}>
          Risque {meta.label}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {data.age_days !== null && <DomainLine label="Ancienneté" value={formatAge(data.age_days)} valueColor={meta.color} />}
        {data.created_at && <DomainLine label="Création" value={formatFrDate(data.created_at)} />}
        {data.registrar && <DomainLine label="Hébergeur" value={data.registrar} />}
      </div>
      {recent && (
        <p className="font-landing-body text-[11px] leading-relaxed text-[var(--ld-text-faint)]">
          Un domaine récent n&apos;est pas une preuve de fraude, mais c&apos;est un signal de prudence. Ce critère n&apos;affecte pas le score.
        </p>
      )}
    </div>
  );
}

function DomainLine({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 font-landing-body text-[12px] text-[var(--ld-text-faint)]">{label}</span>
      <span className="truncate text-right font-landing-body text-[12px] font-medium" style={{ color: valueColor || "var(--ld-text-muted)" }}>{value}</span>
    </div>
  );
}

function formatFrDate(raw: string): string {
  const d = new Date(raw.slice(0, 10));
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/* ---- Icônes inline (currentColor sauf logo) ---- */

function ChevronLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 16L10 12L14 8" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ld-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform ${className ?? ""}`}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .8-1 1.7M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarnDotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="#f5b454" strokeWidth="2" />
      <path d="M8 16L16 8" stroke="#f5b454" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UserCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.35 16.11C13.28 14.92 11.73 14.17 10 14.17c-1.73 0-3.28.75-4.35 1.94M10 17.5a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm0-5.83a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
    </svg>
  );
}

function PieIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3v4a1 1 0 0 0 1 1h4M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function UnmaskLogo() {
  return (
    <svg width="80" height="14" viewBox="0 0 66 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Unmask" className="h-[14px] w-[80px]">
      <path d="M10.3809 11.7657V7.18792C10.3809 4.65809 12.489 2.59006 15.059 2.59006C17.6491 2.59006 19.7573 4.65809 19.7573 7.18792V11.7657H17.2877V6.98714C17.2877 5.80254 16.2838 4.81872 15.059 4.81872C13.8343 4.81872 12.8504 5.80254 12.8504 6.98714V11.7657H10.3809ZM27.0997 11.7657V6.7462C27.0997 5.70215 26.1962 4.81872 25.112 4.81872C24.0278 4.81872 23.1443 5.70215 23.1443 6.7462V11.7657H20.6747V6.94698C20.6747 4.5577 22.6625 2.59006 25.112 2.59006C26.2564 2.59006 27.3406 3.03178 28.1839 3.79474L28.3244 3.93529L28.4851 3.79474C29.3083 3.03178 30.3925 2.59006 31.5369 2.59006C33.9864 2.59006 35.9942 4.5577 35.9942 6.94698V11.7657H33.5246V6.7462C33.5246 5.70215 32.6412 4.81872 31.5369 4.81872C30.4527 4.81872 29.5693 5.70215 29.5693 6.7462V11.7657H27.0997Z" fill="#eee"/>
      <path d="M43.8968 9.33626C44.2983 8.9347 44.5594 8.39259 44.6397 7.85049C44.9007 6.14386 43.8365 4.5577 41.9894 4.5577C40.865 4.5577 39.9213 5.18012 39.4997 6.2041C39.2186 6.88675 39.2186 7.77018 39.4997 8.45283C39.7808 9.1154 40.2627 9.63743 40.9453 9.91852C41.5477 10.1595 42.2504 10.1795 42.8728 9.97875C43.2543 9.85829 43.6157 9.63743 43.8968 9.33626ZM47.0691 11.7657H44.6397V11.083L44.2983 11.3039C43.5555 11.7858 42.7523 12.0468 41.8689 12.0468C41.126 12.0669 40.4233 11.9665 39.7607 11.6854C39.1785 11.4444 38.6564 11.1031 38.2147 10.6614C37.3313 9.77797 36.9096 8.5733 36.9096 7.32846C36.9096 5.36082 38.0541 3.71443 39.9013 2.97154C41.1662 2.4696 42.7925 2.4696 44.0373 2.97154C45.9046 3.71443 47.0691 5.36082 47.0691 7.32846V11.7657Z" fill="#fff"/>
      <path d="M9.37641 2.89123V7.46901C9.37641 9.99883 7.26822 12.0669 4.67817 12.0669C2.10819 12.0669 0 9.99883 0 7.46901V2.89123H2.46959V7.66979C2.46959 8.85439 3.45341 9.83821 4.67817 9.83821C5.90292 9.83821 6.90682 8.85439 6.90682 7.66979V2.89123H9.37641Z" fill="#eee"/>
      <path d="M56.2927 6.38776e-06V7.20799L59.7461 2.91131L62.4967 2.89123L58.9429 7.32846L62.4967 11.7657L59.7461 11.7456L57.5776 9.03509L56.2927 10.6212V11.7657H53.8833V6.38776e-06H56.2927Z" fill="#fff"/>
      <path d="M53.8487 8.99166C53.9325 9.195 53.9889 9.40684 54.0796 9.61109L55.0307 4.72241C54.4791 5.19688 53.731 6.69746 52.8372 6.08736C52.0644 5.55984 51.858 4.60245 50.8366 4.31977C50.5347 4.2372 50.2172 4.23086 49.9123 4.30129C49.2255 4.45951 48.6494 5.01671 48.8306 5.75387C49.0637 6.70235 50.1596 6.86797 50.9559 7.00528C51.588 7.11427 52.3547 7.40461 52.871 7.7769C53.3031 8.08233 53.6418 8.50307 53.8487 8.99166Z" fill="#fff"/>
      <path d="M46.7688 6.51376C46.76 6.41836 46.7596 6.28945 46.7598 6.10187L46.7688 6.51376C46.7975 6.82518 46.915 6.77968 47.3863 7.25317C47.9064 7.77555 48.5835 8.08411 49.2806 8.30801C50.1599 8.59042 51.1066 8.50247 51.7003 9.35929C51.8377 9.55746 51.921 9.8236 51.9218 10.0638C51.9253 10.3398 51.8186 10.6057 51.6256 10.8021C51.2989 11.131 50.8386 11.272 50.3864 11.2688C49.9085 11.2654 49.4783 11.1235 49.1391 10.7791C48.6584 10.291 48.5234 9.52517 47.8227 9.27289C47.4744 9.1475 47.118 9.0913 46.8319 9.38995L46.7688 6.51376Z" fill="#fff"/>
      <circle cx="64.087" cy="10.9164" r="1.13043" fill="#eee"/>
    </svg>
  );
}
