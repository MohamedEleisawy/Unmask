/**
 * Couleurs de verdict — theme-aware via variables CSS (globals.css).
 * Le code applique ces var() au lieu de hex en dur, pour que le signal
 * positif/négatif reste lisible (≥ 4.5:1) en clair comme en sombre.
 *
 * `*On` = couleur de texte/icône à poser SUR la couleur de verdict.
 */
export const VERDICT = {
  good: "var(--verdict-good)",
  goodOn: "var(--verdict-good-on)",
  warn: "var(--verdict-warn)",
  warnOn: "var(--verdict-warn-on)",
  bad: "var(--verdict-bad)",
  badOn: "var(--verdict-bad-on)",
} as const;

/** Couleur d'un score 0-100 selon les seuils du barème (≥70 bon, ≥40 moyen). */
export function scoreColor(score: number): string {
  return score >= 70 ? VERDICT.good : score >= 40 ? VERDICT.warn : VERDICT.bad;
}

/** Wash de fond léger (~10-12 %) d'une couleur de verdict, pour les pastilles. */
export function verdictWash(color: string): string {
  return `color-mix(in srgb, ${color} 12%, transparent)`;
}
