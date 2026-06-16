# Architecture

## Modèle de scoring : « risque réel »

> **L'ancien barème « 3 critères pondérés 40/35/25 » n'existe plus.** Référence unique et faisant foi : [`backend/app/services/audit_scoring.py`](../../backend/app/services/audit_scoring.py).

Principe : **on ne note QUE ce qui qualifie la fiabilité réelle.** La notoriété (SIREN, présence sociale, identité numérique) ne dit rien sur l'honnêteté — un escroc qui réussit est souvent plus visible. Ces signaux sont **affichés** (cartes piliers, timeline) mais **hors score**.

| Élément | Service backend | Rôle |
|---|---|---|
| **Réputation publique** | `reputation_analyzer` (Claude `claude-haiku-4-5` + `web_search`) | **Seul axe noté** (0-100) |
| Liste noire AMF/ACPR | `amf_checker` | Drapeau **critique** → cap **20** + verdict `alerte` |
| Condamnation judiciaire | (déduit de `reputation.event_breakdown`) | Drapeau **critique** → cap **20** |
| ≥ 2 sociétés radiées | `siren_checker` | **Warning** → cap **50** (interdit le vert) |
| Identité légale, réseaux, Wikipédia, YouTube | `siren_checker`, `social_presence_checker`, `handle_resolver`, `youtube_checker` | **Descriptifs**, hors score |
| Âge du domaine | `domain_intelligence` (RDAP) | **Informatif**, ajouté après le calcul |

Réputation non évaluable (empreinte mince ou clé absente) → **50 neutre « à vérifier »** (`NEUTRAL_SCORE`), jamais 100. Caps : `CRITICAL_CAP = 20`, `WARNING_CAP = 50`. Verdicts : `verifie` ≥ 70, `partiellement_verifie` ≥ 40, sinon `peu_verifiable` ; tout drapeau critique force `alerte`.

Fonctions clés de `audit_scoring.py` : `compute_global_score`, `compute_alerts` + `apply_alert_cap`, `compute_breakdown`, `compute_coverage`, `verdict_from_score`.

## Structure

```
backend/app/
├── main.py              # Bootstrap FastAPI, CORS, montage des routers, /, /health
├── config.py            # Variables d'environnement (clés API, ALLOWED_ORIGINS, TTL)
├── api/                 # Routers — 1 fichier par endpoint. AUCUNE logique métier.
│   ├── full_audit.py        # Orchestrateur : POST /audit/preview et /audit/full
│   ├── legal_identity.py    # POST /audit/legal-identity (SIREN, data.gouv)
│   ├── compliance.py        # POST /audit/compliance (AMF/ACPR)
│   ├── discourse.py         # POST /audit/discourse (analyse de texte — manual)
│   ├── youtube.py           # POST /audit/youtube
│   ├── osint.py             # POST /audit/osint
│   ├── partnerships.py      # POST /audit/partnerships (loi 2023 — manual)
│   └── social_presence.py   # POST /audit/social-presence
└── services/            # Logique métier — <service>_checker/_analyzer.py + _models.py
    ├── reputation_analyzer.py   # AXE NOTÉ — réputation presse (Claude + web_search)
    ├── audit_scoring.py         # Score, caps, alertes, verdict, coverage
    ├── audit_report.py          # build_audit_trail + build_timeline
    ├── siren_checker.py         # Identité légale + radiations
    ├── amf_checker.py           # Liste noire AMF/ACPR (CSV, cache TTL)
    ├── domain_intelligence.py   # Âge domaine (RDAP) — informatif
    ├── handle_resolver.py       # Résolution identité (Wikipédia/Wikidata)
    ├── social_presence_checker.py  # Profils sociaux (Google site:)
    ├── youtube_checker.py  osint_checker.py  discourse_analyzer.py
    ├── name_corrector.py        # Correction/normalisation de nom
    └── _search_backend.py       # Client de recherche partagé (Serper / Google CSE)

frontend/
├── app/
│   ├── page.tsx             # "/" — landing marketing
│   ├── audit/page.tsx       # "/audit?q=..." — flux preview → confirm → audit
│   └── layout.tsx
├── features/
│   ├── audit/               # Flux d'audit
│   │   ├── types.ts api.ts AuditSearchForm.tsx AuditForm.tsx
│   │   ├── ProfileConfirm.tsx AnalysisProgress.tsx useAnalysisProgress.ts
│   │   ├── AuditResults.tsx AlertEvidence.tsx generatePdf.ts
│   │   └── pillars/         # Legal, Compliance, Discourse, Youtube, Osint,
│   │                        #   Reputation, SocialPresence, Partnership
│   ├── landing/             # Hero, FeaturesGrid, HowItWorks, CTA, Navbar, Footer
│   ├── manual-analysis/     # Analyse de texte (discours/partenariats, hors-score)
│   └── pwa/                 # ServiceWorkerRegister
└── shared/
    ├── config.ts            # API_BASE_URL (NEXT_PUBLIC_API_URL)
    ├── ThemeToggle.tsx
    └── ui/                  # Atomes réutilisables (StatusBadge, ScoreBar, Spinner…)
```

## Pattern Router → Service (backend)

**Règle stricte** : une source = un router + un service.

- `api/<service>.py` — routes, validation Pydantic, réponse. **Aucune logique métier, aucun appel réseau.**
- `services/<service>_models.py` — dataclasses + `to_dict()`. Pas d'import réseau.
- `services/<service>_checker.py` (ou `_analyzer.py`) — helpers + fonction principale, appels externes (`httpx` async, timeout explicite). **Pas d'import FastAPI.**

`full_audit.py` orchestre via `asyncio.gather` — uniquement les services dont les inputs requis sont présents, jamais en appelant les autres routers. Score/caps/verdict dans `audit_scoring.py`.

## Pattern Feature-First (frontend)

**Règle stricte** : chaque écran/fonctionnalité majeure = un dossier `features/<feature>/`.

- `types.ts` (types de la feature), `api.ts` (**seuls fetchs autorisés**), `*.tsx` (composants < ~150 lignes).
- `shared/ui/` — uniquement les atomes réutilisés par **plusieurs** features.
- **Aucun import croisé entre features.** Les utilitaires partagés passent par `shared/`.

## Flux de données (audit complet)

1. **Étape 1 — `POST /audit/preview`** : résolution d'identité rapide (Wikipédia/Wikidata + présence sociale), **sans IA coûteuse**, pour confirmer « est-ce bien cette personne ? » et éviter les faux positifs.
2. L'utilisateur confirme (`ProfileConfirm`).
3. **Étape 2 — `POST /audit/full`** : `_build_async_tasks` ne lance que les services dont les inputs sont présents → `asyncio.gather`.
4. Chaque service appelle son API externe via `httpx` async. Un service sans clé/input renvoie `available: false` sans bloquer les autres.
5. `audit_scoring` calcule score (réputation), `compute_alerts`/`apply_alert_cap` (caps réglementaires), `verdict_from_score`, `compute_coverage`. `audit_report` produit `audit_trail` + `timeline`.
6. Les alertes domaine (RDAP) sont ajoutées **après** le score/verdict (purement informatif).
7. Réponse : `global_score`, `verdict`, `score_breakdown`, `alerts`, `coverage`, `audit_trail`, `timeline`, `domain_intelligence`, `pillars`, `disclaimer`.
8. `AuditResults` affiche l'anneau de score, les cartes (pillars/), la timeline, et permet l'export PDF (`generatePdf.ts`).

## Sources de données

- **SIREN / statut juridique / radiations** : Annuaire des Entreprises `recherche-entreprises.api.gouv.fr` (publique, sans clé)
- **Liste noire AMF/ACPR** : CSV data.gouv (dataset `d2d9df6d-1cd2-41a8-96f5-684cb3057ecb`, cache TTL `AMF_CACHE_TTL_SECONDS`, fallback `backend/data/abeis-liste-noire.csv`)
- **Réputation presse** : Anthropic Claude + outil serveur `web_search` (clé requise)
- **Présence sociale / OSINT** : Serper.dev ou Google CSE (`_search_backend.py`)
- **Identité** : Wikipédia / Wikidata (`handle_resolver`)
- **Âge du domaine** : RDAP (`domain_intelligence`)
- **YouTube** : YouTube Data API v3 (clé requise)

## Règles de structure

- **Backend** : pas de logique métier dans `api/`, pas d'import FastAPI dans `services/`, pas d'I/O disque hors fichiers de référence (CSV AMF fallback).
- **Frontend** : pas de fetch hors `features/*/api.ts`, pas d'URL en dur (`shared/config.ts`).
- Toute nouvelle source externe = un nouveau service dédié. Toute nouvelle feature UI = un nouveau dossier `features/`.
- Tout **nouvel axe noté** = passer par `audit_scoring.py` (ne pas réintroduire de pondération « piliers »).
</content>
