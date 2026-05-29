import React from "react";
import type { PillarData } from "../types";

type Hit = {
  platform: string;
  domain: string;
  found: boolean;
  profile_url: string | null;
  title: string | null;
  snippet: string | null;
};

const PLATFORM_ICONS: Record<string, { bg: string; icon: React.ReactNode }> = {
  Instagram: {
    bg: "bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  TikTok: {
    bg: "bg-black",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
      </svg>
    ),
  },
  YouTube: {
    bg: "bg-[#FF0000]",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
        <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
      </svg>
    ),
  },
  "X (Twitter)": {
    bg: "bg-black",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
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

      {found.length === 0 && (
        <p className="text-xs text-[var(--color-fg-subtle)] italic">
          Aucun profil détecté sur les plateformes analysées.
        </p>
      )}

      {found.length > 0 && (
        <ul className="flex flex-col gap-2">
          {found.map((h) => {
            const meta = PLATFORM_ICONS[h.platform];
            return (
              <li key={h.domain}>
                <a
                  href={h.profile_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-muted)] transition-colors"
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${meta?.bg ?? "bg-zinc-700"}`}>
                    {meta?.icon ?? <span className="text-white text-xs font-bold">{h.platform[0]}</span>}
                  </span>
                  <span className="flex-1 text-sm text-[var(--color-fg)] truncate">{h.platform}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[var(--color-fg-subtle)] flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </a>
              </li>
            );
          })}
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
