"use client";

import { useEffect, useRef, useState } from "react";

export type StepState = "pending" | "active" | "done";

const AUTO_CEIL = 92; // plafond tant que l'analyse réelle n'est pas terminée
const TICK_MS = 80;

// Montée « logique » qui décélère : [ms écoulées, % cible].
const CURVE: [number, number][] = [
  [0, 0],
  [700, 15],
  [2000, 35],
  [4000, 58],
  [6500, 78],
  [9500, AUTO_CEIL],
];

function curveTarget(elapsed: number): number {
  const last = CURVE[CURVE.length - 1];
  if (elapsed >= last[0]) return last[1];
  for (let i = 1; i < CURVE.length; i++) {
    const [t1, p1] = CURVE[i];
    if (elapsed <= t1) {
      const [t0, p0] = CURVE[i - 1];
      const r = (elapsed - t0) / (t1 - t0);
      return p0 + (p1 - p0) * r;
    }
  }
  return last[1];
}

/** Dérive l'état visuel de chaque étape à partir du pourcentage courant. */
export function deriveStates(progress: number, n: number): StepState[] {
  const states: StepState[] = [];
  let activeAssigned = false;
  for (let i = 0; i < n; i++) {
    const end = ((i + 1) / n) * 100;
    const start = (i / n) * 100;
    if (progress >= end - 0.4) {
      states.push("done");
    } else if (!activeAssigned && progress >= start - 0.4) {
      states.push("active");
      activeAssigned = true;
    } else {
      states.push("pending");
    }
  }
  // Toujours montrer une étape « en cours » tant que tout n'est pas terminé.
  if (!activeAssigned && progress < 100 && n > 0) {
    const idx = states.findIndex((s) => s !== "done");
    if (idx >= 0) states[idx] = "active";
  }
  return states;
}

/**
 * Pilote une progression fluide 0→100. Tant que `finished` est faux, on monte
 * de façon logique vers AUTO_CEIL ; dès que l'analyse réelle est finie, on
 * accélère jusqu'à 100. La valeur est strictement monotone (ne recule jamais).
 */
export function useAnalysisProgress(stepCount: number, finished: boolean) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number | null>(null);
  const finishedRef = useRef(finished);

  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);

  useEffect(() => {
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - (startRef.current ?? Date.now());
      const target = finishedRef.current ? 100 : curveTarget(elapsed);
      setProgress((prev) => {
        if (prev >= target) return prev;
        const pull = finishedRef.current ? 0.18 : 0.08;
        const next = prev + (target - prev) * pull + 0.05;
        return next >= target ? target : next;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return {
    progress: Math.min(100, Math.round(progress)),
    states: deriveStates(progress, stepCount),
  };
}
