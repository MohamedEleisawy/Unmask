"use client";

import { PillarCard } from "./PillarCard";
import { ScoreHeader } from "./ScoreHeader";
import { CompliancePillar } from "./pillars/CompliancePillar";
import { DiscoursePillar } from "./pillars/DiscoursePillar";
import { LegalPillar } from "./pillars/LegalPillar";
import { OsintPillar } from "./pillars/OsintPillar";
import { PartnershipPillar } from "./pillars/PartnershipPillar";
import { YoutubePillar } from "./pillars/YoutubePillar";
import type { AuditResponse, PillarData } from "./types";

type Props = { results: AuditResponse };

type PillarDef = {
  number: string;
  title: string;
  subtitle: string;
  key: string;
  render: (data: PillarData) => React.ReactNode;
};

const PILLARS: PillarDef[] = [
  {
    number: "1", key: "legal_identity",
    title: "Identité légale",
    subtitle: "Annuaire des Entreprises — data.gouv.fr",
    render: (d) => <LegalPillar data={d} />,
  },
  {
    number: "2", key: "partnerships",
    title: "Transparence partenariats",
    subtitle: "Loi n°2023-451 du 9 juin 2023",
    render: (d) => <PartnershipPillar data={d} />,
  },
  {
    number: "3", key: "discourse",
    title: "Analyse du discours",
    subtitle: "Détection de manipulation rhétorique",
    render: (d) => <DiscoursePillar data={d} />,
  },
  {
    number: "4", key: "youtube",
    title: "Cohérence d'engagement",
    subtitle: "YouTube Data API v3",
    render: (d) => <YoutubePillar data={d} />,
  },
  {
    number: "5", key: "osint",
    title: "Réputation externe",
    subtitle: "Presse, signalements, OSINT",
    render: (d) => <OsintPillar data={d} />,
  },
  {
    number: "6", key: "compliance",
    title: "Conformité AMF/ACPR",
    subtitle: "Liste noire ABE Infoservice",
    render: (d) => <CompliancePillar data={d} />,
  },
];

export function AuditDashboard({ results }: Props) {
  const { global_score, verdict, pillars, entity, disclaimer } = results;

  return (
    <section className="w-full mt-16 flex flex-col gap-2">
      <ScoreHeader score={global_score} verdict={verdict} entity={entity} />

      <div className="divide-y divide-[var(--color-line)]">
        {PILLARS.map((p) => (
          <PillarCard
            key={p.key}
            number={p.number}
            title={p.title}
            subtitle={p.subtitle}
            data={pillars[p.key]}
            render={p.render}
          />
        ))}
      </div>

      <p className="text-[11px] text-[var(--color-fg-faint)] leading-relaxed border-t border-[var(--color-line)] pt-6 mt-2 max-w-[60ch]">
        {disclaimer}
      </p>
    </section>
  );
}
