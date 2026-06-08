"""
Calcul du score global d'audit — modèle « crédibilité vérifiable » (100 pts).

Principe fondamental : on note UNIQUEMENT ce qui est réellement vérifiable.
L'absence d'information n'est JAMAIS un signal négatif :
  • un critère non évaluable (pas de donnée) voit son poids redistribué sur
    les autres critères — il n'est pas mis à 0 ;
  • l'absence d'entreprise, de réseau ou d'article ne retire aucun point.

Critères et poids :
  • Identité numérique ......... 20  (nom, photo, présence publique, réseaux)
  • Réseaux sociaux officiels .. 20  (Instagram / TikTok / YouTube / X)
  • Réputation publique ........ 30  (presse, signalements, enquêtes, condamnations)
  • Vérifications réglementaires 15  (AMF / ACPR)
  • Transparence de l'audit .... 15  (étendue des sources + preuves collectées)

L'entreprise (SIREN/SIRET…) est purement DESCRIPTIVE : elle n'entre plus dans
le score (un créateur sans structure déclarée peut être parfaitement légitime).
"""

from typing import Optional

WEIGHTS = {
    "digital_identity": 20,
    "social": 20,
    "reputation": 30,
    "regulatory": 15,
    "transparency": 15,
}


# ---------------------------------------------------------------------------
# 1. Identité numérique (20)
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
# 2. Réseaux sociaux officiels (20)
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

def _reputation(pillars: dict) -> tuple[Optional[int], str, list[str]]:
    rep = pillars.get("reputation") or {}
    if rep.get("available"):
        score = rep.get("reputation_score")
        harmful = rep.get("harmful_count", 0)
        rationale = rep.get("score_rationale") or ""
        if harmful > 0:
            reason = f"{harmful} article(s) défavorable(s) détecté(s). {rationale}".strip()
        else:
            reason = "Aucune mise en cause directe trouvée (absence de signal négatif)."
        breakdown = rep.get("event_breakdown") or {}
        details = [
            f"{breakdown.get('accusation', 0)} accusation(s)",
            f"{breakdown.get('plainte', 0)} plainte(s)",
            f"{breakdown.get('enquete', 0)} enquête(s)",
            f"{breakdown.get('condamnation', 0)} condamnation(s)",
        ]
        return score, reason, details

    # Pas de repli sur l'OSINT brut (comptage de mots-clés) : trop bruité, il
    # « déduirait » une mauvaise réputation à partir de simples occurrences.
    # Sans analyse fiable → non évaluable (redistribué), jamais deviné.
    return None, "Non évalué : analyse de réputation indisponible (non pénalisant).", []


# ---------------------------------------------------------------------------
# 4. Vérifications réglementaires (15)
# ---------------------------------------------------------------------------

def _regulatory(pillars: dict) -> tuple[Optional[int], str, list[str]]:
    comp = pillars.get("compliance") or {}
    if comp.get("is_blacklisted") is None:
        return None, "Non évalué : bases AMF/ACPR non consultées.", []

    reg = comp.get("regulators") or {}
    blacklisted = comp.get("is_blacklisted")
    score = 0 if blacklisted else 100
    if blacklisted:
        reason = "Présence sur la liste noire AMF/ACPR — alerte réglementaire."
    else:
        reason = "Aucune correspondance dans les bases AMF/ACPR consultées."
    details = [
        f"AMF : {reg.get('amf_result', 'non consulté')}",
        f"ACPR : {reg.get('acpr_result', 'non consulté')}",
    ]
    return score, reason, details


# ---------------------------------------------------------------------------
# 5. Transparence de l'audit (15)
# ---------------------------------------------------------------------------

def _transparency(audit_trail: Optional[list]) -> tuple[Optional[int], str, list[str]]:
    if not audit_trail:
        return None, "Non évalué : aucun journal de sources.", []

    consulted = [t for t in audit_trail if t.get("consulted")]
    verified = [t for t in consulted if t.get("verified")]
    evidence = sum(1 for t in audit_trail if t.get("evidence_url"))

    # Étendue (nombre de catégories de sources consultées, idéal ≈ 6) +
    # preuves vérifiables collectées (URLs). Moyenne des deux.
    breadth = min(1.0, len(consulted) / 6)
    evidence_ratio = min(1.0, evidence / 4)
    score = round(100 * (0.5 * breadth + 0.5 * evidence_ratio))
    reason = (
        f"{len(consulted)} source(s) consultée(s), {len(verified)} avec résultat exploitable, "
        f"{evidence} preuve(s) vérifiable(s)."
    )
    details = [f"{len(consulted)} sources consultées", f"{evidence} preuves (URLs)"]
    return score, reason, details


# ---------------------------------------------------------------------------
# Agrégation
# ---------------------------------------------------------------------------

# (clé, libellé, poids, fonction)
def _evaluate(pillars: dict, audit_trail: Optional[list]) -> dict:
    return {
        "digital_identity": (_digital_identity(pillars), "Identité numérique"),
        "social": (_social(pillars), "Réseaux sociaux officiels"),
        "reputation": (_reputation(pillars), "Réputation publique"),
        "regulatory": (_regulatory(pillars), "Vérifications réglementaires"),
        "transparency": (_transparency(audit_trail), "Transparence de l'audit"),
    }


def compute_breakdown(pillars: dict, audit_trail: Optional[list] = None) -> list[dict]:
    """Détail transparent : poids, score, contribution et justification par critère.

    Le poids effectif est redistribué sur les seuls critères évaluables :
    un critère non évaluable n'est jamais compté comme 0.
    """
    evaluated = _evaluate(pillars, audit_trail)
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


def compute_global_score(pillars: dict, audit_trail: Optional[list] = None) -> int:
    """Score 0-100 = moyenne pondérée des critères évaluables."""
    rows = [r for r in compute_breakdown(pillars, audit_trail) if r["available"]]
    if not rows:
        return 50
    total_weight = sum(r["weight"] for r in rows)
    weighted_sum = sum(r["score"] * r["weight"] for r in rows)
    return round(weighted_sum / total_weight)


def verdict_from_score(score: int) -> str:
    """Verdict neutre — Unmask ne juge pas « arnaque », il mesure la vérifiabilité."""
    if score >= 70:
        return "verifie"
    if score >= 40:
        return "partiellement_verifie"
    return "peu_verifiable"
