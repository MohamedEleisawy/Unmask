"use client";

import type { AuditPreview } from "@/features/audit/types";

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
      {/* Navbar violette — chevron retour + logo (Figma node 963:3387) */}
      <header className="w-full bg-[#936bff]">
        <div className="mx-auto flex h-[68px] w-full max-w-[342px] items-center justify-between md:max-w-[1200px] md:px-10">
          <button
            type="button"
            onClick={onReject}
            aria-label="Revenir en arrière"
            className="tap-target flex size-[40px] items-center justify-center rounded-[12px] bg-[#e7e7e7] text-[#101010] transition-transform active:scale-95"
          >
            <ChevronLeftIcon />
          </button>
          <UnmaskLogo />
        </div>
      </header>

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

/** Chevron gauche (Figma node 963:3390). */
function ChevronLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 16L10 12L14 8" />
    </svg>
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

/** Logo Unmask — forcé en blanc sur la barre violette. */
function UnmaskLogo() {
  return (
    <svg width="80" height="14" viewBox="0 0 66 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Unmask" className="h-[14px] w-[80px]">
      <path d="M10.3809 11.7657V7.18792C10.3809 4.65809 12.489 2.59006 15.059 2.59006C17.6491 2.59006 19.7573 4.65809 19.7573 7.18792V11.7657H17.2877V6.98714C17.2877 5.80254 16.2838 4.81872 15.059 4.81872C13.8343 4.81872 12.8504 5.80254 12.8504 6.98714V11.7657H10.3809ZM27.0997 11.7657V6.7462C27.0997 5.70215 26.1962 4.81872 25.112 4.81872C24.0278 4.81872 23.1443 5.70215 23.1443 6.7462V11.7657H20.6747V6.94698C20.6747 4.5577 22.6625 2.59006 25.112 2.59006C26.2564 2.59006 27.3406 3.03178 28.1839 3.79474L28.3244 3.93529L28.4851 3.79474C29.3083 3.03178 30.3925 2.59006 31.5369 2.59006C33.9864 2.59006 35.9942 4.5577 35.9942 6.94698V11.7657H33.5246V6.7462C33.5246 5.70215 32.6412 4.81872 31.5369 4.81872C30.4527 4.81872 29.5693 5.70215 29.5693 6.7462V11.7657H27.0997Z" fill="#eee"/>
      <path d="M43.8968 9.33626C44.2983 8.9347 44.5594 8.39259 44.6397 7.85049C44.9007 6.14386 43.8365 4.5577 41.9894 4.5577C40.865 4.5577 39.9213 5.18012 39.4997 6.2041C39.2186 6.88675 39.2186 7.77018 39.4997 8.45283C39.7808 9.1154 40.2627 9.63743 40.9453 9.91852C41.5477 10.1595 42.2504 10.1795 42.8728 9.97875C43.2543 9.85829 43.6157 9.63743 43.8968 9.33626ZM47.0691 11.7657H44.6397V11.083L44.2983 11.3039C43.5555 11.7858 42.7523 12.0468 41.8689 12.0468C41.126 12.0669 40.4233 11.9665 39.7607 11.6854C39.1785 11.4444 38.6564 11.1031 38.2147 10.6614C37.3313 9.77797 36.9096 8.5733 36.9096 7.32846C36.9096 5.36082 38.0541 3.71443 39.9013 2.97154C41.1662 2.4696 42.7925 2.4696 44.0373 2.97154C45.9046 3.71443 47.0691 5.36082 47.0691 7.32846V11.7657Z" fill="#fff"/>
      <path d="M9.37641 2.89123V7.46901C9.37641 9.99883 7.26822 12.0669 4.67817 12.0669C2.10819 12.0669 0 9.99883 0 7.46901V2.89123H2.46959V7.66979C2.46959 8.85439 3.45341 9.83821 4.67817 9.83821C5.90292 9.83821 6.90682 8.85439 6.90682 7.66979V2.89123H9.37641Z" fill="#eee"/>
      <path d="M56.2927 6.38776e-06V7.20799L59.7461 2.91131L62.4967 2.89123L58.9429 7.32846L62.4967 11.7657L59.7461 11.7456L57.5776 9.03509L56.2927 10.6212V11.7657H53.8833V6.38776e-06H56.2927Z" fill="#fff"/>
      <path d="M53.8487 8.99166C53.9325 9.195 53.9889 9.40684 54.0796 9.61109L55.0307 4.72241C54.4791 5.19688 53.731 6.69746 52.8372 6.08736C52.0644 5.55984 51.858 4.60245 50.8366 4.31977C50.5347 4.2372 50.2172 4.23086 49.9123 4.30129C49.2255 4.45951 48.6494 5.01671 48.8306 5.75387C49.0637 6.70235 50.1596 6.86797 50.9559 7.00528C51.588 7.11427 52.3547 7.40461 52.871 7.7769C53.3031 8.08233 53.6418 8.50307 53.8487 8.99166Z" fill="#fff"/>
      <path d="M46.7688 6.51376C46.76 6.41836 46.7596 6.28945 46.7598 6.10187L46.7688 6.51376C46.7975 6.82518 46.915 6.77968 47.3863 7.25317C47.9064 7.77555 48.5835 8.08411 49.2806 8.30801C50.1599 8.59042 51.1066 8.50247 51.7003 9.35929C51.8377 9.55746 51.921 9.8236 51.9218 10.0638C51.9253 10.3398 51.8186 10.6057 51.6256 10.8021C51.2989 11.131 50.8386 11.272 50.3864 11.2688C49.9085 11.2654 49.4783 11.1235 49.1391 10.7791C48.6584 10.291 48.5234 9.52517 47.8227 9.27289C47.4744 9.1475 47.118 9.0913 46.8319 9.38995L46.7688 6.51376Z" fill="#fff"/>
      <circle cx="64.087" cy="10.9164" r="1.13043" fill="#eee"/>
    </svg>
  );
}
