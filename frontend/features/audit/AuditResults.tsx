"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuditResponse, AuditTrailEntry, DomainIntelligence, PillarData, ScoreAlert, ScoreBreakdownRow, Timeline } from "./types";
import { generateAuditPdf } from "./generatePdf";
import { VERDICT, scoreColor, verdictWash } from "@/shared/ui/verdict";
import { AuditNavbar } from "@/features/audit/AuditNavbar";

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

  const { global_score, entity, pillars, disclaimer, score_breakdown, audit_trail, timeline, alerts, domain_intelligence } = results;
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
      onDownload={handleDownloadPdf}
      pdfBusy={pdfBusy}
    />
  );

  // Index de révélation : chaque section entre en décalé (.ld-reveal).
  let step = 0;
  const reveal = () => ({ "--reveal-delay": `${step++ * 70}ms` } as React.CSSProperties);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--ld-bg)]">
      {/* Navbar partagée — bouton retour à gauche, logo, bascule de thème.
          center : badge de score épinglé au scroll (mobile, phase B).
          right  : action PDF (mobile ; sur desktop elle vit dans la carte de score). */}
      <AuditNavbar
        onBack={() => router.push("/")}
        center={
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
        }
        right={
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfBusy}
            aria-label="Télécharger l'audit en PDF"
            className="tap-target flex size-[40px] items-center justify-center rounded-[12px] bg-[#e7e7e7] text-[#101010] transition-transform active:scale-95 disabled:opacity-50 md:hidden"
          >
            <MoreIcon />
          </button>
        }
      />

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
                ringColor={scoreColor(global_score)}
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

          {/* Colonne droite (desktop) — carte de score + barème, sticky.
              Le barème par critère (caché en mobile dans la colonne principale)
              vit ici sur desktop pour ne pas disparaître. */}
          <aside className="ld-reveal hidden md:sticky md:top-[92px] md:flex md:flex-col md:gap-[24px]">
            {scoreCard}
            <SectionCard title="Score global" icon={<PieIcon />}>
              <ScoreBreakdown rows={score_breakdown} />
            </SectionCard>
          </aside>
        </div>
      </main>

      {/* Footer violet */}
      <footer className="w-full bg-[#936bff] px-[16px] py-[64px] md:px-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-[24px]">
          <nav className="flex items-center gap-[24px]">
            {[{ label: "Accueil", href: "/" }, { label: "Mentions légales", href: "/mentions-legales" }].map((l) => (
              <a key={l.label} href={l.href} className="font-['Inter',var(--font-landing-body)] text-[16px] leading-[24px] text-[#eee] transition-colors hover:text-white">
                {l.label}
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
  onDownload,
  pdfBusy,
}: {
  score: number;
  animScore: number;
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
 * Anneau de score — frange colorée par le verdict (rouge < 40, orange < 70,
 * vert ≥ 70) sur 180px, centre 150px. La couleur de l'anneau ET du chiffre
 * suivent le score : un faible score est rouge, pas vert.
 * `onSurface` adapte le centre au fond clair (--ld) plutôt qu'au violet.
 */
function ScoreRing({ score, onSurface }: { score: number; onSurface?: boolean }) {
  const r = 82;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const track = onSurface ? "var(--ld-border-solid)" : "rgba(255,255,255,0.35)";
  // Couleur du verdict, dérivée du score (cf. seuils du barème).
  const ringColor = scoreColor(score);

  return (
    <div className="relative size-[180px] shrink-0" role="img" aria-label={`Score de crédibilité : ${score}%`}>
      <svg width="180" height="180" viewBox="0 0 180 180" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="90" cy="90" r={r} fill="none" stroke={track} strokeWidth="12" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-[15px] flex items-center justify-center rounded-full border-[3px] border-[var(--ld-border-solid)] bg-[var(--ld-surface-alt)]">
        {/* Score en mono tabulaire (Geist Mono) — marqueur du fait mesuré, cf. DESIGN.md.
            Couleur = celle de l'anneau qui l'entoure. */}
        <span
          className="font-[family-name:var(--font-mono)] text-[48px] font-medium leading-none tabular-nums tracking-[-0.03em]"
          style={{ color: ringColor }}
        >
          {score}<span className="text-[28px]">%</span>
        </span>
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
  const ringColor = scoreColor(score);
  return (
    <div className="relative size-[48px] shrink-0" role="img" aria-label={`Score : ${score}%`}>
      <svg width="48" height="48" viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={ringColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
      </svg>
      <div className="absolute inset-[5px] flex items-center justify-center rounded-full bg-[#f6f6f6]">
        <span className="font-[family-name:var(--font-mono)] text-[13px] font-semibold leading-none tabular-nums tracking-[-0.02em]" style={{ color: ringColor }}>{score}%</span>
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
  ringColor,
}: {
  name: string;
  photo: string | null;
  identity: Record<string, unknown> | null | undefined;
  entity: AuditResponse["entity"];
  ringColor: string;
}) {
  // Grille de détails sous le Nom : 3 colonnes desktop (Statut/Siren/Activité,
  // puis Date de création/Siret/Dirigeant), 1 colonne mobile. Cf. maquette Figma.
  const cells: { label: string; value: string }[] = [];
  if (identity) {
    if (identity.forme_juridique) cells.push({ label: "Statut", value: String(identity.forme_juridique) });
    if (entity.siren || identity.siren) cells.push({ label: "Siren", value: String(entity.siren ?? identity.siren) });
    if (identity.activite) cells.push({ label: "Activité", value: String(identity.activite) });
    if (identity.date_creation) cells.push({ label: "Date de création", value: formatFrDate(String(identity.date_creation)) });
    if (identity.siret) cells.push({ label: "Siret", value: String(identity.siret) });
    if (identity.dirigeant) cells.push({ label: "Dirigeant", value: String(identity.dirigeant) });
  }

  return (
    <div className="flex flex-col gap-[16px] p-[16px] md:p-[24px]">
      <div className="flex flex-col items-start gap-[24px] sm:flex-row sm:items-center sm:gap-[32px] md:gap-[40px]">
        {/* Photo cerclée — couleur du verdict (suit le score) */}
        <div className="flex shrink-0 items-center rounded-full border-4 p-[10px]" style={{ borderColor: ringColor }}>
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
        {/* Nom + grille de détails à droite de la photo */}
        <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
          <InfoCell label="Nom" value={name} strong />
          {cells.length > 0 && (
            <div className="grid grid-cols-1 gap-x-[32px] gap-y-[16px] sm:grid-cols-2 lg:grid-cols-3">
              {cells.map((c) => (
                <InfoCell key={c.label} label={c.label} value={c.value} />
              ))}
            </div>
          )}
        </div>
      </div>
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
        {hasFullDiscIcon(hit.platform) ? (
          // Logo officiel à disque complet (Instagram, TikTok) : pas de pastille.
          <div className="size-9 shrink-0 overflow-hidden rounded-full">
            <SocialIcon platform={hit.platform} />
          </div>
        ) : (
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: verdictWash(platformColor(hit.platform)) }}
          >
            <SocialIcon platform={hit.platform} />
          </div>
        )}
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

/** Plateformes dont l'icône est un disque complet (fond + bord intégrés) :
 *  elle remplit la pastille sans fond teinté par-dessus. */
function hasFullDiscIcon(platform: string): boolean {
  const p = platform.toLowerCase();
  return p.includes("instagram") || p.includes("tiktok") || p.includes("youtube") || p.includes("x") || p.includes("twitter");
}

/** Couleur de marque par plateforme — teinte le pastille et le glyphe (cf. Figma). */
function platformColor(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return "#e1306c";
  if (p.includes("tiktok")) return "#010101";
  if (p.includes("youtube")) return "#f00000";
  if (p.includes("x") || p.includes("twitter")) return "#010101";
  return "var(--ld-text)";
}

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return (
    <svg viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="size-full">
      <rect x="0.5" y="0.5" width="32" height="32" rx="16" fill="url(#ig_grad)" />
      <path d="M13.14 8.5H19.86C22.42 8.5 24.5 10.58 24.5 13.14V19.86C24.5 21.0906 24.0111 22.2708 23.141 23.141C22.2708 24.0111 21.0906 24.5 19.86 24.5H13.14C10.58 24.5 8.5 22.42 8.5 19.86V13.14C8.5 11.9094 8.98886 10.7292 9.85902 9.85902C10.7292 8.98886 11.9094 8.5 13.14 8.5ZM12.98 10.1C12.2162 10.1 11.4836 10.4034 10.9435 10.9435C10.4034 11.4836 10.1 12.2162 10.1 12.98V20.02C10.1 21.612 11.388 22.9 12.98 22.9H20.02C20.7838 22.9 21.5164 22.5966 22.0565 22.0565C22.5966 21.5164 22.9 20.7838 22.9 20.02V12.98C22.9 11.388 21.612 10.1 20.02 10.1H12.98ZM20.7 11.3C20.9652 11.3 21.2196 11.4054 21.4071 11.5929C21.5946 11.7804 21.7 12.0348 21.7 12.3C21.7 12.5652 21.5946 12.8196 21.4071 13.0071C21.2196 13.1946 20.9652 13.3 20.7 13.3C20.4348 13.3 20.1804 13.1946 19.9929 13.0071C19.8054 12.8196 19.7 12.5652 19.7 12.3C19.7 12.0348 19.8054 11.7804 19.9929 11.5929C20.1804 11.4054 20.4348 11.3 20.7 11.3ZM16.5 12.5C17.5609 12.5 18.5783 12.9214 19.3284 13.6716C20.0786 14.4217 20.5 15.4391 20.5 16.5C20.5 17.5609 20.0786 18.5783 19.3284 19.3284C18.5783 20.0786 17.5609 20.5 16.5 20.5C15.4391 20.5 14.4217 20.0786 13.6716 19.3284C12.9214 18.5783 12.5 17.5609 12.5 16.5C12.5 15.4391 12.9214 14.4217 13.6716 13.6716C14.4217 12.9214 15.4391 12.5 16.5 12.5ZM16.5 14.1C15.8635 14.1 15.253 14.3529 14.8029 14.8029C14.3529 15.253 14.1 15.8635 14.1 16.5C14.1 17.1365 14.3529 17.747 14.8029 18.1971C15.253 18.6471 15.8635 18.9 16.5 18.9C17.1365 18.9 17.747 18.6471 18.1971 18.1971C18.6471 17.747 18.9 17.1365 18.9 16.5C18.9 15.8635 18.6471 15.253 18.1971 14.8029C17.747 14.3529 17.1365 14.1 16.5 14.1Z" fill="#F6F6F6" />
      <defs>
        <linearGradient id="ig_grad" x1="0.5" y1="32.5" x2="32.5" y2="0.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC100" />
          <stop offset="0.35" stopColor="#FF0041" />
          <stop offset="0.65" stopColor="#FF00B0" />
          <stop offset="1" stopColor="#8C2EF5" />
        </linearGradient>
      </defs>
    </svg>
  );
  if (p.includes("tiktok")) return (
    <svg viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="size-full">
      <rect x="0.5" y="0.5" width="32" height="32" rx="16" fill="black" />
      <path d="M22.8996 13.9018V16.286C22.4831 16.2453 21.9418 16.1506 21.3431 15.9312C20.5612 15.6446 19.9793 15.2527 19.5981 14.9492V19.768L19.5884 19.753C19.5946 19.8485 19.5981 19.9458 19.5981 20.044C19.5981 22.4371 17.6515 24.3851 15.2583 24.3851C12.8651 24.3851 10.9185 22.4371 10.9185 20.044C10.9185 17.651 12.8651 15.7021 15.2583 15.7021C15.4927 15.7021 15.7226 15.7207 15.9473 15.7569V18.1066C15.7315 18.0296 15.4998 17.9881 15.2583 17.9881C14.1254 17.9881 13.2029 18.9099 13.2029 20.044C13.2029 21.1782 14.1254 22.1 15.2583 22.1C16.3912 22.1 17.3137 21.1773 17.3137 20.044C17.3137 20.0016 17.3128 19.9591 17.3101 19.9167V10.5524H19.6919C19.7007 10.7541 19.7087 10.9576 19.7175 11.1593C19.7334 11.5565 19.8749 11.9378 20.1217 12.2501C20.4109 12.6172 20.838 13.0437 21.4377 13.3842C21.9993 13.7027 22.5264 13.839 22.8996 13.9035V13.9018Z" fill="#FF004F" />
      <path d="M22.0807 11.9661V14.3503C21.6641 14.3096 21.1229 14.2149 20.5241 13.9956C19.7423 13.7089 19.1604 13.317 18.7792 13.0136V17.8324L18.7695 17.8173C18.7757 17.9129 18.7792 18.0102 18.7792 18.1084C18.7792 20.5014 16.8326 22.4495 14.4394 22.4495C12.0462 22.4495 10.0996 20.5014 10.0996 18.1084C10.0996 15.7154 12.0462 13.7664 14.4394 13.7664C14.6738 13.7664 14.9037 13.785 15.1284 13.8213V16.171C14.9126 16.094 14.6808 16.0524 14.4394 16.0524C13.3065 16.0524 12.384 16.9742 12.384 18.1084C12.384 19.2425 13.3065 20.1644 14.4394 20.1644C15.5723 20.1644 16.4948 19.2416 16.4948 18.1084C16.4948 18.0659 16.4939 18.0235 16.4912 17.981V8.61499H18.8729C18.8818 8.81669 18.8898 9.02017 18.8986 9.22187C18.9145 9.61909 19.056 10.0004 19.3028 10.3127C19.592 10.6798 20.0191 11.1062 20.6188 11.4468C21.1804 11.7644 21.7075 11.9015 22.0807 11.9661Z" fill="#00F7EF" />
      <path d="M22.6016 13.0083V15.3925C22.1851 15.3518 21.6438 15.2571 21.0451 15.0377C20.2632 14.7511 19.6813 14.3592 19.3001 14.0557V18.8745L19.2904 18.8595C19.2966 18.955 19.3001 19.0523 19.3001 19.1505C19.3001 21.5436 17.3535 23.4916 14.9603 23.4916C12.5671 23.4916 10.6205 21.5436 10.6205 19.1505C10.6205 16.7575 12.5671 14.8086 14.9603 14.8086C15.1947 14.8086 15.4246 14.8271 15.6493 14.8634V17.2131C15.4335 17.1361 15.2018 17.0946 14.9603 17.0946C13.8274 17.0946 12.905 18.0164 12.905 19.1505C12.905 20.2847 13.8274 21.2065 14.9603 21.2065C16.0932 21.2065 17.0157 20.2838 17.0157 19.1505C17.0157 19.1081 17.0148 19.0656 17.0121 19.0231V9.65891H19.3939C19.4027 9.86061 19.4107 10.0641 19.4195 10.2658C19.4354 10.663 19.5769 11.0443 19.8237 11.3566C20.1129 11.7237 20.5401 12.1501 21.1397 12.4907C21.7013 12.8083 22.2284 12.9455 22.6016 13.01V13.0083Z" fill="#DCDCDC" />
    </svg>
  );
  if (p.includes("youtube")) return (
    <svg viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="size-full">
      <rect x="0.5" y="0.5" width="32" height="32" rx="16" fill="#FF0209" />
      <path fillRule="evenodd" clipRule="evenodd" d="M20.683 22.0803C21.048 22.0812 21.4289 22.0741 21.8009 22.0338C22.5327 21.9539 23.2312 21.7441 23.7016 21.2017C24.1763 20.6548 24.2974 19.8929 24.3702 19.1723C24.5457 17.4247 24.5431 15.6587 24.3632 13.9111C24.2658 12.9622 24.0543 11.9133 23.276 11.3621C22.6731 10.9346 21.8799 10.9197 21.141 10.9197C19.9599 10.921 18.7784 10.9218 17.597 10.9229C17.2143 10.9233 16.8317 10.9236 16.4491 10.9241C15.7107 10.9249 14.9724 10.9256 14.2341 10.9262C13.4684 10.9269 12.7027 10.9276 11.937 10.9285C11.853 10.9286 11.7692 10.9278 11.6859 10.927C11.1458 10.9221 10.6199 10.9174 10.1145 11.1523C9.61252 11.3858 9.22029 11.8299 8.98512 12.3241C8.65782 13.0122 8.5885 13.7908 8.54901 14.5509C8.47704 15.9352 8.48407 17.3229 8.57183 18.7062C8.635 19.7156 8.79734 20.8313 9.57742 21.4746C10.2698 22.0443 11.2455 22.0733 12.1415 22.0733C14.988 22.075 17.8355 22.0777 20.683 22.0803ZM19.0464 16.5013L14.8029 14.0506V18.952L19.0464 16.5013Z" fill="#F6F6F6" />
    </svg>
  );
  if (p.includes("x") || p.includes("twitter")) return (
    <svg viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="size-full">
      <circle cx="16.5" cy="16.5" r="16.5" fill="black" />
      <path d="M22.0113 7.5H24.9237L18.5292 14.7809L26 24.6576H20.1373L15.5472 18.6556L10.2922 24.6576H7.37987L14.1543 16.8702L7 7.5H13.0083L17.1553 12.9828L22.0113 7.5ZM20.992 22.9482H22.6065L12.1599 9.14612H10.4252L20.992 22.9482Z" fill="white" />
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

