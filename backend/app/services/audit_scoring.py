"""
Calcul du score global d'audit — modèle « risque réel » (100 pts).

Principe : on ne note QUE ce qui qualifie la fiabilité réelle d'une entité.
La notoriété (identité numérique, présence sociale, existence d'une société)
ne dit RIEN sur l'honnêteté : un escroc qui réussit est souvent plus visible,
plus vérifié et mieux identifié, pas moins. Ces signaux sont donc AFFICHÉS
(cartes piliers, timeline) mais ne pèsent PLUS dans le score.

Axe NOTÉ (unique) :
  • Réputation publique ........ 100  (presse, signalements, enquêtes, condamnations)

Couche RÉGLEMENTAIRE = drapeaux/caps, jamais de points positifs :
  • Liste noire AMF ............. alerte critique -> plafonne le score à 20
  • Condamnation judiciaire avérée  alerte critique -> plafonne le score à 20
  • >= 2 sociétés radiées/fermées .. warning -> plafonne le score à 50 (pas de vert)

Un SIREN actif n'ajoute aucun point (la légalité d'une structure ne garantit pas
l'honnêteté de son dirigeant). Le SIREN et le statut d'entreprise restent
purement DESCRIPTIFS.

Cas « inconnu » : si la réputation n'est pas évaluable (empreinte publique trop
mince, ou analyse indisponible), le score n'est PAS 100. « On n'a rien trouvé »
n'est pas « vérifié », c'est « on ne sait pas » : le score retombe à un point
NEUTRE (50) qui s'affiche « à vérifier », jamais au vert rassurant.
"""

from typing import Optional

# Plafonds appliqués par la couche réglementaire (drapeaux).
CRITICAL_CAP = 20   # liste noire AMF ou condamnation avérée
WARNING_CAP = 50    # radiations répétées : interdit le vert, sans écraser
NEUTRAL_SCORE = 50  # réputation non évaluable -> « à vérifier », pas vert


# ---------------------------------------------------------------------------
# Axe noté unique : Réputation publique (100)
# ---------------------------------------------------------------------------

def _thin_footprint(pillars: dict) -> bool:
    """Vrai si l'entité n'a quasiment aucune empreinte publique vérifiable.

    Sert à distinguer « clean et documenté » (vert possible) de « inconnu »
    (neutre « à vérifier ») : sans aucune empreinte, on ne peut rien conclure.
    """
    res = pillars.get("identity_resolution") or {}
    social = pillars.get("social_presence") or {}
    legal = pillars.get("legal_identity") or {}
    has_identity = bool(res.get("real_name") or res.get("wikipedia_url"))
    has_socials = (social.get("found_count") or 0) >= 1
    has_legal = bool(legal.get("found"))
    return not (has_identity or has_socials or has_legal)


def _reputation(pillars: dict) -> tuple[Optional[int], str, list[str]]:
    """Sous-score réputation (0-100) ou None si non évaluable (non pénalisant)."""
    rep = pillars.get("reputation") or {}
    if not rep.get("available"):
        return None, "Non évalué : analyse de réputation indisponible (non pénalisant).", []

    harmful = rep.get("harmful_count", 0)
    rationale = rep.get("score_rationale") or ""
    breakdown = rep.get("event_breakdown") or {}
    details = [
        f"{breakdown.get('accusation', 0)} accusation(s)",
        f"{breakdown.get('plainte', 0)} plainte(s)",
        f"{breakdown.get('enquete', 0)} enquête(s)",
        f"{breakdown.get('condamnation', 0)} condamnation(s)",
    ]

    if harmful > 0:
        reason = f"{harmful} article(s) défavorable(s) détecté(s). {rationale}".strip()
        return rep.get("reputation_score"), reason, details

    # Aucune mise en cause MAIS empreinte trop mince -> on ne sait pas (neutre).
    if _thin_footprint(pillars):
        return None, "Historique public trop mince pour évaluer la réputation (non pénalisant).", []
    return rep.get("reputation_score"), "Aucune mise en cause directe trouvée (empreinte publique suffisante).", details


# ---------------------------------------------------------------------------
# Couche réglementaire — drapeaux hors score
# ---------------------------------------------------------------------------

def compute_alerts(pillars: dict) -> list[dict]:
    """Drapeaux réglementaires/judiciaires. Ne créditent jamais, ne font que
    plafonner :
      • critique -> cap 20 (apply_alert_cap) + verdict alerte ;
      • warning  -> cap 50 (interdit le vert).
    """
    alerts = []

    # 1. Liste noire AMF -> critique.
    comp = pillars.get("compliance") or {}
    if comp.get("is_blacklisted"):
        reg = comp.get("regulators") or {}
        alerts.append({
            "type": "regulatory_blacklist",
            "severity": "critique",
            "message": "Présence sur la liste noire AMF.",
            "details": [
                f"AMF : {reg.get('amf_result', 'non consulté')}",
            ],
        })

    # 2. Condamnation judiciaire avérée -> critique (override rouge).
    #    On s'appuie sur la nature factuelle parsée par l'analyse de réputation
    #    (event_breakdown), pas sur une déduction.
    rep = pillars.get("reputation") or {}
    convictions = (rep.get("event_breakdown") or {}).get("condamnation", 0)
    if convictions >= 1:
        alerts.append({
            "type": "judicial_conviction",
            "severity": "critique",
            "message": f"{convictions} condamnation(s) judiciaire(s) avérée(s) rapportée(s).",
            "details": [(rep.get("score_rationale") or "").strip() or
                        "Décision(s) de justice explicitement rapportée(s) par les sources."],
        })

    # 3. Radiations répétées -> warning (signal comportemental, cap 50).
    legal = pillars.get("legal_identity") or {}
    closed = legal.get("closed_companies_count") or 0
    if closed >= 2:
        examined = legal.get("examined_companies_count") or closed
        alerts.append({
            "type": "multiple_closed_companies",
            "severity": "warning",
            "message": f"{closed} entreprise(s) fermée(s)/radiée(s) au nom de ce dirigeant sur {examined} examinée(s).",
            "details": [f"{closed}/{examined} entités du même dirigeant au statut fermé/radié/cessé"],
        })

    return alerts


def apply_alert_cap(score: int, alerts: list[dict]) -> int:
    """Applique le plafond le plus sévère déclenché par les drapeaux."""
    if any(a.get("severity") == "critique" for a in alerts):
        return min(score, CRITICAL_CAP)
    if any(a.get("severity") == "warning" for a in alerts):
        return min(score, WARNING_CAP)
    return score


# ---------------------------------------------------------------------------
# Agrégation
# ---------------------------------------------------------------------------

def compute_breakdown(pillars: dict) -> list[dict]:
    """Détail du barème. Un seul critère noté : la réputation publique.

    Le schéma de ligne (weight / effective_weight / points) est conservé pour
    rester compatible avec l'affichage front. Les autres signaux (identité,
    réseaux, SIREN) ne figurent pas ici : ils sont affichés dans leurs propres
    cartes et n'entrent pas dans le score.
    """
    score, reason, details = _reputation(pillars)
    available = score is not None
    return [{
        "key": "reputation",
        "label": "Réputation publique",
        "weight": 100,
        "score": score,
        "available": available,
        "reason": reason,
        "details": details,
        "effective_weight": 100 if available else 0,
        "points": score if available else 0,
    }]


def compute_global_score(pillars: dict) -> int:
    """Score 0-100 = réputation publique, ou point neutre si non évaluable.

    Les caps réglementaires sont appliqués en amont par apply_alert_cap
    (cf. full_audit), pas ici.
    """
    score, _, _ = _reputation(pillars)
    if score is None:
        return NEUTRAL_SCORE
    return score


def compute_coverage(pillars: dict) -> dict:
    """Couverture informationnelle : combien de sources d'info ont renvoyé des
    données exploitables (indépendamment du scoring). Sert l'indicateur de
    confiance affiché à l'utilisateur.
    """
    res = pillars.get("identity_resolution") or {}
    social = pillars.get("social_presence") or {}
    rep = pillars.get("reputation") or {}
    legal = pillars.get("legal_identity") or {}
    comp = pillars.get("compliance") or {}

    sources = {
        "identité": bool(res.get("real_name") or res.get("wikipedia_url") or res.get("image_url")),
        "réseaux": (social.get("found_count") or 0) >= 1,
        "réputation": bool(rep.get("available")),
        "réglementaire": bool(legal.get("found") or comp.get("regulators")),
    }
    total = len(sources)
    evaluated = sum(1 for ok in sources.values() if ok)
    ratio = evaluated / total if total else 0
    if ratio >= 0.75:
        confidence = "élevée"
    elif ratio >= 0.5:
        confidence = "moyenne"
    else:
        confidence = "faible"
    return {"evaluated": evaluated, "total": total, "confidence": confidence}


VERDICT_THRESHOLDS = {"verifie": 70, "partiellement_verifie": 40}


def verdict_from_score(score: int, alerts: Optional[list[dict]] = None) -> str:
    """Verdict textuel. Une alerte critique force « alerte » quel que soit le score."""
    if alerts and any(a.get("severity") == "critique" for a in alerts):
        return "alerte"
    if score >= VERDICT_THRESHOLDS["verifie"]:
        return "verifie"
    if score >= VERDICT_THRESHOLDS["partiellement_verifie"]:
        return "partiellement_verifie"
    return "peu_verifiable"
