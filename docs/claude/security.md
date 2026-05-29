# Sécurité

## Secrets & environnement
- Ne jamais commiter de `.env`, clé API, token ou credentials. `.env` doit rester dans `.gitignore`.
- Toutes les clés (Anthropic, YouTube, Google CSE, Serper) passent par les variables d'environnement, lues via `app/config.py`.
- Jamais de clé en dur dans le code, même pour un test local rapide.
- Vérifier l'absence de secret dans le diff avant tout commit.

## CORS
- En dev : `allow_origins=["http://localhost:3000"]` (état actuel).
- En prod : restreindre à l'origine front réelle. **Jamais `"*"` en production.**
- `allow_methods` limité à ce qui est utilisé (`POST`, `GET`), pas de wildcard.

## Validation des entrées
- Toute entrée HTTP est validée par un schéma Pydantic — pas d'accès direct à `request.json()`.
- Whitelist plutôt que blacklist (champs autorisés explicitement).
- Tronquer/limiter la taille des inputs (texte d'analyse manuelle, URL, identifiants).

## RGPD — zero-storage
- Aucune donnée personnelle stockée sur disque, en base, ou dans un cache persistant.
- Traitement en mémoire vive uniquement, libération immédiate après réponse.
- Les logs ne doivent jamais contenir : email, IP, nom, contenu utilisateur brut. Logger uniquement des compteurs et codes d'erreur.

## CGU des plateformes externes
- API officielles exclusivement (data.gouv.fr, YouTube Data API v3, Google CSE, Anthropic).
- **Aucun scraping** de page web, même publique. Si une donnée n'est pas exposée par une API, elle n'entre pas dans l'audit.
- Respecter le principe **"No proof, no point"** : aucun score sans source publique vérifiable retournée dans la réponse.

## Quotas & rate-limiting des API externes
- Toutes les APIs intégrées ont des quotas (YouTube 10 000 unités/jour, Serper 2 500 req/mois gratuits, etc.).
- Ajouter un cache mémoire (TTL court, ex. `cachetools.TTLCache`) avant tout nouvel appel externe coûteux.
- Logger l'épuisement de quota (sans la clé) pour pouvoir réagir.
- Côté `httpx.AsyncClient` : toujours définir un `timeout` explicite (jamais l'infini par défaut).

## Données sensibles dans les réponses
- Ne jamais renvoyer la clé API ou la valeur brute d'une variable d'environnement, même en cas d'erreur.
- Les messages d'erreur 500 renvoyés au front doivent être génériques. Le détail va dans les logs serveur.

## Dépendances
- Pas d'ajout de package sans vérifier sa provenance et sa maintenance.
- Privilégier la stdlib + les libs déjà présentes (`httpx`, `pydantic`, `fastapi`) avant d'introduire une nouvelle dépendance.
