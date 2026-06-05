import type { PillarData } from "./types";

/**
 * Section « Preuves & alertes médiatiques ».
 *
 * Fusionne les articles enrichis renvoyés par les piliers OSINT (osint.results)
 * et Réputation (reputation.articles), puis affiche chaque article sous forme de
 * carte : titre, média, date, résumé, phrase d'accroche et bouton vers la source.
 *
 * Format article attendu (cf. osint_models / reputation_models — to_dict) :
 *   { title, url, source, published_date, sentiment, risk_level, summary, hook }
 */

type Article = {
  title: string;
  url: string;
  source: string;
  published_date: string;
  sentiment: string;
  risk_level: string;
  summary: string;
  hook: string;
  snippet?: string;
};

const SENTIMENT_STYLE: Record<string, { color: string; label: string }> = {
  negatif:   { color: "#f84b5f", label: "Défavorable" },
  harmful:   { color: "#f84b5f", label: "Défavorable" },
  ambigu:    { color: "#f5b454", label: "À vérifier" },
  neutral:   { color: "#f5b454", label: "Neutre" },
  positif:   { color: "#0cdda5", label: "Favorable" },
  favorable: { color: "#0cdda5", label: "Favorable" },
};

function sentimentStyle(sentiment: string) {
  return SENTIMENT_STYLE[sentiment] ?? SENTIMENT_STYLE.neutral;
}

/** Rang de gravité : défavorable d'abord, favorable en dernier. */
function severityRank(sentiment: string): number {
  if (sentiment === "negatif" || sentiment === "harmful") return 0;
  if (sentiment === "ambigu" || sentiment === "neutral") return 1;
  return 2;
}

function collectArticles(pillars: Record<string, PillarData | undefined>): Article[] {
  const osint = pillars.osint as PillarData | undefined;
  const reputation = pillars.reputation as PillarData | undefined;

  const raw: Article[] = [
    ...(((osint?.results as Article[] | undefined) ?? [])),
    ...(((reputation?.articles as Article[] | undefined) ?? [])),
  ];

  const seen = new Set<string>();
  const out: Article[] = [];
  for (const a of raw) {
    if (!a?.title) continue;
    const key = (a.url || a.title).trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }

  out.sort((a, b) => severityRank(a.sentiment) - severityRank(b.sentiment));
  return out;
}

function formatDate(raw: string): string {
  if (!raw) return "";
  // Accepte YYYY-MM-DD ; sinon renvoie tel quel (Claude peut donner une date libre).
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!m) return raw;
  try {
    return new Date(`${m[1]}-${m[2]}-${m[3]}`).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return raw;
  }
}

export function AlertEvidence({ pillars }: { pillars: Record<string, PillarData | undefined> }) {
  const articles = collectArticles(pillars);

  if (articles.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold" style={{ color: "#6a6a6a" }}>
          Preuves &amp; alertes médiatiques
        </h3>
        <span className="text-[11px]" style={{ color: "#3a3a3a" }}>
          {articles.length} article{articles.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {articles.map((a, i) => (
          <ArticleCard key={a.url || i} article={a} />
        ))}
      </div>
    </section>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const style = sentimentStyle(article.sentiment);
  const date = formatDate(article.published_date);
  const summary = article.summary || article.snippet || "";

  return (
    <article
      className="rounded-2xl border overflow-hidden"
      style={{ background: "#141414", borderColor: "#1e1e1e" }}
    >
      {/* Bandeau gauche coloré selon le sentiment */}
      <div className="grid grid-cols-[3px_1fr]">
        <div style={{ background: style.color }} />

        <div className="flex flex-col gap-3 p-5">
          {/* Méta : média · date · niveau de risque */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
            {article.source && (
              <span className="text-xs font-semibold" style={{ color: "#8a8a8a" }}>
                {article.source}
              </span>
            )}
            {date && (
              <>
                <span style={{ color: "#3a3a3a" }}>·</span>
                <span className="text-[11px]" style={{ color: "#5a5a5a" }}>
                  {date}
                </span>
              </>
            )}
            <span
              className="ml-auto text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ color: style.color, background: `${style.color}14` }}
            >
              {article.risk_level || style.label}
            </span>
          </div>

          {/* Titre */}
          <h4 className="text-sm font-medium leading-snug" style={{ color: "#eee" }}>
            {article.title}
          </h4>

          {/* Résumé (2-3 phrases) */}
          {summary && (
            <p className="text-xs leading-relaxed" style={{ color: "#7a7a7a" }}>
              {summary}
            </p>
          )}

          {/* Phrase d'accroche mise en évidence */}
          {article.hook && (
            <p
              className="text-xs leading-relaxed border-l-2 pl-3 italic"
              style={{ color: "#b0b0b0", borderColor: style.color }}
            >
              {article.hook}
            </p>
          )}

          {/* Bouton vers la source */}
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start inline-flex items-center gap-1.5 text-xs font-medium mt-1 px-3 py-1.5 rounded-lg transition-all active:scale-95 hover:opacity-80"
              style={{ background: "#1e1e1e", color: "#936bff" }}
            >
              Voir la source
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 17L17 7M17 7H7M17 7V17"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
