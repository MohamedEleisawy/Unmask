# Architecture

## Structure

```
backend/
├── app/
│   ├── main.py              # Bootstrap FastAPI, CORS, inclusion des routers
│   ├── config.py            # Lecture des variables d'environnement
│   ├── api/                 # Routers FastAPI (1 fichier par pilier)
│   │   ├── legal_identity.py     # Pilier 1 — SIREN / data.gouv.fr
│   │   ├── partnerships.py       # Pilier 2 — mentions partenariats (loi 2023)
│   │   ├── discourse.py          # Pilier 3 — analyse LLM
│   │   ├── youtube.py            # Pilier 4 — métriques YouTube
│   │   ├── osint.py              # Pilier 5 — OSINT externe
│   │   ├── compliance.py         # Pilier 6 — AMF / ACPR
│   │   └── full_audit.py         # Orchestrateur des 6 piliers
│   └── services/            # Logique métier
│       ├── <pilier>_models.py    # Dataclasses + to_dict() pour chaque pilier
│       ├── <pilier>_checker.py   # Helpers + fonction principale du pilier
│       └── audit_scoring.py      # Calcul du score global + verdict (registre)
└── requirements.txt

frontend/
├── app/
│   ├── layout.tsx
│   └── page.tsx             # Compose les features, gère le mode audit/manual
├── features/
│   ├── audit/               # Feature "audit d'entité"
│   │   ├── types.ts              # AuditResponse, PillarData, Verdict
│   │   ├── api.ts                # fetchFullAudit
│   │   ├── AuditForm.tsx         # Formulaire omnibox + champs avancés
│   │   ├── AuditDashboard.tsx    # Compose ScoreHeader + 6 PillarCard
│   │   ├── ScoreHeader.tsx       # En-tête score global + verdict
│   │   ├── PillarCard.tsx        # Wrapper d'un pilier (titre, état)
│   │   └── pillars/              # 1 fichier par pilier (Legal, Partnership, …)
│   └── manual-analysis/     # Feature "analyse de texte manuel"
│       ├── types.ts, api.ts
│       ├── ManualAnalysis.tsx    # Composition (form + résultats)
│       ├── ManualForm.tsx
│       ├── DiscourseCard.tsx
│       └── PartnershipCard.tsx
└── shared/
    ├── config.ts            # API_BASE_URL
    └── ui/                  # Atomes UI réutilisables (StatusBadge, ScoreBar…)
```

## Pattern Router → Service (backend)

**Règle stricte** : un pilier = un router + un service.

- `api/<pilier>.py` — déclare les routes, valide les entrées via Pydantic, retourne la réponse. **Aucune logique métier.**
- `services/<pilier>_models.py` — dataclasses et `to_dict()` du pilier. Pas d'import réseau.
- `services/<pilier>_checker.py` — helpers + fonction principale. Appelle les API externes, applique les règles. **Pas d'import FastAPI.**

L'orchestrateur `full_audit.py` appelle les services en parallèle (`asyncio.gather`) — jamais les routers entre eux. La logique de scoring vit dans `services/audit_scoring.py` (registre `{pilier: extracteur_de_score}`).

## Pattern Feature-First (frontend)

**Règle stricte** : chaque écran/fonctionnalité majeure = un dossier `features/<feature>/`.

- `features/<feature>/types.ts` — types TypeScript de la feature (réponses API, props).
- `features/<feature>/api.ts` — appels HTTP au backend pour cette feature uniquement.
- `features/<feature>/*.tsx` — composants spécifiques. Aucun composant > 160 lignes.
- `shared/ui/` — uniquement les atomes réutilisés par **plusieurs** features (StatusBadge, ScoreBar, etc.). Ne pas y mettre un composant spécifique à une feature.

Pas d'import croisé entre features (`features/audit` ne doit jamais importer `features/manual-analysis`). Les utilitaires partagés passent par `shared/`.

## Flux de données

1. Le frontend envoie une requête à un router (`/audit/...`) via une fonction de `features/<feature>/api.ts`.
2. Le router valide via Pydantic et délègue au service.
3. Le service appelle l'API externe officielle (data.gouv.fr, YouTube, Anthropic, etc.) via `httpx` async.
4. Le service retourne un résultat structuré incluant les **sources** (URL vérifiables).
5. Le router renvoie la réponse + un champ `disclaimer` juridique.

## Règles de structure

- **Backend** : pas de logique métier dans `api/`, pas d'import FastAPI dans `services/`, pas d'I/O disque hors fichiers de référence (CSV AMF).
- **Frontend** : pas de fetch hors `features/*/api.ts`, pas de constante d'URL en dur (`shared/config.ts`).
- Toute nouvelle intégration externe = un nouveau service dédié (`<pilier>_checker.py` + `<pilier>_models.py`).
- Toute nouvelle feature UI = un nouveau dossier sous `features/`.
