"use client";

import type { AuditPreview } from "@/features/audit/types";
import { AuditNavbar } from "@/features/audit/AuditNavbar";

/**
 * Confirmation de profil — implémentation de la maquette Figma (node 963:3386).
 * Navbar violette (chevron retour + logo), question, carte profil blanche
 * (photo cerclée turquoise + infos), boutons Oui / Non, footer violet.
 *
 * Adaptation aux données réelles de la pré-vérification : la maquette montre
 * NOM / STATUT / Date de création, mais la preview ne porte que nom réel, photo
 * et réseaux. On conserve donc NOM + les RÉSEAUX trouvés (fonctionnalité
 * existante) à la place de STATUT/date, indisponibles à ce stade.
 */
export function ProfileConfirm({
  preview,
  query,
  onConfirm,
  onReject,
}: {
  preview: AuditPreview;
  query: string;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const handle = query.replace(/^@/, "");
  // Retire un suffixe d'homonymie Wikipédia (« Michou (vidéaste) » → « Michou »).
  const realName = preview.real_name?.replace(/\s*\(.*?\)\s*$/, "").trim() || null;
  const displayName = realName || `@${handle}`;
  const networks = preview.networks;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--ld-bg)]">
      {/* Navbar partagée — bouton retour à gauche, logo, bascule de thème. */}
      <AuditNavbar onBack={onReject} backLabel="Revenir en arrière" />

      {/* Contenu — gap 32, padding latéral 32 (Figma node 963:3400) */}
      <main className="flex flex-1 flex-col items-center justify-center gap-[32px] px-[32px] py-[48px]">
        <h1 className="max-w-[382px] text-center font-landing-body text-[20px] font-bold leading-snug text-balance text-[var(--ld-text)]">
          Est-ce bien le profil que vous souhaitez{" "}
          <span className="text-[var(--ld-violet-ink)]">vérifier</span> ?
        </h1>

        {/* Carte profil (Figma node 963:3402) */}
        <section
          aria-label="Profil à vérifier"
          className="flex w-full max-w-[326px] flex-col gap-[8px] rounded-[12px] bg-[var(--ld-surface)] p-[8px] shadow-[0_18px_50px_rgba(37,20,29,0.08)] md:max-w-[420px]"
        >
          {/* Titre carte */}
          <div className="flex items-center gap-[8px] p-[8px]">
            <UserCircleIcon className="size-[20px] text-[var(--ld-text-muted)]" />
            <p className="font-landing-body text-[20px] font-medium leading-none text-[var(--ld-text-muted)]">
              Profil
            </p>
          </div>

          {/* Séparateur (Figma node 963:3409) */}
          <div className="h-[2px] w-full rounded-[9px] bg-[var(--ld-border-solid)]" aria-hidden="true" />

          {/* Contenu : photo + infos (Figma node 963:3410) */}
          <div className="flex items-center gap-[24px] p-[16px] md:gap-[40px]">
            {/* Photo — anneau turquoise 4px, padding 10, image 100×100 ronde */}
            <div className="flex shrink-0 items-center rounded-full border-4 border-[#0cdda5] p-[10px]">
              <div className="flex size-[100px] items-center justify-center overflow-hidden rounded-full border border-[var(--ld-text-faint)] bg-[var(--ld-bg)]">
                {preview.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.image_url}
                    alt={`Photo de ${displayName}`}
                    width={100}
                    height={100}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="size-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <UserIcon className="size-[40px] text-[var(--ld-text-faint)]" />
                )}
              </div>
            </div>

            {/* Colonne d'infos */}
            <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
              <InfoBlock label="Nom" value={displayName} strong />
              {networks.length > 0 ? (
                <div className="flex flex-col gap-[8px]">
                  <p className="font-landing-body text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--ld-text-muted)]">
                    Réseaux
                  </p>
                  <ul className="flex flex-wrap gap-[6px]">
                    {networks.map((n) => (
                      <li
                        key={n.platform}
                        className="flex items-center gap-1 rounded-full bg-[#936bff]/12 px-2.5 py-1 font-landing-body text-[12px] font-medium text-[var(--ld-text)]"
                      >
                        {n.platform}
                        {n.official && <span className="text-[#0cdda5]" aria-label="officiel">✓</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <InfoBlock label="Réseaux" value="Peu d'éléments publics trouvés" />
              )}
            </div>
          </div>
        </section>

        {/* Boutons Oui / Non (Figma node 963:3429) */}
        <div className="flex w-full max-w-[326px] items-center justify-center gap-[10px] px-[32px] md:max-w-[420px]">
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-[38px] flex-1 items-center justify-center rounded-[12px] bg-[#936bff] px-[12px] py-[8px] font-landing-body text-[16px] font-bold text-[#eee] transition-all hover:bg-[#7d54f0] active:-translate-y-px active:scale-[0.98]"
          >
            Oui
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex h-[38px] flex-1 items-center justify-center rounded-[12px] border border-[#936bff] px-[12px] py-[8px] font-landing-body text-[16px] font-bold text-[var(--ld-violet-ink)] transition-colors hover:bg-[#936bff]/8 active:scale-[0.98]"
          >
            Non
          </button>
        </div>
      </main>

      {/* Footer violet (Figma node 963:3434) */}
      <footer className="w-full bg-[#936bff] px-[16px] py-[64px] md:px-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-[24px]">
          <nav className="flex items-center gap-[24px]">
            {["À propos", "Aide", "Contact"].map((l) => (
              <a
                key={l}
                href="#"
                className="font-['Inter',var(--font-landing-body)] text-[16px] leading-[24px] text-[#eee] transition-colors hover:text-white"
              >
                {l}
              </a>
            ))}
          </nav>
          <p className="font-landing-body text-[16px] font-light text-[#eee]">
            © 2026 Unmask. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Bloc « LABEL / valeur » de la colonne d'infos (Figma node 963:3420/3423/3426). */
function InfoBlock({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <p className="font-landing-body text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--ld-text-muted)]">
        {label}
      </p>
      <p
        className={`font-landing-body text-[14px] text-[var(--ld-text)] ${strong ? "font-bold" : "font-medium"} break-words`}
      >
        {value}
      </p>
    </div>
  );
}

/** User-circle (Figma node 963:3407). */
function UserCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M14.3472 16.1102C13.2791 14.9173 11.7272 14.1667 10 14.1667C8.27279 14.1667 6.72077 14.9173 5.65267 16.1102M10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10C17.5 14.1421 14.1421 17.5 10 17.5ZM10 11.6667C8.61929 11.6667 7.5 10.5474 7.5 9.16667C7.5 7.78595 8.61929 6.66667 10 6.66667C11.3807 6.66667 12.5 7.78595 12.5 9.16667C12.5 10.5474 11.3807 11.6667 10 11.6667Z" />
    </svg>
  );
}

/** Avatar de repli quand aucune photo (User_01 de la maquette). */
function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
