"use client";

import { PillarCard } from "./PillarCard";
import { ScoreHeader } from "./ScoreHeader";
import { CompliancePillar } from "./pillars/CompliancePillar";
import { LegalPillar } from "./pillars/LegalPillar";
import { OsintPillar } from "./pillars/OsintPillar";
import { SocialPresencePillar } from "./pillars/SocialPresencePillar";
import { YoutubePillar } from "./pillars/YoutubePillar";
import type { AuditResponse, PillarData } from "./types";

type Props = { results: AuditResponse };

type SubSignal = {
  key: string;
  title: string;
  subtitle: string;
  render: (d: PillarData) => React.ReactNode;
};

type Criterion = {
  number: string;
  title: string;
  subtitle: string;
  weight: number;
  primaryKey: string;
  primaryRender: (d: PillarData) => React.ReactNode;
  fallbackMessage: string;
  subSignals?: SubSignal[];
};

const CRITERIA: Criterion[] = [
  {
    number: "1",
    title: "Identité légale vérifiable",
    subtitle: "Annuaire des Entreprises — data.gouv.fr · 40 pts",
    weight: 40,
    primaryKey: "legal_identity",
    primaryRender: (d) => <LegalPillar data={d} />,
    fallbackMessage:
      "Aucun nom d'entreprise ni SIREN fourni — l'annuaire des entreprises ne peut pas être interrogé à partir d'une URL seule.",
  },
  {
    number: "2",
    title: "Conformité AMF/ACPR",
    subtitle: "Liste noire ABE Infoservice · 35 pts",
    weight: 35,
    primaryKey: "compliance",
    primaryRender: (d) => <CompliancePillar data={d} />,
    fallbackMessage: "Fournis une URL ou un nom d'entité pour vérifier la liste noire AMF.",
  },
  {
    number: "3",
    title: "Réputation publique & signaux externes",
    subtitle: "OSINT (presse, signalements) · cohérence YouTube · 25 pts",
    weight: 25,
    primaryKey: "osint",
    primaryRender: (d) => <OsintPillar data={d} />,
    fallbackMessage:
      "Aucun nom d'entité fourni — la recherche de signaux publics nécessite un nom ou un @handle.",
    subSignals: [
      {
        key: "youtube",
        title: "Cohérence YouTube",
        subtitle: "YouTube Data API v3",
        render: (d) => <YoutubePillar data={d} />,
      },
    ],
  },
];

function isAvailable(data: PillarData | undefined): boolean {
  return !!data && data.available !== false && !data.warning;
}

export function AuditDashboard({ results }: Props) {
  const { global_score, verdict, pillars, entity, disclaimer } = results;

  const missingCount = CRITERIA.filter((c) => !isAvailable(pillars[c.primaryKey])).length;
  const partialScore = missingCount > 0;
  const socialPresence = pillars["social_presence"];

  return (
    <section className="w-full mt-16 flex flex-col gap-2">
      <ScoreHeader score={global_score} verdict={verdict} entity={entity} />

      {isAvailable(socialPresence) && (
        <div className="mt-6 py-6 border-b border-[var(--color-line)]">
          <div className="flex flex-col gap-1 mb-3">
            <h3 className="text-sm font-medium text-[var(--color-fg)] tracking-tight">
              Carte d'identité — Présence en ligne
            </h3>
            <p className="text-[11px] text-[var(--color-fg-subtle)]">
              Recherche Google avec opérateur <span className="num">site:</span> · informationnel,
              hors score
            </p>
          </div>
          <SocialPresencePillar data={socialPresence!} />
        </div>
      )}

      {partialScore && (
        <div className="mt-4 border-l-2 border-[var(--color-warn)] pl-4 py-2 text-xs text-[var(--color-fg-subtle)]">
          Score partiel — {missingCount} critère{missingCount > 1 ? "s" : ""} non
          calculable{missingCount > 1 ? "s" : ""} avec les inputs fournis.
          Ajoute un SIREN, une URL ou une chaîne YouTube pour fiabiliser le résultat.
        </div>
      )}

      <div className="divide-y divide-[var(--color-line)]">
        {CRITERIA.map((c) => (
          <div key={c.primaryKey}>
            <PillarCard
              number={c.number}
              title={c.title}
              subtitle={c.subtitle}
              data={pillars[c.primaryKey]}
              render={c.primaryRender}
              fallbackMessage={c.fallbackMessage}
            />
            {c.subSignals && c.subSignals.some((s) => isAvailable(pillars[s.key])) && (
              <div className="ml-12 mb-6 pl-4 border-l border-[var(--color-line)] flex flex-col gap-4">
                {c.subSignals.map((s) =>
                  isAvailable(pillars[s.key]) ? (
                    <div key={s.key} className="flex flex-col gap-1">
                      <h4 className="text-xs font-medium text-[var(--color-fg-subtle)] tracking-tight">
                        {s.title}
                        <span className="text-[10px] text-[var(--color-fg-faint)] ml-2">
                          {s.subtitle}
                        </span>
                      </h4>
                      {s.render(pillars[s.key]!)}
                    </div>
                  ) : null,
                )}
              </div>
            )}
          </div>
        ))}

      </div>

      <p className="text-[11px] text-[var(--color-fg-faint)] leading-relaxed border-t border-[var(--color-line)] pt-6 mt-2 max-w-[60ch]">
        {disclaimer}
      </p>
    </section>
  );
}
