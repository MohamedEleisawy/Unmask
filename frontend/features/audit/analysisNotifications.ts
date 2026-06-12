/**
 * Notifications locales + son de fin d'analyse (aucun push serveur).
 *
 * Tout est best-effort et tolérant aux échecs : permission refusée, API absente,
 * lecture audio bloquée par le navigateur → on dégrade sans jamais throw.
 */

export const NOTIFY_PREF_KEY = "unmask:notify-when-ready";

export type PermissionState = NotificationPermission | "unsupported";

const NOTIF_TITLE = "Analyse terminée";
const NOTIF_BODY = "Votre rapport de crédibilité est prêt.";
const NOTIF_ICON = "/icon.svg";
const SOUND_SOURCES = ["/sounds/analysis-complete.mp3", "/sounds/analysis-complete.wav"];

// ---------------------------------------------------------------------------
// Préférence persistée (switch)
// ---------------------------------------------------------------------------

export function getStoredNotifyPref(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(NOTIFY_PREF_KEY) === "1";
  } catch {
    return false;
  }
}

export function storeNotifyPref(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NOTIFY_PREF_KEY, enabled ? "1" : "0");
  } catch {
    /* stockage indisponible : on ignore, la session reste fonctionnelle */
  }
}

// ---------------------------------------------------------------------------
// Permission Notification API
// ---------------------------------------------------------------------------

export function getPermission(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/** Demande la permission seulement si elle est encore « default ». */
export async function requestPermission(): Promise<PermissionState> {
  const current = getPermission();
  if (current !== "default") return current; // granted / denied / unsupported : pas de re-demande
  try {
    return await Notification.requestPermission();
  } catch {
    return getPermission();
  }
}

// ---------------------------------------------------------------------------
// Notification système (au clic : focus de l'onglet du rapport)
// ---------------------------------------------------------------------------

export function notifyAnalysisComplete(): void {
  if (getPermission() !== "granted") return;

  const options: NotificationOptions = {
    body: NOTIF_BODY,
    icon: NOTIF_ICON,
    badge: NOTIF_ICON,
    tag: "unmask-analysis-complete",
  };

  try {
    const n = new Notification(NOTIF_TITLE, options);
    n.onclick = () => {
      try {
        window.focus();
      } catch {
        /* focus indisponible (mobile) : sans effet, non bloquant */
      }
      n.close();
    };
  } catch {
    // Certains contextes (Android/PWA) exigent le service worker pour notifier.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => reg.showNotification(NOTIF_TITLE, options))
        .catch(() => {
          /* pas de SW enregistré : on abandonne silencieusement */
        });
    }
  }
}

// ---------------------------------------------------------------------------
// Son de fin : fichier (mp3 → wav) puis repli Web Audio synthétisé
// ---------------------------------------------------------------------------

function playFile(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio(src);
      audio.volume = 0.45;
      audio
        .play()
        .then(() => resolve(true))
        .catch(() => resolve(false));
    } catch {
      resolve(false);
    }
  });
}

/** Repli garanti : petit carillon à deux notes via Web Audio (aucun asset). */
function playSynthChime(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = [
      { freq: 1318.5, start: 0, dur: 0.3 },
      { freq: 1760.0, start: 0.12, dur: 0.32 },
    ];
    for (const { freq, start, dur } of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t0 = now + start;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }
    // Libère le contexte une fois le son terminé.
    window.setTimeout(() => ctx.close().catch(() => {}), 700);
  } catch {
    /* Web Audio indisponible : pas de son, sans casser l'app */
  }
}

export async function playCompletionSound(): Promise<void> {
  for (const src of SOUND_SOURCES) {
    if (await playFile(src)) return;
  }
  playSynthChime();
}
