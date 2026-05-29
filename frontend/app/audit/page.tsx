"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuditResults } from "@/features/audit/AuditResults";
import { fetchFullAudit } from "@/features/audit/api";
import type { AuditResponse } from "@/features/audit/types";

export default function AuditPage() {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get("q") ?? "";

  const [results, setResults] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setResults(null);

    const isUrl = query.startsWith("http") || (query.includes(".") && !query.includes(" "));
    fetchFullAudit({
      entity_name: !isUrl ? query : undefined,
      url: isUrl ? query : undefined,
      sector: "autre",
    })
      .then((data) => { if (!cancelled) setResults(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Erreur serveur."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [query, router]);

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "#101010", color: "#eee" }}>
      {/* Nav minimale : logo + retour */}
      <nav
        className="sticky top-0 z-30 w-full border-b"
        style={{ background: "rgba(16,16,16,0.92)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <UnmaskLogo />
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-all active:scale-95"
            style={{ color: "#808080", background: "rgba(255,255,255,0.05)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour
          </button>
        </div>
      </nav>

      {/* Contenu */}
      <main className="flex-1 w-full">
        {loading && <AuditLoading query={query} />}
        {error && <AuditError message={error} onRetry={() => router.replace(`/audit?q=${encodeURIComponent(query)}`)} />}
        {results && <AuditResults results={results} />}
      </main>

      {/* Footer */}
      <footer className="w-full border-t" style={{ background: "#181818", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-6">
            {["About", "Help", "Contact"].map((l) => (
              <a key={l} href="#" className="text-sm transition-opacity hover:opacity-70" style={{ color: "#3a3a3a" }}>
                {l}
              </a>
            ))}
          </div>
          <p className="text-xs" style={{ color: "#3a3a3a" }}>
            © 2026 Unmask. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

function UnmaskLogo() {
  return (
    <span className="font-landing-display font-bold text-xl tracking-tight select-none">
      <span style={{ color: "#eee" }}>Un</span>
      <span style={{ color: "#936bff" }}>m</span>
      <span style={{ color: "#eee" }}>as</span>
      <span style={{ color: "#936bff" }}>k</span>
    </span>
  );
}

function Bone({ w, h = "h-3", rounded = "rounded" }: { w: string; h?: string; rounded?: string }) {
  return (
    <div
      className={`${w} ${h} ${rounded} animate-pulse shrink-0`}
      style={{ background: "#1e1e1e" }}
    />
  );
}

function AuditLoading({ query }: { query: string }) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-8 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-12 items-start">

        {/* Colonne principale */}
        <div className="flex flex-col gap-8">

          {/* Card score — reproduit le header résultat */}
          <div
            className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-6 border"
            style={{ background: "#141414", borderColor: "#1e1e1e" }}
          >
            {/* Ring SVG placeholder */}
            <div
              className="shrink-0 size-[96px] rounded-full animate-pulse"
              style={{ background: "#1e1e1e" }}
            />
            <div className="flex flex-col gap-3 flex-1 min-w-0">
              <Bone w="w-20" h="h-2" />
              {/* Nom de l'entité — on affiche la query */}
              <p className="text-2xl font-bold font-landing-display truncate" style={{ color: "#f84b5f" }}>
                @{query.replace(/^@/, "")}
              </p>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full animate-pulse" style={{ background: "#2a2a2a" }} />
                <Bone w="w-24" h="h-2.5" />
              </div>
              <Bone w="w-48" h="h-2" />
            </div>
          </div>

          {/* Card identité légale */}
          <div className="flex flex-col gap-4">
            <Bone w="w-28" h="h-3" />
            <div
              className="rounded-2xl p-5 border grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4"
              style={{ background: "#141414", borderColor: "#1e1e1e" }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Bone w="w-16" h="h-2" />
                  <Bone w={i % 3 === 0 ? "w-32" : i % 3 === 1 ? "w-24" : "w-20"} h="h-3" />
                </div>
              ))}
            </div>
          </div>

          {/* Présence en ligne */}
          <div className="flex flex-col gap-4">
            <Bone w="w-36" h="h-3" />
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between h-12 rounded-xl px-4 border"
                  style={{ background: "#141414", borderColor: "#1e1e1e" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg animate-pulse" style={{ background: "#1e1e1e" }} />
                    <Bone w={i === 0 ? "w-28" : i === 1 ? "w-24" : "w-20"} h="h-3" />
                  </div>
                  <div className="size-7 rounded-lg animate-pulse" style={{ background: "#1e1e1e" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Critères détaillés */}
          <div className="flex flex-col gap-4">
            <Bone w="w-52" h="h-3" />
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "#1e1e1e" }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex items-start justify-between gap-6 px-5 py-4 ${i < 3 ? "border-b" : ""}`}
                  style={{ background: "#141414", borderColor: "#1e1e1e" }}
                >
                  <div className="flex flex-col gap-2 flex-1">
                    <Bone w={i % 2 === 0 ? "w-36" : "w-44"} h="h-3" />
                    <Bone w="w-48" h="h-2" />
                  </div>
                  <div className="h-6 w-20 rounded-full animate-pulse" style={{ background: "#1e1e1e" }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar droite */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-20">

          {/* Conformité */}
          <div className="flex flex-col gap-4">
            <Bone w="w-24" h="h-3" />
            <div
              className="rounded-2xl p-5 border flex flex-col gap-4"
              style={{ background: "#141414", borderColor: "#1e1e1e" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <Bone w="w-36" h="h-3" />
                  <Bone w="w-24" h="h-2" />
                </div>
                <div className="size-8 rounded-full animate-pulse" style={{ background: "#1e1e1e" }} />
              </div>
              <div className="flex flex-col gap-3">
                {["AMF", "ACPR"].map((l) => (
                  <div key={l} className="flex items-center justify-between">
                    <Bone w="w-10" h="h-2" />
                    <Bone w="w-20" h="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score global */}
          <div
            className="rounded-2xl p-5 border flex flex-col gap-4"
            style={{ background: "#141414", borderColor: "#1e1e1e" }}
          >
            <Bone w="w-24" h="h-2" />
            <div className="flex items-end gap-2">
              <div className="w-16 h-12 rounded-lg animate-pulse" style={{ background: "#1e1e1e" }} />
              <Bone w="w-10" h="h-5" />
            </div>
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <Bone w={i % 2 === 0 ? "w-28" : "w-32"} h="h-2" />
                  <div className="h-5 w-10 rounded-full animate-pulse" style={{ background: "#1e1e1e" }} />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function AuditError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-16 flex flex-col gap-4">
      <p className="text-sm" style={{ color: "#f84b5f" }}>{message}</p>
      <button
        onClick={onRetry}
        className="self-start text-sm px-4 py-2 rounded-lg"
        style={{ background: "#1e1e1e", color: "#eee" }}
      >
        Réessayer
      </button>
    </div>
  );
}
