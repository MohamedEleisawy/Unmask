# Unmask

**PWA d'audit de crédibilité factuel** pour influenceurs, entrepreneurs et marques. Unmask agrège des **sources publiques officielles et vérifiables** (data.gouv.fr, AMF/ACPR, presse via Claude + web_search, YouTube, RDAP) pour produire un **score 0-100**, un **verdict**, une **timeline** et des **preuves cliquables**. Aucune donnée personnelle stockée — traitement en mémoire vive, conforme RGPD.

> **Pas de verdict définitif.** Unmask montre les faits et leurs sources ; il ne dit pas qui croire. Chaque affirmation porte une source publique vérifiable (« No proof, no point »).

---

## 1. Présentation & objectifs

Deux publics partagent le même outil (`/audit`) :

- **Particuliers prudents** — « Cet influenceur est-il légitime, ou vais-je me faire avoir avant d'acheter sa formation ? »
- **Marques & agences** — due diligence légère avant un partenariat (identité légale, AMF/ACPR, réputation).

Une **landing marketing** (`/`) sert de porte d'entrée. Détails produit/marque dans [`PRODUCT.md`](PRODUCT.md) et [`DESIGN.md`](DESIGN.md).

## 2. Stack technique

| Couche | Techno | Version |
|---|---|---|
| Backend | Python + FastAPI + httpx (async) | Python **3.11+**, FastAPI ≥ 0.115 |
| IA | Anthropic Claude (`claude-haiku-4-5`) + outil serveur `web_search` | anthropic ≥ 0.105 |
| Frontend | Next.js (App Router, Turbopack) + React + Tailwind CSS v4 + TypeScript | Next **16.2.6**, React **19**, Node **20+** |
| PDF | jspdf (génération du rapport téléchargeable, côté client) | jspdf 4 |
| Déploiement (cible) | Backend → Render ; Frontend → Vercel | — |

## 3. Modèle de scoring — « risque réel » (⚠️ lire avant de toucher au score)

> **Important :** le modèle a évolué. L'ancien barème « 3 critères pondérés 40/35/25 » **n'existe plus**. Toute doc ou commentaire mentionnant des poids 40/35/25 est obsolète. La référence fait foi : [`backend/app/services/audit_scoring.py`](backend/app/services/audit_scoring.py).

Le principe : **on ne note QUE ce qui qualifie la fiabilité réelle d'une entité.** La notoriété (SIREN actif, présence sociale, identité numérique) ne dit rien sur l'honnêteté — un escroc qui réussit est souvent *plus* visible. Ces signaux sont donc **affichés** (cartes, timeline) mais **ne pèsent pas** dans le score.

| Élément | Rôle dans le score |
|---|---|
| **Réputation publique** (presse, plaintes, enquêtes, condamnations) | **Seul axe noté** — 0 à 100 |
| Liste noire **AMF/ACPR** | Drapeau **critique** → plafonne le score à **20** + verdict « alerte » |
| **Condamnation judiciaire** avérée | Drapeau **critique** → plafonne à **20** |
| ≥ 2 sociétés **radiées/fermées** (même dirigeant) | **Warning** → plafonne à **50** (interdit le vert) |
| SIREN, statut juridique, réseaux sociaux, Wikipédia | **Descriptifs uniquement**, hors score |
| Âge du domaine (RDAP) | **Informatif** — ajouté *après* le calcul, n'affecte ni score ni verdict |

Cas « inconnu » : si la réputation n'est pas évaluable (empreinte publique trop mince ou analyse indisponible), le score n'est **pas** 100 mais **50 (neutre, « à vérifier »)** — « on n'a rien trouvé » n'est pas « vérifié ».

**Verdicts :** `verifie` (≥ 70) · `partiellement_verifie` (≥ 40) · `peu_verifiable` (< 40) · `alerte` (forcé par tout drapeau critique).

## 4. Architecture & organisation des dossiers

```
backend/app/
  main.py            # Bootstrap FastAPI, CORS, montage des routers, /health
  config.py          # Lecture des variables d'environnement (clés API, CORS, TTL)
  api/               # Routers FastAPI — 1 fichier par endpoint. AUCUNE logique métier.
    full_audit.py    #   Orchestrateur : POST /audit/preview et /audit/full
    legal_identity.py compliance.py discourse.py youtube.py osint.py
    partnerships.py  social_presence.py
  services/          # Logique métier — <service>_checker.py + <service>_models.py
    reputation_analyzer.py   # Réputation presse (Claude + web_search) — AXE NOTÉ
    audit_scoring.py         # Score, caps réglementaires, alertes, verdict, coverage
    audit_report.py          # build_audit_trail + build_timeline
    siren_checker.py         # Identité légale (Annuaire des Entreprises)
    amf_checker.py           # Liste noire AMF/ACPR (CSV data.gouv, cache 6h)
    domain_intelligence.py   # Âge du domaine via RDAP (informatif)
    handle_resolver.py       # Résolution d'identité (Wikipédia/Wikidata)
    social_presence_checker.py  # Profils sociaux (Google site:)
    youtube_checker.py  osint_checker.py  discourse_analyzer.py
    name_corrector.py  reputation_analyzer.py  _search_backend.py (Serper/CSE partagé)

frontend/
  app/               # Next.js App Router
    page.tsx         #   "/" — landing marketing
    audit/page.tsx   #   "/audit?q=..." — flux d'audit en 2 étapes
    layout.tsx
  features/          # Code par fonctionnalité (jamais d'import croisé entre features)
    audit/           #   Formulaire, flux preview→confirm→audit, résultats, pillars/, PDF
    landing/         #   Sections de la landing (Hero, FeaturesGrid, HowItWorks, CTA…)
    manual-analysis/ #   Analyse de texte manuel (discours/partenariats, hors-score)
    pwa/             #   ServiceWorkerRegister
  shared/            # config.ts (API_BASE_URL), ThemeToggle, ui/ (atomes réutilisés)
  public/            # manifest.json (PWA), icons/, service worker
```

Patterns détaillés dans [`docs/claude/architecture.md`](docs/claude/architecture.md).

## 5. Prérequis

- **Python 3.11+**
- **Node.js 20+** (npm)
- **Clés API** (voir §7) — toutes optionnelles : chaque sous-signal se désactive proprement (`available: false`) si sa clé manque. Les critères data.gouv (SIREN, AMF/ACPR) fonctionnent **sans clé**.
- Aucune base de données (zero-storage par conception).

## 6. Installation & lancement

### Backend (`http://localhost:8000`)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1      # PowerShell (Windows)
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
copy .env.example .env          # puis renseigner les clés API
python -m uvicorn app.main:app --reload
```

Docs OpenAPI : `http://localhost:8000/docs` · Santé : `http://localhost:8000/health` (renvoie les clés *chargées*, sous forme de booléens).

### Frontend (`http://localhost:3000`)

```bash
cd frontend
npm install
npm run dev
```

> Les deux services tournent en parallèle dans **deux terminaux**. Le front lit le backend via `NEXT_PUBLIC_API_URL` (défaut `http://localhost:8000`).

### Données AMF — aucune action manuelle

Le service `amf_checker` télécharge le CSV officiel depuis data.gouv.fr (cache mémoire 6h, TTL configurable) au premier appel. Un fichier `backend/data/abeis-liste-noire.csv` peut servir de fallback hors-ligne. **Le dossier `backend/data/` est gitignoré.**

## 7. Variables d'environnement

### Backend — `backend/.env` (voir [`backend/.env.example`](backend/.env.example))

| Variable | Rôle | Sans elle |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Réputation presse** (Claude + web_search) — l'axe noté | Score retombe au neutre (50) ; fallback OSINT Serper |
| `YOUTUBE_API_KEY` | Cohérence d'engagement YouTube (descriptif) | Carte YouTube indisponible |
| `SERPER_API_KEY` | Recherche Google (OSINT + présence sociale). Gratuit 2500 req/mois ([serper.dev](https://serper.dev)) | Réseaux sociaux/OSINT indisponibles |
| `GOOGLE_CSE_API_KEY` + `GOOGLE_CSE_ID` | Alternative à Serper (Google Custom Search) | — |
| `ALLOWED_ORIGINS` | Origines CORS (CSV). Dev : `*`. **Prod : URL front exacte, jamais `*`** | Défaut `*` |
| `AMF_CACHE_TTL_SECONDS` | TTL du cache liste noire AMF (défaut `21600` = 6h) | 6h |

### Frontend — variable de build (Vercel)

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL publique du backend. Lue au **build** (`shared/config.ts`). Défaut dev : `http://localhost:8000`. En prod : URL Render du backend. |

## 8. Commandes utiles

```bash
# Backend (depuis backend/)
python -m uvicorn app.main:app --reload    # dev avec hot-reload
python -m compileall app                    # check syntaxe rapide

# Frontend (depuis frontend/)
npm run dev                                 # dev
npm run build                               # build production
npm run start                               # servir le build
npm run lint                                # ESLint
npx tsc --noEmit                            # check TypeScript strict
```

> **Tests :** aucune suite de tests automatisés n'est encore présente (cf. §11). `python -m compileall` et `tsc --noEmit` sont les garde-fous actuels.

## 9. Déploiement

**Cible :** Backend sur **Render**, Frontend sur **Vercel** (aucun fichier `render.yaml`/`vercel.json` versionné — configuration faite dans les dashboards).

- **Backend (Render)** : Web Service Python. Start command type `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Renseigner toutes les clés API + `ALLOWED_ORIGINS=<url-vercel-front>`. Render ping `/` (géré, pas de 404). Diagnostic post-deploy via `/health`.
- **Frontend (Vercel)** : projet Next.js, racine `frontend/`. Définir `NEXT_PUBLIC_API_URL=<url-render-backend>` dans *Environment Variables*. La PWA (`manifest.json` + service worker) est servie statiquement.

> **À compléter :** procédure CI/CD si elle existe, domaines de prod réels, configuration exacte du service worker (offline). Non déductibles du dépôt à ce jour.

## 10. Dépendances importantes & justification

**Backend** — `fastapi`/`uvicorn` (API async), `httpx` (client HTTP async, timeouts explicites), `pydantic` (validation à chaque frontière), `anthropic` (réputation presse via `web_search` — son absence faisait échouer *silencieusement* le pilier réputation en prod, d'où sa présence en dépendance ferme), `python-dotenv` (chargement `.env` en local, no-op en prod).

**Frontend** — `next`/`react` (App Router, RSC, Turbopack), `tailwindcss` v4 (styles + tokens design), `jspdf` (rapport PDF généré côté client, cohérent avec le zero-storage).

## 11. Points d'attention, limitations & dette technique

- **Doc historiquement désynchronisée du score** : tout texte mentionnant « 6 piliers » ou « poids 40/35/25 » est périmé — `audit_scoring.py` fait foi (§3).
- **Aucun test automatisé** : pas de pytest/jest. Vérification manuelle + `compileall`/`tsc`. → améliorer.
- **Quotas API externes** : YouTube 10 000 unités/jour, Serper 2 500 req/mois, coût Anthropic (`_MAX_SEARCHES = 5` web_search/audit). Pas de rate-limiting applicatif ni de cache au-delà du CSV AMF. → ajouter un cache TTL avant tout nouvel appel coûteux.
- **CORS** : `*` par défaut, à restreindre impérativement en prod.
- **Routes individuelles legacy** (`/audit/discourse`, `/audit/osint`, `/audit/partnerships`…) : restent exposées et servent la feature `manual-analysis`, mais ne pèsent pas dans `/audit/full`.
- **Déploiement non versionné** : config Render/Vercel hors dépôt (cf. §9 « À compléter »).

## 12. Maintenance & dépannage courant

| Symptôme | Piste |
|---|---|
| Réputation toujours « indisponible » / score bloqué à 50 | `ANTHROPIC_API_KEY` absente ou invalide → vérifier `/health` |
| Réseaux sociaux / OSINT vides | Ni `SERPER_API_KEY` ni couple CSE configurés → logs de démarrage |
| Erreur CORS dans le navigateur | `ALLOWED_ORIGINS` ne contient pas l'URL du front |
| Front appelle `localhost:8000` en prod | `NEXT_PUBLIC_API_URL` non défini **au moment du build** Vercel |
| AMF retourne vide | data.gouv injoignable → fallback `backend/data/abeis-liste-noire.csv` ; vérifier le cache (TTL) |
| Diagnostic général déploiement | Ouvrir `/health` : `keys` liste les clés chargées (booléens, jamais les valeurs) |

Au démarrage, le backend logue quelles clés sont chargées et l'origine CORS active. Les logs `httpx`/`httpcore` sont remontés à `WARNING` pour **ne jamais écrire de secret** (clé en query string) dans les logs.

## 13. Conventions

Commits **en français**, Conventional Commits (`feat:` / `fix:` / `refactor:` / `chore:` / `docs:`), une responsabilité par commit, impératif présent sans point final. **Ne jamais pusher sans accord, ne jamais commiter `.env`, jamais `--force` sur `main`.** Toute route d'audit retourne un champ `disclaimer`.

Détails : [`docs/claude/conventions.md`](docs/claude/conventions.md), [`docs/claude/code-quality.md`](docs/claude/code-quality.md), [`docs/claude/security.md`](docs/claude/security.md), [`CLAUDE.md`](CLAUDE.md).
</content>
</invoke>
