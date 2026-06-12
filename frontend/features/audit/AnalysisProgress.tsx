"use client";

import { useEffect, useRef, useState } from "react";
import { Switch } from "@/shared/ui/Switch";
import {
  getPermission,
  getStoredNotifyPref,
  notifyAnalysisComplete,
  type PermissionState,
  playCompletionSound,
  requestPermission,
  storeNotifyPref,
} from "./analysisNotifications";
import { type StepState, useAnalysisProgress } from "./useAnalysisProgress";

const GREEN = "#0cdda5";

type Props = {
  query: string;
  hasWebsite: boolean;
  /** Devient vrai quand l'audit réel est revenu : déclenche la fin à 100 %. */
  finished: boolean;
  /** Appelé une fois la barre à 100 % et le son/notif émis. */
  onReveal: () => void;
};

function buildSteps(hasWebsite: boolean): string[] {
  return [
    "Recherche de l’identité numérique",
    "Vérification des réseaux sociaux",
    "Recherche Wikipédia",
    "Analyse de la réputation publique",
    "Recherche entreprise / SIREN",
    "Contrôle AMF / ACPR",
    ...(hasWebsite ? ["Analyse du domaine web"] : []),
    "Calcul du score de crédibilité",
    "Génération du rapport",
  ];
}

export function AnalysisProgress({ query, hasWebsite, finished, onReveal }: Props) {
  const steps = buildSteps(hasWebsite);
  const { progress, states } = useAnalysisProgress(steps.length, finished);

  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("default");

  // Restaure la préférence + l'état de permission après montage (évite le mismatch SSR).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotifyEnabled(getStoredNotifyPref());
    setPermission(getPermission());
  }, []);

  async function handleToggle(next: boolean) {
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

  return (
    <div className="max-w-[640px] mx-auto px-4 md:px-8 pt-12 pb-16">
      <div
        className="rounded-2xl p-6 md:p-7 flex flex-col gap-6 border"
        style={{ background: "var(--au-surface)", borderColor: "var(--au-border)" }}
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Analyse de {cleanQuery} en cours, {progress}%.</span>

        {/* En-tête */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--au-text)" }}>
            Analyse en cours…
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--au-text-muted)" }}>
            Nous vérifions plusieurs sources pour établir le score de crédibilité.
          </p>
        </div>

        {/* Barre de progression */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium" style={{ color: "var(--au-text-muted)" }}>
              Analyse
            </span>
            <span className="num text-sm font-bold tabular-nums" style={{ color: GREEN }}>
              {progress}%
            </span>
          </div>
          <div
            className="h-2 w-full rounded-full overflow-hidden"
            style={{ background: "var(--au-border)" }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progression de l’analyse"
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${GREEN}, #34e0b5)`,
                transition: "width 0.14s linear",
              }}
            />
          </div>
        </div>

        {/* Checklist */}
        <ul className="flex flex-col gap-2.5">
          {steps.map((label, i) => (
            <ChecklistRow key={label} label={label} state={states[i]} />
          ))}
        </ul>

        {/* Notification */}
        <div className="border-t pt-5" style={{ borderColor: "var(--au-border)" }}>
          <NotifyRow
            enabled={notifyEnabled}
            permission={permission}
            onToggle={handleToggle}
          />
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({ label, state }: { label: string; state: StepState }) {
  const done = state === "done";
  const active = state === "active";
  const stateLabel = done ? "terminé" : active ? "en cours" : "en attente";
  return (
    <li className="flex items-center gap-3" aria-label={`${label} : ${stateLabel}`}>
      <StepIcon state={state} />
      <span
        className="text-sm transition-colors duration-300"
        style={{ color: done ? "var(--au-text)" : active ? "var(--au-text-muted)" : "var(--au-text-dim)" }}
      >
        {label}
      </span>
      <span className="sr-only">{stateLabel}</span>
    </li>
  );
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <circle cx="12" cy="12" r="10" fill={GREEN} fillOpacity="0.16" />
        <path d="M8 12.5l2.6 2.6L16 9.5" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === "active") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 animate-spin" style={{ animationDuration: "0.9s" }}>
        <circle cx="12" cy="12" r="9" stroke="var(--au-border-strong)" strokeWidth="2.4" />
        <path d="M12 3a9 9 0 0 1 9 9" stroke={GREEN} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r="9" stroke="var(--au-border-strong)" strokeWidth="2" />
    </svg>
  );
}

function NotifyRow({
  enabled,
  permission,
  onToggle,
}: {
  enabled: boolean;
  permission: PermissionState;
  onToggle: (next: boolean) => void;
}) {
  const denied = enabled && permission === "denied";
  const unsupported = permission === "unsupported";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--au-text)" }}>
            M’avertir quand c’est prêt !
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--au-text-faint)" }}>
            Autorisez les notifications pour être informé dès que l’analyse est terminée.
          </p>
        </div>
        <Switch
          checked={enabled}
          onChange={onToggle}
          disabled={unsupported}
          ariaLabel="M’avertir quand l’analyse est terminée"
        />
      </div>
      {denied && (
        <p className="text-xs" style={{ color: "#f5b454" }}>
          Notifications bloquées par le navigateur. Vous pouvez les réautoriser dans les réglages du site.
        </p>
      )}
      {unsupported && (
        <p className="text-xs" style={{ color: "var(--au-text-faint)" }}>
          Les notifications ne sont pas prises en charge par ce navigateur.
        </p>
      )}
    </div>
  );
}
