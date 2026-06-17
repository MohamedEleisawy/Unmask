# CLAUDE.md

Guide de référence pour tout développeur ou assistant IA travaillant sur **Unmask**.

---

## Contexte métier

Unmask — **PWA d'audit de crédibilité factuel** pour influenceurs, entrepreneurs et marques. On agrège des **sources publiques officielles vérifiables** (data.gouv.fr, AMF, presse via Claude+web_search, YouTube, RDAP) en un **score 0-100 + verdict + timeline + preuves cliquables**. **Zero-storage RGPD** : traitement en mémoire vive, rien sur disque/base. Principe « No proof, no point » : aucun score sans source publique retournée. Stack : **FastAPI + Next.js 16**.

Deux publics, un même outil : particuliers prudents (avant un achat) et marques/agences (due diligence). Voir [`PRODUCT.md`](PRODUCT.md) et [`DESIGN.md`](DESIGN.md).

## ⚠️ Modèle de scoring — à connaître AVANT de toucher au score

Le modèle a évolué vers un modèle **« risque réel »**. **L'ancien barème « 3 critères 40/35/25 » et toute mention de « 6 piliers » sont OBSOLÈTES.** Référence unique : [`backend/app/services/audit_scoring.py`](backend/app/services/audit_scoring.py).

- **Seul axe noté** : la **réputation publique** (0-100), produite par `reputation_analyzer.py` (Claude `claude-haiku-4-5` + outil serveur `web_search`).
- **Couche réglementaire = drapeaux qui plafonnent, jamais de points positifs** :
  - liste noire AMF ou condamnation judiciaire → **critique**, cap **20**, verdict `alerte` ;
  - ≥ 2 sociétés radiées (même dirigeant) → **warning**, cap **50** (interdit le vert).
- **SIREN / réseaux / Wikipédia = descriptifs**, jamais notés (la notoriété ne prouve pas l'honnêteté).
- **Réputation non évaluable** (empreinte trop mince ou clé absente) → **50 neutre « à vérifier »**, pas 100.
- **Âge du domaine (RDAP)** = informatif, ajouté *après* le calcul du score/verdict, sans impact.

## Architecture technique

**Backend — pattern Router → Service (strict)** :
- `api/<service>.py` : déclare les routes, valide via Pydantic, retourne. **Aucune logique métier, aucun appel réseau direct.**
- `services/<service>_models.py` : dataclasses + `to_dict()`. Pas d'import réseau.
- `services/<service>_checker.py` (ou `_analyzer.py`) : appels API externes (`httpx` async, timeout explicite), règles métier. **Pas d'import FastAPI.**
- `api/full_audit.py` orchestre : lance en parallèle (`asyncio.gather`) **uniquement** les services dont les inputs requis sont présents, jamais en appelant les autres routers. Pondération/caps/alertes/verdict centralisés dans `audit_scoring.py` ; `audit_report.py` produit `audit_trail` + `timeline`.

**Frontend — feature-first (strict)** :
- `features/<feature>/` = `types.ts` + `api.ts` (seuls fetchs autorisés) + `*.tsx`. **Aucun import croisé entre features.**
- `shared/ui/` = atomes réutilisés par **plusieurs** features uniquement. `shared/config.ts` = `API_BASE_URL` (jamais d'URL en dur).
- Flux d'audit en **2 étapes** (`app/audit/page.tsx`) : `POST /audit/preview` (résolution d'identité rapide, sans IA coûteuse) → confirmation utilisateur (`ProfileConfirm`) → `POST /audit/full`.

## Conventions de développement

- **Commits en français**, Conventional Commits (`feat:`/`fix:`/`refactor:`/`chore:`/`docs:`), une responsabilité par commit, impératif présent sans point final.
- **Python** : typage explicite partout, Pydantic à chaque frontière, fonctions < 30 lignes, `logging` (jamais `print`, jamais de donnée perso loggée), pas de code mort. Domaine métier en français accepté (`disclaimer`, `audit`), technique en anglais.
- **TypeScript** : `strict: true`, pas de `any` (préférer `unknown` + narrowing), composants < ~150 lignes JSX, types explicites sur props et retours d'API.
- **Disclaimer obligatoire** : toute route d'audit retourne un champ `disclaimer` (éclairage factuel sourcé, pas un verdict).

## Règles AVANT de modifier du code

1. **Score / verdict** → lire `audit_scoring.py`, ne pas réintroduire de pondération « piliers ». Tout nouvel axe noté passe par ce fichier.
2. **Nouvelle intégration externe** → un nouveau service dédié (`<service>_checker.py` + `_models.py`), jamais greffé sur un service existant (un service = une source). L'ajouter à l'orchestrateur si pertinent.
3. **Nouvelle feature UI** → un nouveau dossier `features/<feature>/`, pas de fetch hors `api.ts`, pas d'URL en dur.
4. **Secrets** → toujours via `app/config.py` / variables d'env. Jamais de clé en dur, jamais committer `.env`, vérifier le diff avant commit.
5. **CORS** → jamais `*` en prod ; piloté par `ALLOWED_ORIGINS`.
6. **Git** → ne jamais pusher sans accord explicite, jamais `--force` sur `main`, préférer une branche `feat/`/`fix/`/`cleanup/`.

## Commandes & workflows

```bash
# Backend (backend/)
python -m uvicorn app.main:app --reload   # dev — http://localhost:8000  (docs /docs, santé /health)
python -m compileall app                  # check syntaxe

# Frontend (frontend/)
npm run dev        # http://localhost:3000
npm run build      # build prod
npm run lint       # ESLint
npx tsc --noEmit   # check TS strict
```

Aucune suite de tests automatisés (cf. README §11) — `compileall` + `tsc --noEmit` sont les garde-fous.

## Pièges connus & bonnes pratiques

- **Docs périmées** : ignorer toute mention « 6 piliers »/« 40/35/25 » ; `audit_scoring.py` fait foi.
- **Secrets dans les logs** : `httpx`/`httpcore` sont volontairement remontés à `WARNING` dans `main.py` car ils loggaient les clés en query string. Ne pas rétablir leur niveau INFO.
- **`ANTHROPIC_API_KEY` absente** = pilier réputation muet → score neutre 50 (pas une erreur). C'est `available: false`, pas un crash : tout service sans clé/input se désactive proprement sans bloquer les autres.
- **Quotas** : YouTube 10 000 u/j, Serper 2 500 req/mois, `_MAX_SEARCHES = 5` web_search/audit. Ajouter un cache TTL avant tout nouvel appel coûteux.
- **`NEXT_PUBLIC_API_URL` lue au build** : changer cette valeur exige un rebuild Vercel.
- **Routes legacy** (`/audit/discourse`, `/audit/osint`, `/audit/partnerships`) servent `manual-analysis`, hors `/audit/full`.

## Sections de référence

- [Commandes](docs/claude/commands.md) · [Architecture](docs/claude/architecture.md) · [Qualité de code](docs/claude/code-quality.md) · [Sécurité](docs/claude/security.md) · [Conventions](docs/claude/conventions.md)
- Onboarding complet : [`README.md`](README.md)
</content>
