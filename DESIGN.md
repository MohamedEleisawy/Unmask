---
name: Unmask
description: PWA d'audit de crédibilité — le dossier de vérification, lisible et sourcé.
colors:
  brand-violet: "#936bff"
  brand-violet-deep: "#7d54f0"
  verdict-good: "#34d399"
  verdict-good-dim: "#2a6f57"
  verdict-warn: "#f5b454"
  verdict-bad: "#fb7185"
  brand-coral: "#f84b5f"
  brand-mint: "#0cdda5"
  brand-amber: "#fec530"
  bg: "#101010"
  surface: "#141414"
  inset: "#1a1a1a"
  border: "#1e1e1e"
  border-strong: "#2a2a2a"
  ink: "#eeeeee"
  ink-muted: "#8a8a8a"
  ink-faint: "#8a8a8a"
  ink-dim: "#808080"
  ink-line: "#3a3a3a"
  bg-light: "#f8f8f8"
  surface-light: "#ffffff"
  border-light: "#e6e6e6"
  ink-light: "#1f1f1f"
typography:
  display:
    fontFamily: "Quatty, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Satoshi, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Satoshi, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Satoshi, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.2em"
  metric:
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace"
    fontSize: "clamp(3.5rem, 9vw, 6rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.04em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "32px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "32px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand-violet}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.brand-violet-deep}"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  card-aside:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  badge-status-ok:
    textColor: "{colors.verdict-good}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
---

# Design System: Unmask

## 1. Overview

**Creative North Star: "Le Dossier de Vérification"**

Unmask se présente comme un rapport d'enquête : sobre, lisible, documentaire. La crédibilité ne vient pas d'effets visuels mais de la retenue — fonds neutres profonds, métriques en monospace tabulaire, accent rare et placé. L'interface se lit comme un dossier que l'on parcourt du verdict (en haut, en grand) vers les preuves (en bas, qui se déplient). Chaque chiffre porte sa source ; le design met la preuve à portée de clic, jamais le jugement en avant.

Le système est **dark par défaut, lifté** : les surfaces ne sont pas en noir pur mais empilées en tons (`#101010` → `#141414` → `#1a1a1a`), séparées par des bordures d'un cheveu. Un mode clair miroir existe, basculable, et tient les mêmes contrastes. La densité est calme : beaucoup d'air, des règles fines plutôt que des cartes empilées, une grille tabulaire pour les piliers d'audit.

Ce système **rejette explicitement** : le scam-checker anxiogène (rouge d'alarme, badges « DANGER », ton complotiste) — le rouge ici sert un verdict, jamais la peur ; le SaaS générique crème/violet (dégradés pastel, eyebrows trackées partout, gradient text) — le violet est un accent ciblé, pas un wash ; l'outil financier froid navy/gold ; le dashboard surchargé de KPI cards et de gauges qui noient le verdict.

**Key Characteristics:**
- Dark-first lifté, profondeur par empilement tonal (pas d'ombres portées).
- Métriques en monospace tabulaire — le chiffre est un fait, pas un ornement.
- Deux rôles d'accent distincts : violet = marque, vert = verdict positif.
- Hiérarchie verdict-d'abord : le score crie sobrement, les preuves chuchotent.
- État jamais encodé par la couleur seule (icône + texte toujours présents).

## 2. Colors

Une base de neutres profonds et silencieux, ponctuée d'un accent de marque violet et d'une échelle de verdict (vert / ambre / corail) qui n'apparaît que pour qualifier un état.

### Primary
- **Violet Vérification** (`#936bff`) : l'accent de **marque**. CTA principaux (« Lancer l'audit », « Vérifier ce profil »), logo, numérotation des piliers, focus des champs. C'est la signature d'Unmask, pas un signal d'état. Hover plus profond : **Violet Profond** (`#7d54f0`).

### Secondary — l'échelle de verdict
Couleurs réservées à la **qualification d'un état**, jamais décoratives. **Theme-aware** :
vives sur fond sombre, assombries sur fond clair pour tenir l'AA (4.5:1). Pilotées par
`--verdict-good / -warn / -bad` (+ `--verdict-*-on` = texte/icône posé sur la couleur).
- **Vert Fiable** (dark `#0cdda5` / light `#0a805f`) : verdict positif, score ≥ 70, statut « vérifié / conforme ». En clair, le vert vif (`#0cdda5`) tombe à 1.76:1 — illisible — d'où la variante assombrie.
- **Ambre Suspect** (dark `#f5b454` / light `#9c620d`) : verdict intermédiaire, score 40–69, « à creuser ».
- **Corail Alerte** (dark `#f84b5f` / light `#d6293f`) : verdict négatif, score < 40, signaux d'alerte. Le corail marque aussi le titre de la landing (display, seuil large-text) ; sa charge émotionnelle est tenue en laisse — il qualifie, il n'alarme pas.

### Tertiary
- **Menthe** (`#0cdda5`) : accent d'appoint sur les visuels de marque (badges du hero « SIREN vérifié »). Reste dans l'univers « bon », sans porter de score.

### Neutral
Deux jeux miroir (dark défaut / light), pilotés par `--au-*` et basculés par `[data-theme]`.
- **Encre** (`#eeeeee` dark / `#1f1f1f` light) : texte principal.
- **Encre Atténuée** (`#8a8a8a` / `#5a5a5a`) : texte secondaire, sous-titres.
- **Encre Faible** (`#8a8a8a` / `#6a6a6a`) : small print, preuves, légendes — **lisible** (porte du contenu, ≥ 5:1).
- **Encre Sourde** (`#808080` / `#767676`) : labels discrets, placeholders, eyebrows — **lisible** (≥ 4.5:1 sur surface).
- **Encre Ligne** (`#3a3a3a` / `#b0b0b0`) : décor non-textuel UNIQUEMENT (séparateurs). Jamais de texte dessus.
- **Fond / Surface / Inset** (`#101010` / `#141414` / `#1a1a1a` dark) : les trois plans d'empilement.
- **Bordure / Bordure Forte** (`#1e1e1e` / `#2a2a2a`) : séparateurs d'un cheveu.

### Named Rules
**La Règle des Deux Rôles.** Le violet est de la **marque** ; le vert/ambre/corail est du **verdict**. On ne colore jamais un CTA en vert « parce que c'est positif », ni un score en violet. Mélanger les deux registres brouille le seul message qui compte : l'état de l'entité auditée.

**La Règle du Verdict Doublé.** Une couleur de verdict ne porte **jamais** l'information seule. Toujours accompagnée d'une icône (✓ / ✗) et d'un texte (« Fiable », « Alerte »). Bénéfique pour le daltonisme, exigé par l'accessibilité.

## 3. Typography

**Display Font:** Quatty (fallback ui-sans-serif, system-ui)
**Body Font:** Satoshi (fallback ui-sans-serif, system-ui)
**Metric/Mono Font:** Geist Mono (fallback ui-monospace)

**Character:** Une géométrie nette (Quatty en titres) posée sur une grotesque contemporaine et chaleureuse (Satoshi en corps). Le contraste se joue sur l'usage, pas sur deux sans-serifs concurrentes : Quatty ne sort que pour les grands titres ; Satoshi porte tout le reste. Le monospace (Geist Mono) est réservé aux chiffres — il signale « ceci est une donnée mesurée ».

### Hierarchy
- **Display** (Quatty, 700, `clamp(2rem, 5vw, 3.25rem)`, lh 1.1, tracking -0.02em) : titres de page (« Audit de crédibilité », « Un feed ne dit pas tout »).
- **Headline** (Satoshi, 500, ~1.5rem, lh 1.1) : titres de section dans le rapport.
- **Title** (Satoshi, 500, 0.875rem, tracking -0.02em) : titres de pilier.
- **Body** (Satoshi, 400, 1rem, lh 1.625) : prose, descriptions. Longueur de ligne plafonnée à 40–42ch sur les paragraphes d'intro, 65–75ch ailleurs.
- **Label** (Satoshi, 500, 0.625rem, tracking 0.2em, MAJUSCULES) : sur-titres de section (« SCORE GLOBAL DE CRÉDIBILITÉ », « CE QU'UNMASK VÉRIFIE »).
- **Metric** (Geist Mono, 500, `clamp(3.5rem, 9vw, 6rem)`, lh 1, tracking -0.04em, tabular-nums) : le score global. La classe `.num` applique `font-variant-numeric: tabular-nums` à tous les chiffres.

### Named Rules
**La Règle du Chiffre Mono.** Tout nombre qui est une **mesure** (score, ratio, SIREN, /100) est en Geist Mono tabulaire. Les chiffres en prose courante restent en Satoshi. Le monospace est le marqueur visuel du fait.

**La Règle d'une Voix Display.** Quatty est rare : grands titres uniquement. Si Quatty apparaît à la taille du corps, c'est une erreur — Satoshi prend le relais dès qu'on descend sous le titre.

## 4. Elevation

Système **plat, profondeur par tons.** Aucune ombre portée structurelle. La hiérarchie de plans naît de l'**empilement tonal** : le fond (`#101010`) porte des surfaces (`#141414`) qui portent des insets (`#1a1a1a`), chaque palier séparé par une bordure d'un cheveu (`#1e1e1e`). Le mode clair inverse l'échelle (fond gris clair, surfaces blanches) avec la même logique.

### Shadow Vocabulary
Le seul effet de profondeur est **décoratif et unique** :
- **Glow de marque** (`bg-[#936bff]/10 blur-3xl`) : un halo violet flouté derrière le visuel du hero. Ambiant, jamais structurel.
- **Ring de verdict** (`box-shadow: 0 0 0 4px {couleur}1f`) : un halo de 4px à ~12% d'opacité autour du point d'état. C'est un **signal**, pas une ombre — il colore l'état, il n'élève pas la surface.

### Named Rules
**La Règle du Plat par Défaut.** Les surfaces sont plates au repos. Aucune `box-shadow` portée sur les cartes, listes ou champs. Si une carte a besoin d'une ombre pour se détacher, c'est que l'empilement tonal n'a pas été utilisé — corriger le ton, pas ajouter d'ombre.

## 5. Components

### Buttons
- **Shape:** coins arrondis généreux (`rounded-xl` = 12px) sur les CTA de formulaire ; pleine pilule (`rounded-[32px]`) sur la landing.
- **Primary:** fond Violet Vérification (`#936bff`), texte blanc, padding `14px 24px`, `font-semibold`. Pleine largeur dans les formulaires.
- **Hover / Focus:** fond → Violet Profond (`#7d54f0`) ; `active:scale-[0.98]` pour le retour tactile. Transition `all`.
- **Disabled:** `opacity-40`, curseur interdit. État de chargement : trois points qui rebondissent + libellé « Audit en cours... ».
- **Icon button (ThemeToggle):** carré 36px, `rounded-lg`, fond inset, icône 16px ; `active:scale-95`.

### Cards / Containers
- **Corner Style:** `rounded-2xl` (16px) pour les asides, `rounded-xl` (12px) pour les champs.
- **Background:** Surface (`var(--au-surface)`).
- **Shadow Strategy:** aucune — voir Élévation (plat, bordures fines).
- **Border:** 1px Bordure (`var(--au-border)`).
- **Internal Padding:** 24px (`p-6`).
- **Règle:** pas de cartes imbriquées. Les piliers d'audit sont des **lignes d'une grille tabulaire**, pas des cartes empilées.

### Inputs / Fields
- **Style:** fond Surface, bordure Bordure Forte (`var(--au-border-strong)`), `rounded-xl`, padding `14px 16px`, icône de recherche en tête.
- **Focus:** la bordure passe au Violet Vérification à 60% (`focus-within:border-[#936bff]/60`). Pas de glow.
- **Placeholder:** Encre Sourde (`--au-text-dim`) — attention contraste, voir Don'ts.
- **Champs secondaires (`FieldBox`):** label en MAJUSCULES trackées 0.2em, Encre Sourde, au-dessus du champ.

### Navigation
- **Style:** header à plat, fond = fond de page, bordure basse d'un cheveu. Logo SVG à gauche (l'encre suit `--au-text`, l'accent du « k » est violet), ThemeToggle à droite.
- **Typographie:** liens en Satoshi, Encre Atténuée par défaut, Encre au survol.

### Verdict Score Header (signature)
Le composant pivot. Le score en **Geist Mono géant** (`text-7xl`/`8xl`, tabular) coloré par le verdict, accolé à « /100 » en Encre Faible. À gauche : sur-titre label MAJUSCULES, nom de l'entité, et la pastille d'état (point coloré + ring 4px + libellé). Tout converge vers la lisibilité immédiate du verdict.

### Status Badge (signature)
Pilule `rounded-md`, bordure + fond teinté à ~10–15% de la couleur d'état, texte MAJUSCULES tracké, **icône ✓/✗ obligatoire**. Vert (`accent` + `accent-dim`) si ok, Corail si fail. Incarne la Règle du Verdict Doublé.

## 6. Do's and Don'ts

### Do:
- **Do** réserver le **violet `#936bff`** aux éléments de marque (CTA, nav, focus, numérotation) et l'échelle **vert/ambre/corail** au verdict. Deux rôles, jamais croisés.
- **Do** rendre tout chiffre-mesure en **Geist Mono tabulaire** via `.num` (score, /100, SIREN, ratios).
- **Do** doubler chaque couleur de verdict d'une **icône + un texte** (✓ « Fiable », ✗ « Alerte »).
- **Do** créer la profondeur par **empilement tonal** (`#101010` → `#141414` → `#1a1a1a`) et des bordures d'1px, jamais par une ombre portée.
- **Do** plafonner les paragraphes d'intro à **40–42ch**, la prose à 65–75ch.
- **Do** vérifier le contraste **AA** en dark **et** en light, placeholders compris.
- **Do** afficher honnêtement un **« score partiel »** quand un input manque, en précisant lequel ajouter.

### Don't:
- **Don't** virer au **scam-checker anxiogène** : pas de rouge d'alarme pleine surface, pas de badge « DANGER », pas de ton complotiste. Le corail qualifie un verdict, il n'alarme pas.
- **Don't** retomber dans le **SaaS générique crème/violet** : pas de dégradés pastel, pas d'**eyebrow MAJUSCULE trackée au-dessus de chaque section**, pas de grilles de cartes identiques, pas de **gradient text** (`background-clip: text`).
- **Don't** virer à l'**outil financier froid navy/gold** ni au **dashboard surchargé** de KPI cards et de gauges colorées qui noient le verdict.
- **Don't** colorer un CTA en vert « parce que positif » ni un score en violet — ça casse la Règle des Deux Rôles.
- **Don't** ajouter de **`box-shadow` portée** sur cartes, listes ou champs. Si ça « manque de relief », corriger le ton de surface.
- **Don't** poser du texte sur Encre Ligne (`--au-text-line` `#3a3a3a`/`#b0b0b0`) — c'est un ton de décor (séparateurs), pas un ton de texte. Pour du texte discret, utiliser Encre Sourde (`--au-text-dim`), qui tient l'AA.
- **Don't** coder un verdict positif avec le vert vif (`#0cdda5`) en mode clair : il tombe à 1.76:1. Toujours passer par `--verdict-good` (assombri en clair).
- **Don't** sortir **Quatty** à la taille du corps. Display = grands titres uniquement.
- **Don't** imbriquer des cartes. Les piliers sont une grille tabulaire de lignes, pas des cartes dans des cartes.
