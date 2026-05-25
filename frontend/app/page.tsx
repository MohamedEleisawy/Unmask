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
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center px-4 py-10">
      <Header mode={mode} onModeChange={setMode} />

      {mode === "audit" ? (
        <>
          <AuditForm onResults={setResults} onReset={() => setResults(null)} />
          {results && <AuditDashboard results={results} />}
        </>
      ) : (
        <ManualAnalysis />
      )}

      <Footer />
    </main>
  );
}

function Header({ mode, onModeChange }: { mode: Mode; onModeChange: (m: Mode) => void }) {
  return (
    <header className="mb-10 text-center">
      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="text-3xl font-black tracking-tight text-white">
          Un<span className="text-indigo-400">mask</span>
        </span>
        <span className="text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full font-medium">v2.0</span>
      </div>
      <p className="text-gray-400 text-sm max-w-md">
        Audit de crédibilité IA — identité légale, conformité AMF, analyse du discours, engagement, réputation.
      </p>

      <div className="flex mt-6 gap-2 justify-center">
        <ModeButton active={mode === "audit"} onClick={() => onModeChange("audit")} label="Audit d'entité" />
        <ModeButton active={mode === "manual"} onClick={() => onModeChange("manual")} label="Analyse de texte" />
      </div>
    </header>
  );
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function Footer() {
  return (
    <footer className="mt-16 text-center text-gray-600 text-xs max-w-lg">
      Aucun verdict définitif. Données issues de sources publiques officielles.
      Pas de stockage de données personnelles (RGPD).
    </footer>
  );
}
