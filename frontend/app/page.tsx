"use client";

import { useState } from "react";
import { AuditDashboard } from "@/features/audit/AuditDashboard";
import { AuditForm } from "@/features/audit/AuditForm";
import type { AuditResponse } from "@/features/audit/types";
import { ManualAnalysis } from "@/features/manual-analysis/ManualAnalysis";

type Mode = "audit" | "manual";

export default function Home() {
  const [results, setResults] = useState<AuditResponse | null>(null);
  const [mode, setMode] = useState<Mode>("audit");

  return (
    <main className="min-h-[100dvh] w-full max-w-[1100px] mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col">
      <Header mode={mode} onModeChange={(m) => { setMode(m); setResults(null); }} />

      <div className="mt-16 md:mt-24">
        {mode === "audit" ? (
          <>
            <AuditForm onResults={setResults} onReset={() => setResults(null)} />
            {results && <AuditDashboard results={results} />}
          </>
        ) : (
          <ManualAnalysis />
        )}
      </div>

      <Footer />
    </main>
  );
}

function Header({ mode, onModeChange }: { mode: Mode; onModeChange: (m: Mode) => void }) {
  return (
    <header className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start md:items-end pb-6 border-b border-[var(--color-line)]">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-medium tracking-tighter text-[var(--color-fg)]">
            Unmask
          </span>
          <span className="num text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)]">
            v2.0
          </span>
        </div>
        <p className="text-xs text-[var(--color-fg-subtle)] max-w-[44ch] leading-relaxed">
          Audit de crédibilité factuel — identité légale, conformité AMF/ACPR,
          analyse de discours, engagement, réputation publique.
        </p>
      </div>

      <nav className="flex gap-px bg-[var(--color-line)] p-px rounded-md self-start md:self-end">
        <ModeButton active={mode === "audit"} onClick={() => onModeChange("audit")} label="Audit d'entité" />
        <ModeButton active={mode === "manual"} onClick={() => onModeChange("manual")} label="Analyse de texte" />
      </nav>
    </header>
  );
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--color-surface-raised)] text-[var(--color-fg)]"
          : "bg-transparent text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]"
      }`}
    >
      {label}
    </button>
  );
}

function Footer() {
  return (
    <footer className="mt-auto pt-20 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[var(--color-fg-faint)] leading-relaxed">
      <p>Aucun verdict définitif. Sources publiques officielles uniquement.</p>
      <p className="md:text-right">Zéro stockage de données personnelles — conforme RGPD.</p>
    </footer>
  );
}
