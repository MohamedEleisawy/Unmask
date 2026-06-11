import { ScoreBar } from "@/shared/ui/ScoreBar";
import type { PillarData } from "../types";

type Impact = "harmful" | "neutral" | "favorable";
type Article = { title: string; url: string; impact: Impact; reason: string };
type Source = { label: string; url: string };

const IMPACT_LABEL: Record<Impact, string> = {
  harmful: "Nuit à l'image",
  neutral: "Neutre",
  favorable: "Favorable",
};

const IMPACT_COLOR: Record<Impact, string> = {
  harmful: "var(--color-bad)",
  neutral: "var(--color-fg-subtle)",
  favorable: "var(--color-accent)",
};

export function ReputationPillar({ data }: { data: PillarData }) {
  const articles = (data.articles as Article[]) || [];
  const score = data.reputation_score as number;
  const harmfulCount = (data.harmful_count as number) || 0;
  const summary = data.summary as string;
  const sources = (data.sources as Source[]) || [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 flex-wrap">
        <ScoreBar score={score} />
        {harmfulCount > 0 ? (
          <span className="text-[11px] uppercase tracking-wider font-medium text-[var(--color-bad)]">
            {harmfulCount} article{harmfulCount > 1 ? "s" : ""} nuisant{harmfulCount > 1 ? "s" : ""} à l’image
          </span>
        ) : (
          <span className="text-[11px] uppercase tracking-wider font-medium text-[var(--color-accent)]">
            Aucune atteinte à l’image
          </span>
        )}
      </div>

      {summary && (
        <p className="text-xs text-[var(--color-fg-subtle)] leading-relaxed max-w-[60ch]">
          {summary}
        </p>
      )}

      {articles.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {articles.slice(0, 5).map((a, i) => (
            <ArticleRow key={i} article={a} />
          ))}
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-fg-faint)] mb-1">
            Sources analysées ({sources.length})
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {sources.slice(0, 12).map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] transition-colors underline decoration-dotted underline-offset-2"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ArticleRow({ article }: { article: Article }) {
  const color = IMPACT_COLOR[article.impact];
  return (
    <div className="border-l-2 pl-3 py-0.5" style={{ borderColor: color }}>
      <div className="flex items-center gap-2 flex-wrap">
        {article.url ? (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-fg)] hover:opacity-70 transition-opacity font-medium leading-snug"
          >
            {article.title}
          </a>
        ) : (
          <span className="text-xs text-[var(--color-fg)] font-medium leading-snug">
            {article.title}
          </span>
        )}
        <span
          className="text-[10px] uppercase tracking-wider font-medium"
          style={{ color }}
        >
          {IMPACT_LABEL[article.impact]}
        </span>
      </div>
      {article.reason && (
        <p className="text-xs text-[var(--color-fg-subtle)] mt-1 leading-relaxed line-clamp-2">
          {article.reason}
        </p>
      )}
    </div>
  );
}
