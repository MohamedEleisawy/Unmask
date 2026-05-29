"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuditResults } from "@/features/audit/AuditResults";
import { fetchFullAudit } from "@/features/audit/api";
import type { AuditResponse } from "@/features/audit/types";

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
    <svg width="66" height="17" viewBox="0 0 66 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Unmask">
      <path d="M10.3809 11.7657V7.18792C10.3809 4.65809 12.489 2.59006 15.059 2.59006C17.6491 2.59006 19.7573 4.65809 19.7573 7.18792V11.7657H17.2877V6.98714C17.2877 5.80254 16.2838 4.81872 15.059 4.81872C13.8343 4.81872 12.8504 5.80254 12.8504 6.98714V11.7657H10.3809ZM27.0997 11.7657V6.7462C27.0997 5.70215 26.1962 4.81872 25.112 4.81872C24.0278 4.81872 23.1443 5.70215 23.1443 6.7462V11.7657H20.6747V6.94698C20.6747 4.5577 22.6625 2.59006 25.112 2.59006C26.2564 2.59006 27.3406 3.03178 28.1839 3.79474L28.3244 3.93529L28.4851 3.79474C29.3083 3.03178 30.3925 2.59006 31.5369 2.59006C33.9864 2.59006 35.9942 4.5577 35.9942 6.94698V11.7657H33.5246V6.7462C33.5246 5.70215 32.6412 4.81872 31.5369 4.81872C30.4527 4.81872 29.5693 5.70215 29.5693 6.7462V11.7657H27.0997Z" fill="#EEEEEE"/>
      <path d="M43.8968 9.33626C44.2983 8.9347 44.5594 8.39259 44.6397 7.85049C44.9007 6.14386 43.8365 4.5577 41.9894 4.5577C40.865 4.5577 39.9213 5.18012 39.4997 6.2041C39.2186 6.88675 39.2186 7.77018 39.4997 8.45283C39.7808 9.1154 40.2627 9.63743 40.9453 9.91852C41.5477 10.1595 42.2504 10.1795 42.8728 9.97875C43.2543 9.85829 43.6157 9.63743 43.8968 9.33626ZM47.0691 11.7657H44.6397V11.083L44.2983 11.3039C43.5555 11.7858 42.7523 12.0468 41.8689 12.0468C41.126 12.0669 40.4233 11.9665 39.7607 11.6854C39.1785 11.4444 38.6564 11.1031 38.2147 10.6614C37.3313 9.77797 36.9096 8.5733 36.9096 7.32846C36.9096 5.36082 38.0541 3.71443 39.9013 2.97154C41.1662 2.4696 42.7925 2.4696 44.0373 2.97154C45.9046 3.71443 47.0691 5.36082 47.0691 7.32846V11.7657Z" fill="#936BFF"/>
      <path d="M9.37641 2.89123V7.46901C9.37641 9.99883 7.26822 12.0669 4.67817 12.0669C2.10819 12.0669 0 9.99883 0 7.46901V2.89123H2.46959V7.66979C2.46959 8.85439 3.45341 9.83821 4.67817 9.83821C5.90292 9.83821 6.90682 8.85439 6.90682 7.66979V2.89123H9.37641Z" fill="#EEEEEE"/>
      <path d="M56.2927 6.38776e-06V7.20799L59.7461 2.91131L62.4967 2.89123L58.9429 7.32846L62.4967 11.7657L59.7461 11.7456L57.5776 9.03509L56.2927 10.6212V11.7657H53.8833V6.38776e-06H56.2927Z" fill="#936BFF"/>
      <path d="M53.8487 8.99166C53.9325 9.195 53.9889 9.40684 54.0796 9.61109L55.0307 4.72241C54.4791 5.19688 53.731 6.69746 52.8372 6.08736C52.0644 5.55984 51.858 4.60245 50.8366 4.31977C50.5347 4.2372 50.2172 4.23086 49.9123 4.30129C49.2255 4.45951 48.6494 5.01671 48.8306 5.75387C49.0637 6.70235 50.1596 6.86797 50.9559 7.00528C51.588 7.11427 52.3547 7.40461 52.871 7.7769C53.3031 8.08233 53.6418 8.50307 53.8487 8.99166Z" fill="#936BFF"/>
      <path d="M46.7688 6.51376C46.76 6.41836 46.7596 6.28945 46.7598 6.10187L46.7688 6.51376C46.7975 6.82518 46.915 6.77968 47.3863 7.25317C47.9064 7.77555 48.5835 8.08411 49.2806 8.30801C50.1599 8.59042 51.1066 8.50247 51.7003 9.35929C51.8377 9.55746 51.921 9.8236 51.9218 10.0638C51.9253 10.3398 51.8186 10.6057 51.6256 10.8021C51.2989 11.131 50.8386 11.272 50.3864 11.2688C49.9085 11.2654 49.4783 11.1235 49.1391 10.7791C48.6584 10.291 48.5234 9.52517 47.8227 9.27289C47.4744 9.1475 47.118 9.0913 46.8319 9.38995L46.7688 6.51376Z" fill="#936BFF"/>
      <circle cx="64.087" cy="10.9164" r="1.13043" fill="#EEEEEE"/>
    </svg>
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
