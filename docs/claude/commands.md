# Commandes

## Backend (FastAPI)

Depuis `backend/` :

- `pip install -r requirements.txt` — installer les dépendances Python
- `cp .env.example .env` — créer le fichier d'environnement local, puis renseigner les clés
- `uvicorn app.main:app --reload` — démarrer l'API en dev (http://localhost:8000)
- `http://localhost:8000/docs` — documentation OpenAPI auto-générée
- `http://localhost:8000/health` — endpoint de santé

## Frontend (Next.js 16)

Depuis `frontend/` :

- `npm install` — installer les dépendances
- `npm run dev` — démarrer Next en dev (http://localhost:3000)
- `npm run build` — build de production
- `npm run start` — lancer le build de production
- `npm run lint` — ESLint

## Variables d'environnement

Voir `backend/.env.example`. Clés requises :

- `ANTHROPIC_API_KEY` — Pilier 3 (analyse de discours)
- `YOUTUBE_API_KEY` — Pilier 4 (cohérence d'engagement)
- `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_ID` **ou** `SERPER_API_KEY` — Pilier 5 (OSINT)
