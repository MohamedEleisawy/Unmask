# Architecture

## Modèle de scoring : 3 critères pondérés

Le score global (0-100) est une moyenne pondérée des 3 critères calculables avec les inputs fournis. Les critères absents voient leurs poids redistribués proportionnellement (un audit avec seulement le critère 1 disponible donne un score basé à 100 % sur ce critère, signalé "partiel" dans l'UI).

| # | Critère | Poids | Service backend | Composant front |
|---|---|---|---|---|
| 1 | Identité légale vérifiable | 40 | `siren_checker` (data.gouv) | `LegalPillar` |
| 2 | Conformité AMF/ACPR | 35 | `amf_checker` (data.gouv CSV) | `CompliancePillar` |
| 3 | Analyse de discours & signaux publics | 25 | `discourse_analyzer` + `youtube_checker` + `osint_checker` (moyenne interne) | `DiscoursePillar` + sous-signaux `YoutubePillar` / `OsintPillar` |

Le service `partnership_checker` reste accessible via `/partnerships` et la feature `manual-analysis` mais ne contribue pas au score global.

## Structure

```
backend/
├── app/
│   ├── main.py              # Bootstrap FastAPI, CORS, inclusion des routers
│   ├── config.py            # Lecture des variables d'environnement
│   ├── api/                 # Routers FastAPI (1 fichier par sous-service)
│   │   ├── legal_identity.py     # Sous-service SIREN / data.gouv.fr
│   │   ├── compliance.py         # Sous-service AMF/ACPR
│   │   ├── discourse.py          # Sous-signal discours (Anthropic)
│   │   ├── youtube.py            # Sous-signal YouTube (engagement)
│   │   ├── osint.py              # Sous-signal OSINT (Serper/Google CSE)
│   │   ├── partnerships.py       # Analyse manuelle hors-score
│   │   └── full_audit.py         # Orchestrateur — calcule les 3 critères
│   └── services/            # Logique métier
│       ├── <service>_models.py   # Dataclasses + to_dict()
│       ├── <service>_checker.py  # Helpers + fonction principale
│       └── audit_scoring.py      # Pondération 40/35/25 + redistribution
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
│   │   ├── AuditDashboard.tsx    # ScoreHeader + 3 PillarCard + sous-signaux
│   │   ├── ScoreHeader.tsx       # En-tête score global + verdict
│   │   ├── PillarCard.tsx        # Wrapper de critère (titre, état, fallback)
│   │   └── pillars/              # 1 fichier par pilier (Legal, Compliance,
│   │                             #   Discourse, Youtube, Osint, Partnership)
│   └── manual-analysis/     # Feature "analyse de texte manuel" (hors-score)
│       ├── types.ts, api.ts
│       ├── ManualAnalysis.tsx
│       ├── ManualForm.tsx
│       ├── DiscourseCard.tsx
│       └── PartnershipCard.tsx
└── shared/
    ├── config.ts            # API_BASE_URL
    └── ui/                  # Atomes UI réutilisables (StatusBadge, ScoreBar…)
```

## Pattern Router → Service (backend)

**Règle stricte** : un sous-service = un router + un service.

- `api/<service>.py` — déclare les routes, valide les entrées via Pydantic, retourne la réponse. **Aucune logique métier.**
- `services/<service>_models.py` — dataclasses et `to_dict()` du service. Pas d'import réseau.
- `services/<service>_checker.py` — helpers + fonction principale. Appelle les API externes, applique les règles. **Pas d'import FastAPI.**

L'orchestrateur `full_audit.py` appelle les services en parallèle (`asyncio.gather`) — jamais les routers entre eux. La logique de pondération vit dans `services/audit_scoring.py` (fonction `compute_global_score` + dict `WEIGHTS`).

## Pattern Feature-First (frontend)

**Règle stricte** : chaque écran/fonctionnalité majeure = un dossier `features/<feature>/`.

- `features/<feature>/types.ts` — types TypeScript de la feature (réponses API, props).
- `features/<feature>/api.ts` — appels HTTP au backend pour cette feature uniquement.
- `features/<feature>/*.tsx` — composants spécifiques. Aucun composant > 160 lignes.
- `shared/ui/` — uniquement les atomes réutilisés par **plusieurs** features (StatusBadge, ScoreBar, etc.). Ne pas y mettre un composant spécifique à une feature.

Pas d'import croisé entre features (`features/audit` ne doit jamais importer `features/manual-analysis`). Les utilitaires partagés passent par `shared/`.

## Flux de données

1. Le frontend envoie une requête `/audit/full` via `features/audit/api.ts`.
2. `full_audit.py` valide le body Pydantic puis lance en parallèle uniquement les services dont les inputs requis sont présents.
3. Chaque service appelle son API externe (data.gouv.fr, YouTube, Anthropic, Serper) via `httpx` async.
4. `audit_scoring.compute_global_score` calcule la moyenne pondérée sur les critères disponibles.
5. La réponse contient `global_score`, `verdict`, `pillars` (sources vérifiables) et `disclaimer` juridique.
6. `AuditDashboard` affiche les 3 critères, indique "score partiel" si certains sont absents, et fournit un message contextuel précisant quel input ajouter.

## Sources de données

- **SIREN / statut juridique** : `api.recherche-entreprises.api.gouv.fr` (publique, sans clé)
- **Liste noire AMF/ACPR** : `data.gouv.fr/api/1/datasets/r/d2d9df6d-1cd2-41a8-96f5-684cb3057ecb` (CSV, mis à jour quotidiennement, cache mémoire 6h, fallback fichier local `backend/data/abeis-liste-noire.csv`)
- **Cohérence YouTube** : YouTube Data API v3 (clé requise)
- **Analyse de discours** : Anthropic Claude (clé requise)
- **Réputation OSINT** : Serper.dev ou Google Custom Search Engine (au choix)

## Règles de structure

- **Backend** : pas de logique métier dans `api/`, pas d'import FastAPI dans `services/`, pas d'I/O disque hors fichiers de référence (CSV AMF de fallback).
- **Frontend** : pas de fetch hors `features/*/api.ts`, pas de constante d'URL en dur (`shared/config.ts`).
- Toute nouvelle intégration externe = un nouveau service dédié (`<service>_checker.py` + `<service>_models.py`).
- Toute nouvelle feature UI = un nouveau dossier sous `features/`.
- Tout nouveau critère scoré = ajouter une entrée dans `WEIGHTS` (`audit_scoring.py`) et un bloc dans `CRITERIA` (`AuditDashboard.tsx`).
