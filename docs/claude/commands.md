# Commandes

## Backend (FastAPI)

Depuis `backend/` :

- `python -m venv .venv` puis activation (`.venv\Scripts\Activate.ps1` sur Windows, `source .venv/bin/activate` sinon)
- `pip install -r requirements.txt` — installer les dépendances Python
- `cp .env.example .env` (ou `copy` sous Windows) — créer le `.env` local, puis renseigner les clés
- `python -m uvicorn app.main:app --reload` — démarrer l'API en dev (http://localhost:8000)
- `python -m compileall app` — check syntaxe rapide
- `http://localhost:8000/docs` — documentation OpenAPI auto-générée
- `http://localhost:8000/health` — santé + clés chargées (booléens, jamais les valeurs)

## Frontend (Next.js 16)

Depuis `frontend/` :

- `npm install` — installer les dépendances
- `npm run dev` — démarrer Next en dev (http://localhost:3000)
- `npm run build` — build de production
- `npm run start` — servir le build de production
- `npm run lint` — ESLint
- `npx tsc --noEmit` — check TypeScript strict

> **Tests :** aucune suite automatisée pour l'instant — `compileall` (back) et `tsc --noEmit` (front) sont les garde-fous.

## Variables d'environnement

### Backend — `backend/.env` (voir `.env.example`)

- `ANTHROPIC_API_KEY` — **réputation presse** (Claude + `web_search`) : l'axe noté. Absente → score neutre 50, fallback OSINT.
- `YOUTUBE_API_KEY` — cohérence d'engagement YouTube (descriptif).
- `SERPER_API_KEY` **ou** `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_ID` — recherche Google (présence sociale + OSINT).
- `ALLOWED_ORIGINS` — origines CORS (CSV). Dev `*`, **prod URL front exacte**.
- `AMF_CACHE_TTL_SECONDS` — TTL cache liste noire AMF (défaut `21600` = 6h).

Les sources data.gouv (SIREN, AMF/ACPR) ne nécessitent **aucune clé**.

### Frontend — variable de build

- `NEXT_PUBLIC_API_URL` — URL du backend, lue au **build** (`shared/config.ts`). Défaut dev `http://localhost:8000`. En prod (Vercel) : la définir dans *Project Settings → Environment Variables* et rebuild.
</content>
