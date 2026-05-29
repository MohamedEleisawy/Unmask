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


def _extract_reputation(p: dict) -> Optional[int]:
    """Score d'analyse mediatique Claude (analyse raisonnee des articles)."""
    if not p or not p.get("available"):
        return None
    return p.get("reputation_score")


def _reputation_signal_score(pillars: dict) -> Optional[int]:
    """Score du signal 'reputation mediatique'.

    Claude + recherche web (analyse raisonnee des articles) porte le score ;
    l'OSINT Serper (comptage de mots-cles) sert de fallback quand Claude
    est indisponible.
    """
    reasoned = _extract_reputation(pillars.get("reputation") or {})
    if reasoned is not None:
        return reasoned
    return _extract_osint(pillars.get("osint") or {})


def _reputation_group_score(pillars: dict) -> Optional[int]:
    """Moyenne des sous-signaux disponibles : reputation mediatique, youtube."""
    parts: list[int] = []
    rep = _reputation_signal_score(pillars)
    if rep is not None:
        parts.append(rep)
    yt = _extract_youtube(pillars.get("youtube") or {})
    if yt is not None:
        parts.append(yt)
    if not parts:
        return None
    return round(sum(parts) / len(parts))


def _legal_reason(p: dict, score: Optional[int]) -> str:
    if score is None:
        return "Non calcule : aucune societe trouvee pour les inputs fournis."
    return "Entite identifiee dans l'annuaire des entreprises." if score >= 100 \
        else "Aucune structure juridique trouvee (personne physique ou entite absente du registre)."


def _compliance_reason(p: dict, score: Optional[int]) -> str:
    if score is None:
        return "Non calcule : ni URL ni nom d'entite exploitable."
    return "Hors liste noire AMF/ACPR." if score >= 100 \
        else "Presente sur la liste noire AMF/ACPR — alerte reglementaire majeure."


def _reputation_reason(pillars: dict, score: Optional[int]) -> str:
    if score is None:
        return "Non calcule : aucun nom d'entite fourni pour l'analyse mediatique."
    rep = pillars.get("reputation") or {}
    if rep.get("available"):
        rationale = rep.get("score_rationale") or ""
        harmful = rep.get("harmful_count", 0)
        base = f"Analyse de presse (Claude + recherche web) : {harmful} article(s) defavorable(s) directement lie(s) a l'entite."
        return f"{base} {rationale}".strip()
    return "Analyse de presse indisponible — repli sur les signaux OSINT bruts (comptage de mots-cles)."


# (cle pilier, libelle, poids, extracteur de score, justificateur)
_CRITERIA = (
    ("legal_identity", "Identite legale verifiable", WEIGHTS["legal"], _extract_legal, _legal_reason),
    ("compliance", "Conformite AMF/ACPR", WEIGHTS["compliance"], _extract_compliance, _compliance_reason),
    ("reputation", "Reputation publique", WEIGHTS["reputation_group"], None, _reputation_reason),
)


def compute_breakdown(pillars: dict) -> list[dict]:
    """Detail transparent du calcul : poids, score, contribution et justification par critere.

    Le poids effectif est le poids redistribue sur les seuls criteres calculables.
    """
    rows: list[dict] = []
    for key, label, weight, extractor, reasoner in _CRITERIA:
        if key == "reputation":
            score = _reputation_group_score(pillars)
            reason = _reputation_reason(pillars, score)
        else:
            score = extractor(pillars.get(key) or {})
            reason = reasoner(pillars.get(key) or {}, score)
        rows.append({
            "key": key,
            "label": label,
            "weight": weight,
            "score": score,
            "available": score is not None,
            "reason": reason,
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
    """Score 0-100 = moyenne ponderee des criteres disponibles."""
    rows = [r for r in compute_breakdown(pillars) if r["available"]]
    if not rows:
        return 50
    total_weight = sum(r["weight"] for r in rows)
    weighted_sum = sum(r["score"] * r["weight"] for r in rows)
    return round(weighted_sum / total_weight)


def verdict_from_score(score: int) -> str:
    if score >= 70:
        return "fiable"
    if score >= 40:
        return "suspect"
    return "alerte"
