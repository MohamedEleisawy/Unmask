"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnalysisProgress } from "@/features/audit/AnalysisProgress";
import { AuditResults } from "@/features/audit/AuditResults";
import { ProfileConfirm } from "@/features/audit/ProfileConfirm";
import { fetchAuditPreview, fetchFullAudit } from "@/features/audit/api";
import type { AuditPreview, AuditResponse } from "@/features/audit/types";
import { AuditNavbar } from "@/features/audit/AuditNavbar";

export default function AuditPage() {
  return (
    <Suspense>
      <AuditPageInner />
    </Suspense>
  );
}

function AuditPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get("q") ?? "";
  const site = params.get("site") ?? "";

  // Flux en 2 étapes : 1) pré-vérification d'identité → 2) audit complet après validation.
  const [phase, setPhase] = useState<"searching" | "confirm" | "auditing" | "done">("searching");
  const [preview, setPreview] = useState<AuditPreview | null>(null);
  const [results, setResults] = useState<AuditResponse | null>(null);
  // Résultat reçu mais pas encore révélé : on laisse la barre atteindre 100 %
  // (son + notification) avant d'afficher le rapport.
  const [pendingResults, setPendingResults] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Deux champs distincts : le nom part toujours en `entity_name`, le site
  // (optionnel) en `url` — c'est ce champ que RDAP consomme pour l'âge du domaine.
  // Rétro-compat : un ancien lien `?q=monsite.fr` (sans `site`) garde l'ancien
  // découpage automatique nom/URL.
  const isUrl = query.startsWith("http") || (query.includes(".") && !query.includes(" "));
  const payload = site
    ? { entity_name: query || undefined, url: site }
    : { entity_name: !isUrl ? query : undefined, url: isUrl ? query : undefined };

  // Étape 1 — recherche rapide d'identité (sans audit complet).
  useEffect(() => {
    if (!query.trim()) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("searching");
    setPreview(null);
    setResults(null);
    setPendingResults(null);
    setError(null);

    fetchAuditPreview(payload)
      .then((p) => { if (!cancelled) { setPreview(p); setPhase("confirm"); } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Erreur serveur."); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, router]);

  // Étape 2 — audit complet, seulement après confirmation de l'utilisateur.
  // On stocke le résultat sans basculer en « done » : la carte d'analyse le
  // révèle elle-même une fois la barre à 100 % (cf. onReveal).
  const runFullAudit = async () => {
    setPhase("auditing");
    setError(null);
    setPendingResults(null);
    try {
      const data = await fetchFullAudit(payload);
      setPendingResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur.");
    }
  };

  // Révélation du rapport après l'animation de fin (barre à 100 %).
  // AnalysisProgress capture cette fonction via une ref : son identité peut
  // changer sans effet de bord (la mémoïsation est laissée au React Compiler).
  const revealResults = () => {
    if (pendingResults) {
      setResults(pendingResults);
      setPhase("done");
    }
  };

  // Confirmation de profil — écran plein dédié (maquette Figma node 963:3386),
  // avec sa propre navbar/footer violets. Les autres phases gardent la coquille
  // d'audit (nav sombre + barre de progression).
  if (!error && phase === "confirm" && preview) {
    return (
      <ProfileConfirm
        preview={preview}
        query={query}
        onConfirm={runFullAudit}
        onReject={() => router.replace("/")}
      />
    );
  }

  // Chargement de l'audit — écran plein dédié (maquettes Figma 963:3454/3513),
  // navbar/footer violets, barre de progression + opt-in notifications. Rendu
  // hors de la coquille sombre pour ne pas l'envelopper d'une nav --au-*.
  if (!error && phase === "auditing") {
    return (
      <AnalysisProgress
        query={query}
        hasWebsite={!!site}
        finished={!!pendingResults}
        onReveal={revealResults}
      />
    );
  }

  // Rapport d'audit — écran plein dédié (maquettes Figma 963:3563/3623/4020),
  // thème clair --ld, navbar/footer violets, anneau de score + sections.
  // Rendu hors de la coquille sombre (il porte sa propre chrome).
  if (!error && phase === "done" && results) {
    return <AuditResults results={results} />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "var(--au-bg)", color: "var(--au-text)" }}>
      {/* Navbar partagée — bouton retour à gauche, logo, bascule de thème. */}
      <AuditNavbar onBack={() => router.push("/")} />

      {/* Contenu */}
      <main className="flex-1 w-full">
        {error && <AuditError message={error} onRetry={() => router.replace(`/audit?q=${encodeURIComponent(query)}`)} />}
        {!error && phase === "searching" && <IdentitySearching query={query} />}
      </main>

      {/* Footer */}
      <footer className="w-full border-t" style={{ background: "var(--au-surface)", borderColor: "var(--au-border)" }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-6">
            {["About", "Help", "Contact"].map((l) => (
              <a key={l} href="#" className="text-sm transition-opacity hover:opacity-70" style={{ color: "var(--au-text-dim)" }}>
                {l}
              </a>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--au-text-dim)" }}>
            © 2026 Unmask. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

function AuditError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="max-w-[1200px] mx-auto px-4 md:px-8 pt-16 flex flex-col gap-4">
      <p className="text-sm" style={{ color: "var(--verdict-bad)", wordBreak: "break-word" }}>{message}</p>
      <button
        onClick={onRetry}
        className="self-start text-sm px-4 py-2 rounded-lg transition-colors active:scale-95"
        style={{ background: "var(--au-border)", color: "var(--au-text)" }}
      >
        Réessayer
      </button>
    </div>
  );
}

function IdentitySearching({ query }: { query: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="max-w-[640px] mx-auto px-4 md:px-8 pt-20 flex flex-col items-center gap-4 text-center"
    >
      <div
        className="size-10 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--au-border-strong)", borderTopColor: "#f84b5f" }}
        aria-hidden="true"
      />
      <p className="text-sm" style={{ color: "var(--au-text-muted)" }}>
        Recherche de l’identité de <span style={{ color: "var(--au-text)", wordBreak: "break-word" }}>@{query.replace(/^@/, "")}</span>…
      </p>
    </div>
  );
}
