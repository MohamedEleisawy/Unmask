# Conventions

## Commits

- **Langue : français.**
- Format type Conventional Commits :
  - `feat: ajoute le pilier 6 AMF`
  - `fix: corrige le parsing SIREN à 9 chiffres`
  - `chore: met à jour les dépendances backend`
  - `refactor: extrait le client httpx partagé`
  - `docs: met à jour la doc d'architecture`
- Une seule responsabilité par commit. Pas de commit fourre-tout.
- Message au présent, impératif, sans point final.

## Git rules

- **Ne jamais pusher sans accord explicite** de l'utilisateur.
- **Ne jamais pusher du code non testé/non vérifié fonctionnel.**
- **Ne jamais utiliser `--force`** sur `main` / `master` sans accord explicite.
- **Ne jamais commiter de fichiers sensibles** (`.env`, credentials, clés API, dumps).
- Préférer créer une nouvelle branche pour toute modification non triviale.
- Préférer un nouveau commit plutôt que `--amend` sur un commit déjà poussé.

## Branches

- `main` — branche stable, déployable.
- `feat/<sujet>` — nouvelle fonctionnalité.
- `fix/<sujet>` — correction.
- `cleanup/<sujet>` — refactor / restructuration sans changement fonctionnel.

## Règle disclaimer juridique

Cohérent avec le principe de neutralité d'Unmask : **toute route d'audit doit retourner un champ `disclaimer`** rappelant qu'il s'agit d'un éclairage factuel sourcé, non d'un verdict. Ajouter un schéma Pydantic partagé pour ce champ plutôt que de le dupliquer.
