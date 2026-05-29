# Commandes

## Backend (FastAPI)

Depuis `backend/` :

- `pip install -r requirements.txt` — installer les dépendances Python
- `cp .env.example .env` — créer le fichier d'environnement local, puis renseigner les clés
- `python -m uvicorn app.main:app --reload` — démarrer l'API en dev (http://localhost:8000)
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

Voir `backend/.env.example`. Toutes les clés alimentent les sous-signaux du **critère 3** (analyse de discours & signaux publics) :

- `ANTHROPIC_API_KEY` — analyse de discours via Claude
- `YOUTUBE_API_KEY` — cohérence d'engagement YouTube
- `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_ID` **ou** `SERPER_API_KEY` — réputation OSINT

Les critères 1 (SIREN) et 2 (AMF/ACPR) n'exigent aucune clé : ils tapent directement les APIs publiques de data.gouv.fr.
