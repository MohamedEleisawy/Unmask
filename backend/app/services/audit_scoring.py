"""
Calcul du score global d'audit — modèle « crédibilité vérifiable » (100 pts).

Principe fondamental : on note UNIQUEMENT ce qui est réellement vérifiable.
L'absence d'information n'est JAMAIS un signal négatif :
  • un critère non évaluable (pas de donnée) voit son poids redistribué sur
    les autres critères — il n'est pas mis à 0 ;
  • l'absence d'entreprise, de réseau ou d'article ne retire aucun point.

Critères NOTÉS (uniquement des signaux RÉELLEMENT vérifiables) :
  • Identité numérique ......... 25  (nom, photo, présence publique, réseaux)
  • Réseaux sociaux officiels .. 25  (Instagram / TikTok / YouTube / X)
  • Réputation publique ........ 30  (presse, signalements, enquêtes, condamnations)

AMF / ACPR n'est PLUS un critère noté : c'est un DRAPEAU (cf. compute_alerts).
Une alerte critique (liste noire) plafonne le score global (apply_alert_cap).

Volontairement EXCLUS du score (non vérifiables de façon fiable, éviteraient de
« deviner ») : transparence des partenariats, cohérence d'engagement, et tout
critère dépendant d'un scraping inaccessible.

L'entreprise (SIREN/SIRET…) est purement DESCRIPTIVE : elle n'entre pas dans
le score (un créateur sans structure déclarée peut être parfaitement légitime).
"""

from typing import Optional

# Poids centralisés — toute la logique de pondération est ici, nulle part ailleurs.
WEIGHTS = {
    "digital_identity": 25,
    "social": 25,
    "reputation": 30,
}


# ---------------------------------------------------------------------------
# 1. Identité numérique (25)
# ---------------------------------------------------------------------------

def _digital_identity(pillars: dict) -> tuple[Optional[int], str, list[str]]:
    res = pillars.get("identity_resolution") or {}
    social = pillars.get("social_presence") or {}

    # Non évaluable seulement si on n'a rien pu tenter (pas de nom fourni).
    if not res and not social:
        return None, "Non évalué : aucun nom d'entité fourni.", []

    name_ok = bool(res.get("real_name"))
    photo_ok = bool(res.get("image_url"))
    public_ok = bool(res.get("source")) or name_ok
    socials_ok = (social.get("found_count") or 0) >= 1

    signals = [
        ("nom", name_ok),
        ("photo", photo_ok),
        ("présence publique", public_ok),
        ("réseaux officiels", socials_ok),
    ]
    n_ok = sum(1 for _, ok in signals if ok)
    # Rien de vérifiable → non évaluable (redistribué), jamais 0 pénalisant.
    if n_ok == 0:
        return None, "Aucun élément d'identité vérifiable (non pénalisant).", []

    score = round(100 * n_ok / len(signals))
    reason = "Confirmé : " + ", ".join(label for label, ok in signals if ok)
    details = [f"{'✓' if ok else '—'} {label}" for label, ok in signals]
    return score, reason, details


# ---------------------------------------------------------------------------
# 2. Réseaux sociaux officiels (25)
# ---------------------------------------------------------------------------

_PLATFORM_ORDER = ["Instagram", "TikTok", "YouTube", "X (Twitter)"]


def _social(pillars: dict) -> tuple[Optional[int], str, list[str]]:
    social = pillars.get("social_presence") or {}
    hits = social.get("hits") or []
    shown = [h for h in hits if h.get("found")]

    # Aucun réseau détecté → non évaluable (l'absence ne pénalise pas).
    if not shown:
        return None, "Aucun réseau officiel détecté (non pénalisant).", []

    # Score = confiance moyenne des comptes détectés.
    score = round(sum(h.get("confidence", 0) for h in shown) / len(shown))

    by_platform = {h.get("platform"): h for h in shown}
    details = []
    for plat in _PLATFORM_ORDER:
        h = by_platform.get(plat)
        if h:
            tag = "officiel" if h.get("official") else "probable"
            details.append(f"✓ {plat} {tag} ({h.get('confidence')}%)")
        else:
            details.append(f"— {plat} non détecté")
    reason = f"{len(shown)} réseau(x) officiel(s) détecté(s) sur {len(_PLATFORM_ORDER)}."
    return score, reason, details


# ---------------------------------------------------------------------------
# 3. Réputation publique (30)
# ---------------------------------------------------------------------------

def _thin_footprint(pillars: dict) -> bool:
    """Vrai si l'entité n'a quasiment aucune empreinte publique vérifiable."""
    res = pillars.get("identity_resolution") or {}
    social = pillars.get("social_presence") or {}
    legal = pillars.get("legal_identity") or {}
    has_identity = bool(res.get("real_name") or res.get("wikipedia_url"))
    has_socials = (social.get("found_count") or 0) >= 1
    has_legal = bool(legal.get("found"))
    return not (has_identity or has_socials or has_legal)


def _reputation(pillars: dict) -> tuple[Optional[int], str, list[str]]:
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

    if _thin_footprint(pillars):
        return None, "Historique public trop mince pour évaluer la réputation (non pénalisant).", []
    return rep.get("reputation_score"), "Aucune mise en cause directe trouvée (empreinte publique suffisante).", details


# ---------------------------------------------------------------------------
# AMF / ACPR — drapeau hors score (plus un critère noté)
# ---------------------------------------------------------------------------

def compute_alerts(pillars: dict) -> list[dict]:
    """Drapeaux hors score. Une alerte CRITIQUE plafonne le score global ;
    une alerte WARNING est purement informative (indicateur comportemental)."""
    alerts = []

    comp = pillars.get("compliance") or {}
    if comp.get("is_blacklisted"):
        reg = comp.get("regulators") or {}
        alerts.append({
            "type": "regulatory_blacklist",
            "severity": "critique",
            "message": "Présence sur la liste noire AMF/ACPR.",
            "details": [
                f"AMF : {reg.get('amf_result', 'non consulté')}",
                f"ACPR : {reg.get('acpr_result', 'non consulté')}",
            ],
        })

    # Radiations répétées : signal comportemental (NON intégré au score).
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
    """Une alerte critique plafonne le score à 20."""
    if any(a.get("severity") == "critique" for a in alerts):
        return min(score, 20)
    return score


# ---------------------------------------------------------------------------
# Agrégation
# ---------------------------------------------------------------------------

def _evaluate(pillars: dict) -> dict:
    return {
        "digital_identity": (_digital_identity(pillars), "Identité numérique"),
        "social": (_social(pillars), "Réseaux sociaux officiels"),
        "reputation": (_reputation(pillars), "Réputation publique"),
    }


def compute_breakdown(pillars: dict) -> list[dict]:
    """Détail transparent : poids, score, contribution et justification par critère.

    Le poids effectif est redistribué sur les seuls critères évaluables :
    un critère non évaluable n'est jamais compté comme 0.
    """
    evaluated = _evaluate(pillars)
    rows: list[dict] = []
    for key, ((score, reason, details), label) in evaluated.items():
        rows.append({
            "key": key,
            "label": label,
            "weight": WEIGHTS[key],
            "score": score,
            "available": score is not None,
            "reason": reason,
            "details": details,
        })

    total = sum(r["weight"] for r in rows if r["available"]) or 1
    for r in rows:
        if r["available"]:
            r["effective_weight"] = round(r["weight"] / total * 100)
            r["points"] = round(r["score"] * r["weight"] / total)
        else:
            r["effective_weight"] = 0
            r["points"] = 0
    return rows


def compute_global_score(pillars: dict) -> int:
    """Score 0-100 = moyenne pondérée des critères évaluables."""
    rows = [r for r in compute_breakdown(pillars) if r["available"]]
    if not rows:
        return 50
    total_weight = sum(r["weight"] for r in rows)
    weighted_sum = sum(r["score"] * r["weight"] for r in rows)
    return round(weighted_sum / total_weight)


def compute_coverage(breakdown: list[dict]) -> dict:
    total = len(breakdown)
    evaluated = sum(1 for r in breakdown if r["available"])
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
    if alerts and any(a.get("severity") == "critique" for a in alerts):
        return "alerte"
    if score >= VERDICT_THRESHOLDS["verifie"]:
        return "verifie"
    if score >= VERDICT_THRESHOLDS["partiellement_verifie"]:
        return "partiellement_verifie"
    return "peu_verifiable"
