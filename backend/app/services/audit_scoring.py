"""
Calcul du score global d'audit selon 3 criteres ponderes.

Crit 1 (40 pts) - Identite legale : SIREN + statut juridique
Crit 2 (35 pts) - Conformite reglementaire : liste noire AMF/ACPR
Crit 3 (25 pts) - Reputation publique : moyenne osint + youtube si dispo

Les criteres indisponibles voient leurs points redistribues proportionnellement
sur les criteres restants.
"""

from typing import Optional

WEIGHTS = {
    "legal": 40,
    "compliance": 35,
    "reputation_group": 25,
}


def _extract_legal(p: dict) -> Optional[int]:
    if not p or p.get("warning") or p.get("found") is None:
        return None
    return 100 if p["found"] else 30


def _extract_compliance(p: dict) -> Optional[int]:
    if not p or p.get("is_blacklisted") is None:
        return None
    return 0 if p["is_blacklisted"] else 100


def _extract_youtube(p: dict) -> Optional[int]:
    if not p or not p.get("available"):
        return None
    return p.get("engagement_score")


def _extract_osint(p: dict) -> Optional[int]:
    if not p or not p.get("available"):
        return None
    return p.get("reputation_score")


def _reputation_group_score(pillars: dict) -> Optional[int]:
    """Moyenne des sous-signaux disponibles : osint, youtube."""
    parts: list[int] = []
    for key, extractor in (("osint", _extract_osint), ("youtube", _extract_youtube)):
        score = extractor(pillars.get(key) or {})
        if score is not None:
            parts.append(score)
    if not parts:
        return None
    return round(sum(parts) / len(parts))


def compute_global_score(pillars: dict) -> int:
    """Score 0-100 = moyenne ponderee des 3 criteres disponibles."""
    contributions: list[tuple[int, int]] = []

    legal = _extract_legal(pillars.get("legal_identity") or {})
    if legal is not None:
        contributions.append((legal, WEIGHTS["legal"]))

    compliance = _extract_compliance(pillars.get("compliance") or {})
    if compliance is not None:
        contributions.append((compliance, WEIGHTS["compliance"]))

    reputation = _reputation_group_score(pillars)
    if reputation is not None:
        contributions.append((reputation, WEIGHTS["reputation_group"]))

    if not contributions:
        return 50

    total_weight = sum(w for _, w in contributions)
    weighted_sum = sum(score * w for score, w in contributions)
    return round(weighted_sum / total_weight)


def verdict_from_score(score: int) -> str:
    if score >= 70:
        return "fiable"
    if score >= 40:
        return "suspect"
    return "alerte"
