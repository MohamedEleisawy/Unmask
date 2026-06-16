# Unmask — Frontend

Frontend Next.js 16 (App Router, Turbopack, React 19, Tailwind CSS v4, TypeScript strict) de la PWA Unmask. Consomme l'API FastAPI (`backend/`).

> Onboarding complet, architecture et modèle de scoring : voir le [`README.md`](../README.md) racine et [`CLAUDE.md`](../CLAUDE.md).

## Démarrage

```bash
npm install
npm run dev        # http://localhost:3000
```

Le backend doit tourner en parallèle (par défaut `http://localhost:8000`). L'URL est lue via `NEXT_PUBLIC_API_URL` (cf. ci-dessous).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de dev (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Servir le build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Check TypeScript strict |

## Variable d'environnement

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL du backend, lue au **build** (`shared/config.ts`). Défaut dev `http://localhost:8000`. En prod (Vercel) : la définir dans les *Environment Variables* — un changement exige un **rebuild**. |

## Structure

```
app/
  page.tsx          # "/" — landing marketing
  audit/page.tsx    # "/audit?q=..." — flux preview → confirm → audit
  layout.tsx
features/           # 1 dossier par fonctionnalité (pas d'import croisé)
  audit/            #   types.ts, api.ts, flux d'audit, pillars/, generatePdf.ts
  landing/          #   sections de la landing
  manual-analysis/  #   analyse de texte (hors-score)
  pwa/              #   ServiceWorkerRegister
shared/
  config.ts         # API_BASE_URL — seule source d'URL backend
  ThemeToggle.tsx
  ui/               # atomes réutilisés (StatusBadge, ScoreBar, Spinner…)
public/
  manifest.json     # PWA (installable, thème, icônes)
  icons/            # icônes PWA (72 → 512, maskable)
```

## Conventions front

- **Feature-first** : chaque écran majeur = un dossier `features/<feature>/`. Les fetchs vivent uniquement dans `features/*/api.ts`. Aucune URL backend en dur (utiliser `shared/config.ts`).
- **TypeScript strict** : pas de `any` (`unknown` + narrowing), types explicites sur props et retours d'API.
- Composants courts (< ~150 lignes JSX). `shared/ui/` réservé aux atomes utilisés par **plusieurs** features.
- **A11y / thème** : WCAG AA, thème dark (défaut)/light/auto, l'état d'un verdict ne repose jamais sur la couleur seule (icône + texte). Cf. [`PRODUCT.md`](../PRODUCT.md) et [`DESIGN.md`](../DESIGN.md).

## PWA

Application installable + mode offline via `public/manifest.json` et le service worker (`features/pwa/ServiceWorkerRegister.tsx`). Le `theme_color`/`background_color` du manifest doivent rester cohérents avec les tokens design.

## Déploiement

Cible **Vercel** (racine `frontend/`). Définir `NEXT_PUBLIC_API_URL` = URL du backend (Render) puis déployer. Voir [`README.md`](../README.md) §9.
</content>
