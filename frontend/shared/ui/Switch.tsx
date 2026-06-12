"use client";

/**
 * Interrupteur accessible (role=switch). Bouton natif → clavier (Entrée/Espace)
 * et focus gérés sans JS. Gauche = off, droite = on. Couleur de marque à l'état actif.
 */
type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
  /** Couleur de l'état actif (défaut : vert de marque). */
  activeColor?: string;
};

export function Switch({ checked, onChange, ariaLabel, disabled = false, activeColor = "#0cdda5" }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: checked ? activeColor : "var(--au-border-strong)",
        outlineColor: activeColor,
      }}
    >
      <span
        className="inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: checked ? "translateX(22px)" : "translateX(4px)" }}
      />
    </button>
  );
}
