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
import { AuditNavbar } from "@/features/audit/AuditNavbar";

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
      {/* Navbar partagée — bouton retour à gauche, logo, bascule de thème. */}
      <AuditNavbar onBack={() => router.push("/")} />

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
          className="flex h-[38px] flex-1 items-center justify-center rounded-[12px] bg-[#936bff] px-[12px] py-[8px] font-landing-body text-[16px] font-bold text-[#eee] transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-[#7d54f0] active:-translate-y-px active:scale-[0.98]"
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

