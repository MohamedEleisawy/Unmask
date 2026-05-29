"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LandingHero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/audit?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 md:px-10">
      {/* Mobile : centré / Desktop : split asymétrique */}
      <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:justify-between pt-24 md:pt-32 pb-16 md:pb-28 gap-10 md:gap-16">

        {/* Colonne gauche */}
        <div className="flex flex-col items-center md:items-start gap-6 md:max-w-[520px]">
          <h1 className="font-landing-body font-bold text-[#f84b5f] text-[32px] md:text-[52px] leading-tight tracking-tight">
            Un feed ne dit<br className="hidden md:block" /> pas tout.
          </h1>
          <p className="font-landing-body text-[#eee]/70 text-[16px] md:text-[18px] leading-relaxed max-w-[340px] md:max-w-[400px]">
            Insérez un nom ou un pseudo pour vérifier l&apos;identité et la crédibilité d&apos;un influenceur, coach ou vendeur en ligne.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-[310px] md:w-[340px] h-[49px]">
              <div className="absolute inset-0 bg-[#eee] rounded-[32px]" />
              <div className="absolute inset-0 flex items-center gap-2 pl-[18px]">
                <div className="relative shrink-0 size-4">
                  <img alt="" className="absolute inset-0 size-full object-contain" src="/landing/search-dark.svg" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nom ou pseudo"
                  className="bg-transparent font-landing-body text-[13px] text-[#25141d] placeholder:text-[#25141d]/50 outline-none w-full"
                />
              </div>
            </div>
            <button
              type="submit"
              className="font-landing-body font-bold bg-[#936bff] text-[#eee] text-[16px] h-[49px] px-6 rounded-[32px] whitespace-nowrap hover:bg-[#7d54f0] active:scale-95 transition-all"
            >
              Vérifier ce profil
            </button>
          </form>
        </div>

        {/* Colonne droite — visible desktop uniquement */}
        <div className="hidden md:block relative shrink-0">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  const badges = [
    { label: "Identité légale", color: "#0cdda5", text: "#100400", detail: "SIREN vérifié" },
    { label: "Conformité AMF", color: "#936bff", text: "#fff3e1", detail: "Hors liste noire" },
    { label: "Réputation OSINT", color: "#fec530", text: "#100400", detail: "0 alerte détectée" },
    { label: "Engagement YouTube", color: "#f84b5f", text: "#fff3e1", detail: "Ratio cohérent" },
  ];

  return (
    <div className="relative w-[340px] h-[320px]">
      {/* Glow ambient */}
      <div className="absolute inset-0 rounded-3xl bg-[#936bff]/10 blur-3xl" />

      {/* Carte centrale */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 bg-[#181818] overflow-hidden flex flex-col justify-between p-6">
        <div className="flex flex-col gap-1">
          <p className="font-landing-body text-[#eee]/40 text-[11px] uppercase tracking-widest">Rapport d&apos;audit</p>
          <p className="font-landing-body font-bold text-[#eee] text-[20px]">@mentor_finance</p>
        </div>

        <div className="flex flex-col gap-3">
          {badges.map((b) => (
            <div key={b.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: b.color }}
                />
                <span className="font-landing-body text-[#eee]/70 text-[13px]">{b.label}</span>
              </div>
              <span
                className="font-landing-body text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: b.color + "22", color: b.color }}
              >
                {b.detail}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="font-landing-body text-[#eee]/30 text-[11px]">Score global</span>
          <span className="font-landing-body font-bold text-[#936bff] text-[22px]">87 / 100</span>
        </div>
      </div>
    </div>
  );
}
