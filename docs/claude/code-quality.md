# Qualité de code

## KISS — Keep It Simple, Stupid
- Préférer la solution la plus simple qui fonctionne.
- Éviter l'abstraction prématurée (pas de factory/registry tant qu'il n'y a qu'un seul cas).
- Une fonction = une responsabilité.

## DRY — Don't Repeat Yourself
- Extraire les appels `httpx` répétés dans un helper partagé si plus de 2 services dupliquent le pattern.
- Centraliser les schémas Pydantic réutilisés (Source, Disclaimer, AuditResult).
- Ne jamais dupliquer la logique métier d'un pilier.

## SOLID
- **S** — Un service = une source. Pas de checker qui appelle deux API non liées.
- **O** — Ajouter une source ne doit pas modifier les autres, juste ajouter un router + un service. Un nouvel axe noté passe par `audit_scoring.py` (cf. architecture).
- **D** — Les services dépendent d'abstractions (`httpx.AsyncClient` injecté) plutôt que d'instances globales, pour faciliter les tests futurs.

## Clean Code (Python)
- Typage explicite partout (`def check(siren: str) -> LegalIdentityResult`).
- Pydantic pour toute donnée traversant une frontière (HTTP, API externe).
- Fonctions courtes (< 30 lignes). Si un checker dépasse, extraire des sous-fonctions privées `_parse_xxx`.
- Pas de `print` — utiliser `logging` (jamais de donnée perso loggée, cf. sécurité).
- Pas de code mort, pas de blocs commentés.
- Noms en français acceptés pour le domaine métier (`piliers`, `disclaimer`, `audit`), anglais pour la technique.

## Clean Code (TypeScript)
- `strict: true` dans `tsconfig.json` (déjà en place).
- Types explicites sur les props de composants et les retours d'API.
- Pas de `any`. Préférer `unknown` + narrowing.
- Composants courts — extraire dès qu'un composant dépasse ~150 lignes JSX.
