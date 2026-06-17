---
title: Contenu — Page Résultat · Unmask
type: livrable
station: 3-4 — Hypothesis Board / MVP Build Zone
created: 2026-05-25
updated: 2026-05-26
statut: v3 — recentrée sur ce qui est techniquement faisable
tags: [lean-startup, unmask, product]
---

# Contenu — Page Résultat · Unmask

**Périmètre réaliste :** seules 3 vérifications sont fiables sans violer les CGU des plateformes. Le score reflète ces 3 piliers uniquement.

**Inputs acceptés (au choix ou combinés) :**

| Input | Ce que ça débloque |
|---|---|
| Prénom + nom | Recherche large mais ambiguë (homonymes) — sert surtout au critère 3 (discours via mentions publiques) |
| Nom commercial / société | Critère 1 (SIREN, BODACC) fiable |
| SIREN direct | Critère 1 fiable immédiat |
| URL de site web | Critère 2 (liste noire AMF) fiable |
| URL / handle chaîne YouTube | Critère 3 fiable (analyse discours sur descriptions + métadonnées via YouTube API) |
| Handle Instagram / TikTok | Affiché en carte d'identité, mais pas de score fiable dessus (CGU bloquent le scraping) |

Plus l'utilisateur fournit d'inputs, plus le score est complet. Un seul "prénom nom" donne un score partiel avec mention explicite.

---

## Structure d'affichage

1. Alerte prioritaire (conditionnelle)
2. Score + verdict
3. Carte d'identité (données brutes)
4. Détail des 3 critères
5. Disclaimer légal

---

## 1 · Alerte prioritaire

Affichée avant tout si déclenchée.

| Condition | Message |
|---|---|
| Site/société sur liste noire AMF | ⚠️ Référencé sur la liste noire officielle · Score plafonné à 10/100 |
| Procédure collective (BODACC) | ⚠️ Procédure collective en cours · Score plafonné à 40/100 |

---

## 2 · Score

| Champ | Détail |
|---|---|
| Score | X / 100 |
| Catégorie | VERT 80–100 · ORANGE 50–79 · ROUGE 0–49 |
| Phrase | ≤ 20 mots, langage naturel |
| Date | JJ/MM/AAAA |

---

## 3 · Carte d'identité

Données brutes. "Non trouvé" si absent.

| Champ | Source |
|---|---|
| Nom / pseudo / société | Input utilisateur |
| SIREN + statut juridique | annuaire-entreprises.data.gouv.fr (si nom commercial ou SIREN fourni) |
| Site web | Input ou bio |
| Chaîne YouTube + abonnés + ancienneté | YouTube Data API (si chaîne fournie) |
| Handles Insta / TikTok | Input utilisateur (affichage uniquement, pas de score) |

---

## 4 · Les 3 critères

| # | Critère | Poids | Type | Source |
|---|---|---|---|---|
| 1 | Identité légale vérifiable (SIREN actif, pas en procédure collective) | 40 pts | Factuel | Annuaire Entreprises + BODACC |
| 2 | Absence sur liste noire AMF | 35 pts | Factuel | ABE Infoservice (recherche par site web ou raison sociale) |
| 3 | Analyse de discours — promesses de gains, vocabulaire à risque | 25 pts | Interprétatif | LLM Claude sur : descriptions YouTube si chaîne fournie · mentions publiques (Google CSE / Serper) si nom seul · bio site si URL |

**Règles :**
- Critère 1 désactivé si pas de nom commercial → 40 pts redistribués sur 2 et 3
- Critère 2 désactivé si secteur ≠ finance/crypto/formation → 35 pts redistribués
- Critère 3 affiché avec mention "(interprétation)"
- "Aucune donnée trouvée" distinct visuellement d'un 0 pt pour non-conformité

---

## Limites assumées (à afficher dans une FAQ)

Non couvert volontairement :
- Transparence #ad sur Instagram / TikTok → scraping interdit par CGU
- Cohérence d'engagement Insta / TikTok → pas d'API publique
- Certifications ARPP, mentions presse → pas de source structurée fiable
- Recherche par "prénom nom" sans contexte → trop d'homonymes

---

## Disclaimer légal

> Ce score est un signal d'aide à la décision généré à partir de données publiques. Il ne constitue pas un jugement juridique et ne remplace pas une vérification humaine. Seule une autorité compétente (DGCCRF, AMF, tribunal) peut qualifier une pratique d'illicite.

---

## États dégradés

| Situation | Comportement |
|---|---|
| API Annuaire Entreprises down | Critère 1 désactivé · mention "score partiel" |
| Liste AMF inaccessible | Critère 2 désactivé · mention "score partiel" |
| Input = prénom + nom seul | Critères 1 et 2 désactivés · score basé uniquement sur le critère 3 (mentions publiques) · mention "score partiel — ajoute un site, une société ou une chaîne pour fiabiliser" |
| Homonymes détectés sur SIREN | Critère 1 en attente · proposer à l'user de choisir parmi les résultats Annuaire Entreprises |
| Aucune donnée exploitable | Pas de score · message "Input trop générique, ajoute un site, une chaîne ou une société" |
