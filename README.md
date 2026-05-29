# Unmask
<<<<<<< HEAD
=======

PWA d'audit de crédibilité factuel pour influenceurs et marques. Trois critères pondérés vérifiés via des sources publiques officielles (data.gouv.fr, AMF/ACPR, YouTube Data API, Anthropic). Zéro stockage de données personnelles — conforme RGPD.

## Stack

- **Backend** : Python 3.11+, FastAPI, httpx async
- **Frontend** : Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript

## Les 3 critères

| # | Critère | Poids | Source |
|---|---|---|---|
| 1 | Identité légale vérifiable (SIREN actif, statut juridique) | 40 pts | Annuaire des Entreprises — `recherche-entreprises.api.gouv.fr` |
| 2 | Conformité AMF/ACPR (absence de la liste noire) | 35 pts | data.gouv.fr — dataset `d2d9df6d-1cd2-41a8-96f5-684cb3057ecb` |
| 3 | Analyse de discours & signaux publics | 25 pts | Anthropic Claude + YouTube Data API + Serper/Google CSE (OSINT) |

Le critère 3 est une moyenne interne de 3 sous-signaux (discours LLM, cohérence YouTube, réputation OSINT). Les poids des critères absents sont redistribués proportionnellement sur les critères présents — un input partiel donne un score partiel signalé dans l'UI.

Les anciens piliers `partnerships` (loi 2023) restent accessibles via `/audit/manual` et la feature `manual-analysis` du front, mais ne pèsent plus dans le score global.

## Prérequis

- Python 3.11+
- Node.js 20+ (npm)
- Clés API listées dans `backend/.env.example` (toutes optionnelles — chaque sous-signal se désactive proprement si sa clé manque)

## Installation

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
cp .env.example .env            # puis remplir les clés API
```

### Frontend

```bash
cd frontend
npm install
```

### Données AMF

Aucune action manuelle requise : le service `amf_checker` télécharge le CSV officiel depuis data.gouv.fr (URL stable, cache mémoire 6h) au premier appel. Un fichier `backend/data/abeis-liste-noire.csv` peut être présent comme fallback hors-ligne.

## Lancement (dev)

Deux terminaux en parallèle :

```bash
# Terminal 1 — backend (http://localhost:8000)
cd backend
python -m uvicorn app.main:app --reload

# Terminal 2 — frontend (http://localhost:3000)
cd frontend
npm run dev
```

Docs API auto-générées : http://localhost:8000/docs

## Variables d'environnement

Toutes dans `backend/.env` (voir `.env.example`) :

| Variable | Sous-signal du critère 3 | Obtenir |
|---|---|---|
| `ANTHROPIC_API_KEY` | Analyse de discours | [console.anthropic.com](https://console.anthropic.com) |
| `YOUTUBE_API_KEY` | Cohérence YouTube | [console.cloud.google.com](https://console.cloud.google.com) (activer YouTube Data API v3) |
| `SERPER_API_KEY` *ou* `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_ID` | Réputation OSINT | [serper.dev](https://serper.dev) (recommandé, 2500 req/mois gratuits) |

Les critères 1 et 2 fonctionnent sans clé (API data.gouv.fr publique).

## Structure

```
backend/app/
  api/         # Routers FastAPI (1 fichier par sous-service)
  services/    # Logique métier : <service>_models.py + <service>_checker.py
               # audit_scoring.py pondère les 3 critères

frontend/
  app/         # Next.js App Router (page, layout, globals.css)
  features/    # Code par feature (audit/, manual-analysis/)
  shared/ui/   # Atomes réutilisables (StatusBadge, ScoreBar, icons…)
```

Détails dans [`docs/claude/architecture.md`](docs/claude/architecture.md).

## Commandes utiles

```bash
# Backend
python -m uvicorn app.main:app --reload   # dev avec hot-reload
python -m compileall app                  # check syntaxe

# Frontend
npm run dev                               # dev (http://localhost:3000)
npm run build                             # build production
npm run lint                              # ESLint
npx tsc --noEmit                          # check TypeScript
```

## Conventions

Commits en français, format type `feat:` / `fix:` / `refactor:` / `chore:` / `docs:`. Une responsabilité par commit. Ne jamais pusher sans accord, ne jamais commiter `.env`.

Détails dans [`docs/claude/conventions.md`](docs/claude/conventions.md) et [`CLAUDE.md`](CLAUDE.md).

## Engagement

Aucun verdict définitif n'est émis. Toutes les sources sont publiques et traçables. Aucune donnée personnelle stockée — traitement en mémoire vive uniquement.
>>>>>>> cleanup/structure
