"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPermission,
  getStoredNotifyPref,
  notifyAnalysisComplete,
  type PermissionState,
  playCompletionSound,
  requestPermission,
  storeNotifyPref,
} from "./analysisNotifications";
import { useAnalysisProgress } from "./useAnalysisProgress";

const VIOLET = "#936bff";

type Props = {
  query: string;
  hasWebsite: boolean;
  /** Devient vrai quand l'audit réel est revenu : déclenche la fin à 100 %. */
  finished: boolean;
  /** Appelé une fois la barre à 100 % et le son/notif émis. */
  onReveal: () => void;
};

// Le nombre d'étapes ne pilote plus d'affichage (pas de checklist sur l'écran
// de chargement) mais reste l'horloge logique de la montée de progression.
function stepCount(hasWebsite: boolean): number {
  return hasWebsite ? 9 : 8;
}

/**
 * Écran de chargement de l'audit — implémentation des maquettes Figma
 * (nodes 963:3454 « M'avertir » et 963:3513 « notif activées »).
 *
 * Plein écran clair (--ld) : navbar violette (chevron retour + logo), titre
 * centré, barre de progression avec la mascotte « m » et le %, carte d'opt-in
 * notifications (Accepter / Refuser) qui disparaît une fois la décision prise,
 * footer violet. La mécanique de progression, le son et la notification système
 * existants sont conservés tels quels (best-effort, tolérant aux échecs).
 */
export function AnalysisProgress({ query, hasWebsite, finished, onReveal }: Props) {
  const router = useRouter();
  const { progress } = useAnalysisProgress(stepCount(hasWebsite), finished);

  // `null` = pas encore décidé → la carte d'opt-in est affichée.
  // `true`/`false` = l'utilisateur a accepté / refusé → carte masquée, titre adapté.
  const [notifyEnabled, setNotifyEnabled] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<PermissionState>("default");

  // Restaure la préférence + l'état de permission après montage (évite le mismatch SSR).
  // Si une préférence existe déjà (ou permission décidée), on saute l'opt-in.
  useEffect(() => {
    const pref = getStoredNotifyPref();
    const perm = getPermission();
    /* eslint-disable react-hooks/set-state-in-effect */
    setPermission(perm);
    if (pref || perm !== "default") setNotifyEnabled(pref);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  async function decide(next: boolean) {
    setNotifyEnabled(next);
    storeNotifyPref(next);
    if (next) {
      const result = await requestPermission(); // ne re-demande pas si déjà granted/denied
      setPermission(result);
    }
  }

  // Émission unique à 100 % : son + notification (si activés), puis révélation.
  const enabledRef = useRef(notifyEnabled);
  const revealRef = useRef(onReveal);
  const firedRef = useRef(false);
  useEffect(() => { enabledRef.current = notifyEnabled; }, [notifyEnabled]);
  useEffect(() => { revealRef.current = onReveal; }, [onReveal]);
  useEffect(() => {
    if (progress < 100 || firedRef.current) return;
    firedRef.current = true;
    if (enabledRef.current && getPermission() === "granted") {
      notifyAnalysisComplete();
      void playCompletionSound();
    }
    const t = window.setTimeout(() => revealRef.current(), 750);
    return () => window.clearTimeout(t);
  }, [progress]);

  const cleanQuery = query.replace(/^@/, "");
  const decided = notifyEnabled !== null;
  const denied = permission === "denied";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--ld-bg)]">
      {/* Navbar violette — chevron retour + logo (Figma node 963:3455) */}
      <header className="w-full bg-[#936bff]">
        <div className="mx-auto flex h-[68px] w-full max-w-[342px] items-center justify-between md:max-w-[1200px] md:px-10">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Revenir à l'accueil"
            className="tap-target flex size-[40px] items-center justify-center rounded-[12px] bg-[#e7e7e7] text-[#101010] transition-transform active:scale-95"
          >
            <ChevronLeftIcon />
          </button>
          <UnmaskLogo />
        </div>
      </header>

      {/* Contenu — gap 56, centré (Figma node 963:3468) */}
      <main
        className="flex flex-1 flex-col items-center justify-center gap-[56px] px-[16px] py-[48px]"
        role="status"
        aria-live="polite"
        aria-busy={progress < 100}
      >
        <span className="sr-only">Analyse de {cleanQuery} en cours, {progress}%.</span>

        {/* Titre centré (Figma node 963:3470 / 963:3531) */}
        <p className="max-w-[338px] text-center font-landing-body text-[16px] leading-snug text-[var(--ld-text)]">
          {decided ? (
            <span className="font-bold">
              Le rapport arrive dans <span className="text-[var(--ld-violet-ink)]">quelques instants</span>.
            </span>
          ) : (
            <span className="font-bold">
              Nous préparons votre <span className="text-[var(--ld-violet-ink)]">rapport</span>.
            </span>
          )}
          <br />
          <span className="font-normal">
            Nous sommes en train de vérifier et de recouper les informations
            publiques disponibles.
          </span>
        </p>

        {/* Barre de progression + mascotte + % (Figma node 963:3471) */}
        <ProgressBar progress={progress} />

        {/* Carte opt-in notifications (Figma node 963:3482) — masquée une fois
            la décision prise, conformément à l'écran « notif activées ». */}
        {!decided && (
          <NotifyCard onAccept={() => decide(true)} onDecline={() => decide(false)} />
        )}
        {decided && notifyEnabled && denied && (
          <p className="max-w-[358px] text-center font-landing-body text-[14px] text-[var(--ld-text-muted)]">
            Notifications bloquées par le navigateur. Vous pouvez les réautoriser
            dans les réglages du site.
          </p>
        )}
      </main>

      {/* Footer violet (Figma node 963:3493) */}
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

/**
 * Barre de progression — piste blanche (w 295 r 7), remplissage violet à 70 %
 * d'opacité, mascotte « m » d'Unmask posée au bord du remplissage, % en Quatty.
 * Figma node 963:3471 (track 295×21, fill ~190 ≈ 64 %, mascotte 43×26).
 */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      className="relative w-[295px]"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progression de l'analyse"
    >
      {/* Piste */}
      <div className="h-[21px] w-full overflow-hidden rounded-[7px] bg-[var(--ld-surface)] shadow-[inset_0_0_0_1px_var(--ld-border)]">
        {/* Remplissage */}
        <div
          className="h-full rounded-[7px] bg-[rgba(147,107,255,0.7)]"
          style={{ width: `${progress}%`, transition: "width 0.14s linear" }}
        />
      </div>

      {/* Mascotte « m » posée au bord du remplissage (suit la progression). */}
      <div
        className="pointer-events-none absolute top-[-5px] z-10 h-[26px] w-[43px]"
        style={{
          left: `${progress}%`,
          transform: "translateX(-50%)",
          transition: "left 0.14s linear",
        }}
        aria-hidden="true"
      >
        <MascotKnob />
      </div>

      {/* Pourcentage sous la barre, aligné au bord du remplissage. */}
      <p
        className="absolute top-[36px] whitespace-nowrap font-landing-display text-[var(--ld-text)]"
        style={{ left: `${progress}%`, transform: "translateX(-50%)", transition: "left 0.14s linear" }}
      >
        <span className="text-[32px] leading-[32px] tracking-[0.07px]">{progress}</span>
        <span className="font-landing-body text-[24px] font-black leading-[32px]">%</span>
      </p>
    </div>
  );
}

/** Carte d'opt-in notifications (Figma node 963:3482) : titre, aide, boutons. */
function NotifyCard({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <section
      aria-label="Activer les notifications"
      className="flex w-full max-w-[358px] flex-col gap-[32px] rounded-[12px] bg-[var(--ld-surface)] p-[20px] shadow-[0_18px_50px_rgba(37,20,29,0.08)]"
    >
      <div className="flex flex-col gap-[10px]">
        <h2 className="font-landing-body text-[16px] font-bold text-[var(--ld-text)]">
          M&apos;avertir quand c&apos;est prêt !
        </h2>
        <p className="font-landing-body text-[16px] leading-[1.3] text-[var(--ld-text-muted)]">
          Autorisez les notifications pour être informé dès que l&apos;analyse est
          terminée.
        </p>
      </div>
      <div className="flex gap-[10px]">
        <button
          type="button"
          onClick={onAccept}
          className="flex h-[38px] flex-1 items-center justify-center rounded-[12px] bg-[#936bff] px-[12px] py-[8px] font-landing-body text-[16px] font-bold text-[#eee] transition-all hover:bg-[#7d54f0] active:-translate-y-px active:scale-[0.98]"
        >
          Accepter
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="flex h-[38px] flex-1 items-center justify-center rounded-[12px] border-2 border-[#936bff] px-[12px] py-[8px] font-landing-body text-[16px] font-bold text-[var(--ld-violet-ink)] transition-colors hover:bg-[#936bff]/8 active:scale-[0.98]"
        >
          Refuser
        </button>
      </div>
    </section>
  );
}

/** Chevron gauche (Figma node 963:3458). */
function ChevronLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 16L10 12L14 8" />
    </svg>
  );
}

/** Mascotte « m » d'Unmask, posée sur la barre (Figma node 963:3475, Group 52).
    Reproduit le SVG d'origine : corps « m » violet avec une pupille violette dans
    chaque creux. Le fond des creux (les « yeux ») doit être blanc même quand la
    mascotte chevauche la partie violette du remplissage : on peint donc un fond
    blanc DERRIÈRE le corps, qui n'apparaît que dans les deux creux ajourés. */
function MascotKnob() {
  const body = "M18.2057 26V11.7768C18.2057 8.81838 15.6455 6.3151 12.5733 6.3151C9.50109 6.3151 6.99781 8.81838 6.99781 11.7768V26H0V12.3457C0 5.57549 5.63239 0 12.5733 0C15.8162 0 18.8884 1.25164 21.2779 3.41357L21.6762 3.81182L22.1313 3.41357C24.4639 1.25164 27.5361 0 30.779 0C37.7199 0 43.4092 5.57549 43.4092 12.3457V26H36.4114V11.7768C36.4114 8.81838 33.9081 6.3151 30.779 6.3151C27.7068 6.3151 25.2035 8.81838 25.2035 11.7768V26H18.2057Z";
  return (
    <svg viewBox="0 0 43.4092 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="block size-full" aria-hidden="true">
      {/* Fond blanc des creux : visible uniquement dans les zones ajourées du « m ». */}
      <rect x="6" y="6" width="31.4" height="20" fill="#ffffff" />
      {/* Corps « m » violet par-dessus. */}
      <path d={body} fill={VIOLET} />
      {/* Pupilles violettes dans chaque creux. */}
      <circle cx="16.8149" cy="18.04" r="3.20319" fill={VIOLET} />
      <circle cx="35.0477" cy="18.04" r="3.20319" fill={VIOLET} />
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
