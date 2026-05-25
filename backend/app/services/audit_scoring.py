"""
Calcul du score global d'audit a partir des resultats des 6 piliers.

Chaque pilier contribue au score s'il est disponible. Un pilier indisponible
(cle API manquante) est ignore pour ne pas penaliser injustement.
"""

from typing import Callable, Optional

# Chaque entree : (cle_pilier, extracteur_de_score)
# L'extracteur retourne un score 0-100 ou None si le pilier n'est pas exploitable.

def _extract_legal(p: dict) -> Optional[int]:
    if p.get("warning") or p.get("found") is None:
        return None
    return 100 if p["found"] else 30


def _extract_partnerships(p: dict) -> Optional[int]:
    return p.get("compliance_score")


def _extract_discourse(p: dict) -> Optional[int]:
    if not p.get("available") or p.get("manipulation_score") is None:
        return None
    return max(0, 100 - p["manipulation_score"])


def _extract_youtube(p: dict) -> Optional[int]:
    if not p.get("available"):
        return None
    return p.get("engagement_score")


def _extract_osint(p: dict) -> Optional[int]:
    if not p.get("available"):
        return None
    return p.get("reputation_score")


def _extract_compliance(p: dict) -> Optional[int]:
    if p.get("is_blacklisted") is None:
        return None
    return 0 if p["is_blacklisted"] else 100


_PILLAR_EXTRACTORS: dict[str, Callable[[dict], Optional[int]]] = {
    "legal_identity": _extract_legal,
    "partnerships": _extract_partnerships,
    "discourse": _extract_discourse,
    "youtube": _extract_youtube,
    "osint": _extract_osint,
    "compliance": _extract_compliance,
}


def compute_global_score(pillars: dict) -> int:
    """Score global 0-100 = moyenne des piliers disponibles. 50 si rien d'exploitable."""
    scores: list[int] = []
    for key, extractor in _PILLAR_EXTRACTORS.items():
        pillar = pillars.get(key)
        if not pillar:
            continue
        score = extractor(pillar)
        if score is not None:
            scores.append(score)

    if not scores:
        return 50
    return round(sum(scores) / len(scores))


def verdict_from_score(score: int) -> str:
    """Convertit un score numerique en verdict textuel."""
    if score >= 70:
        return "fiable"
    if score >= 40:
        return "suspect"
    return "alerte"
