# Projet Unmask (v2.0) — Audit de Crédibilité IA

## 1. Vision et Philosophie
Unmask est une PWA d'audit de confiance conçue pour lutter contre la manipulation informationnelle. 
- **Mission :** Donner aux utilisateurs une vision claire et sourcée de la crédibilité d'un influenceur ou d'une marque.
- **Principe fondamental ("No proof, no point") :** Aucun score n'est émis sans une source publique vérifiable. L'outil agit comme un filtre de transparence factuel, non comme un juge.

## 2. Expérience Utilisateur (UX)
- **Omnibox :** Barre de recherche unifiée (supporte URL YouTube, noms de personnes/marques).
- **Bilan de Transparence :** Audit visuel basé sur une checklist de critères.
- **Preuves sourcées :** Chaque point de vigilance est accompagné d'un lien officiel (source légale, API gouvernementale ou presse).
- **Mode Analyse Manuel :** Analyse ponctuelle de contenus textuels suspects (emails, posts, discours).

## 3. Protocole d'Audit (Checklist)
L'audit repose sur 6 piliers factuels :
1. Identité légale : Vérification active via SIREN (Annuaire des Entreprises).
2. Transparence partenariats : Conformité aux mentions obligatoires (loi 2023).
3. Analyse du discours : Détection de signaux de manipulation ou secteurs interdits.
4. Cohérence d'engagement : Analyse des métriques réelles (ratio vues/abonnés).
5. Réputation externe (OSINT) : Croisement avec les avis et la presse.
6. Conformité Institutionnelle : Vérification systématique contre les listes noires AMF/ACPR.

## 4. Stack Technique
- **Frontend :** Next.js (App Router), Tailwind CSS, PWA.
- **Backend :** Python (FastAPI), architecture asynchrone.
- **IA :** Analyse textuelle par LLM (OpenAI/Claude) via API.
- **Persistance :** Redis/SQLite pour mise en cache (Zero-storage).

## 5. Flux de Données (Solution Hybride)
Pour garantir la conformité aux CGU :
- **YouTube Data API v3 :** Données chiffrées (vues, likes) et contenu écrit (descriptions).
- **Google Custom Search API (ou Serper.dev) :** Enquête OSINT sur les entités hors-plateformes.
- **Data.gouv.fr :** Validation administrative des entreprises.
- **AMF (ABE Infoservice) :** Audit financier via fichier de référence local.

## 6. Engagements de Conformité
- **RGPD :** Zéro compte, zéro stockage de données personnelles, traitement en mémoire vive.
- **CGU :** Zéro scraping sauvage ; utilisation exclusive d'API officielles.
- **Neutralité :** Disclaimer juridique systématique et absence de verdict définitif.
- **Transparence :** Priorité absolue à la traçabilité des preuves sources.