# Unmask

PWA d'audit de crédibilité factuel pour influenceurs et marques. Six piliers vérifiés via des sources publiques officielles (data.gouv.fr, AMF, YouTube Data API, Anthropic). Zéro stockage de données personnelles — conforme RGPD.

## Stack

- **Backend** : Python 3.11+, FastAPI, httpx async
- **Frontend** : Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript

## Prérequis

- Python 3.11+
- Node.js 20+ (npm)
- Les clés API listées dans `backend/.env.example` (toutes optionnelles — chaque pilier se désactive proprement si sa clé manque)

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

### Données AMF (pilier 6)

Télécharger `abeis-liste-noire.csv` depuis [abe-infoservice.fr/liste-noire](https://www.abe-infoservice.fr/liste-noire) et le placer dans `backend/data/`.

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

| Variable | Pilier | Obtenir |
|---|---|---|
| `ANTHROPIC_API_KEY` | 3 — Analyse de discours | [console.anthropic.com](https://console.anthropic.com) |
| `YOUTUBE_API_KEY` | 4 — Engagement YouTube | [console.cloud.google.com](https://console.cloud.google.com) (activer YouTube Data API v3) |
| `SERPER_API_KEY` *ou* `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_ID` | 5 — OSINT | [serper.dev](https://serper.dev) (recommandé, 2500 req/mois gratuits) |

Les piliers 1, 2 et 6 fonctionnent sans clé (data.gouv.fr public, analyse regex locale, CSV AMF local).

## Structure

```
backend/app/
  api/         # Routers FastAPI (1 fichier par pilier)
  services/    # Logique métier : <pilier>_models.py + <pilier>_checker.py

frontend/
  app/         # Next.js App Router (page, layout, globals.css)
  features/    # Code par feature (audit/, manual-analysis/)
  shared/ui/   # Atomes réutilisables (StatusBadge, ScoreBar, icons…)
```

Détails dans [`docs/claude/architecture.md`](docs/claude/architecture.md).

## Commandes utiles

```bash
# Backend
uvicorn app.main:app --reload          # dev avec hot-reload
python -m compileall app                # check syntaxe

# Frontend
npm run dev                             # dev (http://localhost:3000)
npm run build                           # build production
npm run lint                            # ESLint
npx tsc --noEmit                        # check TypeScript
```

## Conventions

Commits en français, format type `feat:` / `fix:` / `refactor:` / `chore:` / `docs:`. Une responsabilité par commit. Ne jamais pusher sans accord, ne jamais commiter `.env`.

Détails dans [`docs/claude/conventions.md`](docs/claude/conventions.md) et [`CLAUDE.md`](CLAUDE.md).

## Engagement

Aucun verdict définitif n'est émis. Toutes les sources sont publiques et tracables. Aucune donnée personnelle stockée — traitement en mémoire vive uniquement.
