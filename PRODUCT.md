# Product

## Register

product

> Surface primaire : l'outil d'audit (`/audit`). PRODUCT.md porte `product` par défaut.
> Une landing marketing (`/`) existe comme porte d'entrée — registre `brand` à invoquer
> explicitement par tâche quand on travaille sur la landing (`/impeccable craft landing …`).

## Users

Deux publics partagent le même outil :

- **Particuliers prudents** — quelqu'un qui hésite avant d'acheter une formation, un
  coaching ou un produit vendu par un influenceur. Contexte : moment d'achat, doute, envie
  de vérifier avant de payer. Job : « Est-ce que cette personne est légitime, ou est-ce
  que je vais me faire avoir ? »
- **Marques & agences** — due diligence légère avant un partenariat influenceur. Contexte :
  pré-collaboration, besoin de preuves vérifiables. Job : « Ce profil est-il conforme
  (identité légale, AMF) et sa réputation tient-elle la route ? »

Les deux veulent la **même chose** : un verdict factuel et sourcé, vite, sans jargon.

## Product Purpose

Unmask est une PWA d'audit de crédibilité qui agrège des **sources publiques vérifiables**
(SIREN/data.gouv, liste noire AMF, réputation presse, signaux YouTube, OSINT) en un
score global 0-100 assorti d'un verdict, d'une timeline et de preuves cliquables.
Zero-storage, conforme RGPD.

> Modèle de score « risque réel » : seule la **réputation publique** est notée ; les drapeaux
> réglementaires (AMF, condamnations) plafonnent ; SIREN/réseaux/identité sont descriptifs.
> Référence technique : `backend/app/services/audit_scoring.py` (cf. `README.md` §3).

L'outil ne donne pas un avis : il **montre les faits et leurs sources**. Le succès, c'est
qu'un utilisateur reparte avec une décision étayée (« vérifié » / « à creuser » / « signaux
d'alerte ») et la capacité de cliquer sur chaque preuve pour la juger lui-même.

## Brand Personality

**Net, moderne, rassurant.** Tech grand public, contemporain, chaleureux mais sérieux.
Vulgarise sans infantiliser. La crédibilité passe par la clarté, pas par l'austérité.

- **Voix** : factuelle et posée. Affirme ce qui est sourcé, nuance ce qui ne l'est pas
  (« score partiel », « input manquant »). Jamais accusateur, jamais sensationnaliste.
- **Ton émotionnel visé** : confiance factuelle. L'utilisateur doit sentir « voici les
  faits, à vous de juger », pas « on vous dit qui croire ».
- **Promesse implicite** : ne pas se faire avoir, sereinement.

## Anti-references

- **Site de « scam-checker » anxiogène** — rouge agressif, badges « DANGER », alarmes, ton
  complotiste. Décrédibilise l'aspect factuel et trahit la promesse « rassurant ». Le rouge
  marque (`#f84b5f`) sert le verdict, jamais la peur.
- **SaaS générique crème/violet** — dégradés pastel, eyebrows en majuscules trackées sur
  chaque section, grilles de cartes identiques, gradient text. L'esthétique « AI startup »
  indifférenciée. Le violet marque (`#936bff`) est un accent ciblé, pas un wash de page.
- **Outil financier froid (navy/gold)** — banque/fintech corporate, bleu marine et doré,
  densité institutionnelle. Trop froid, peu accessible pour un public large.
- **Dashboard data surchargé** — KPI cards partout, gauges colorées, surcharge de chiffres
  qui noie le verdict. Le verdict prime ; les preuves se déplient à la demande.

## Design Principles

1. **Montrer, pas asséner.** Chaque affirmation porte sa source cliquable. Le design met
   la preuve à portée de clic, pas le jugement en avant.
2. **Le verdict d'abord, le détail à la demande.** Hiérarchie : score + verdict lisibles en
   un coup d'œil ; les cartes de sources (réputation, identité légale, réseaux, timeline) et
   leurs preuves se déplient pour qui veut creuser.
3. **Rassurer par la clarté, pas par l'alarme.** La couleur encode un état (bon / à creuser
   / alerte) avec retenue — toujours doublée d'icône et de texte, jamais la couleur seule.
4. **Honnêteté sur l'incertitude.** Un audit partiel se dit partiel. L'interface explique
   quel input ajouter au lieu de masquer le manque derrière un faux score plein.
5. **Accessible à un public non-expert.** Vulgariser le juridique (SIREN, AMF) sans
   le diluer. Pas de jargon nu : chaque terme technique s'accompagne d'un sens lisible.

## Accessibility & Inclusion

- **WCAG AA** sur tout texte courant (corps ≥ 4.5:1, large ≥ 3:1), placeholders inclus.
- **Reduced-motion** : chaque animation a une alternative `prefers-reduced-motion: reduce`
  (crossfade ou transition instantanée).
- Navigation clavier complète ; focus visibles.
- Le thème bascule dark (défaut) / light / auto — les deux doivent tenir l'AA.
- L'état d'un verdict ne repose **jamais** uniquement sur la couleur (icône + texte requis),
  bénéfique aussi pour le daltonisme.
