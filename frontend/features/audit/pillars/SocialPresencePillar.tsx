import { SourceLink } from "@/shared/ui/SourceLink";
import type { PillarData } from "../types";

type Hit = {
  platform: string;
  domain: string;
  found: boolean;
  profile_url: string | null;
  title: string | null;
  snippet: string | null;
};

export function SocialPresencePillar({ data }: { data: PillarData }) {
  const hits = (data.hits as Hit[] | undefined) ?? [];
  const found = hits.filter((h) => h.found);
  const missing = hits.filter((h) => !h.found);

  if (hits.length === 0) {
    return (
      <p className="text-xs text-[var(--color-fg-subtle)] italic">
        Aucun résultat retourné par la recherche.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] uppercase tracking-wider text-[var(--color-fg-faint)]">
        {found.length} / {hits.length} plateformes détectées
      </p>

      {found.length > 0 && (
        <ul className="flex flex-col gap-2">
          {found.map((h) => (
            <li key={h.domain} className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-[var(--color-fg)]">{h.platform}</span>
              {h.profile_url && (
                <SourceLink href={h.profile_url} label={h.profile_url.replace(/^https?:\/\//, "")} />
              )}
              {h.snippet && (
                <p className="text-[11px] text-[var(--color-fg-subtle)] leading-snug line-clamp-2">
                  {h.snippet}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {missing.length > 0 && (
        <p className="text-[11px] text-[var(--color-fg-faint)]">
          Non détecté : {missing.map((m) => m.platform).join(" · ")}
        </p>
      )}
    </div>
  );
}
