"""
Vérification du modèle de score « risque réel » (audit_scoring).

Standalone, sans dépendance externe (audit_scoring n'importe que `typing`).
Lancer depuis backend/ :  python scripts/verify_scoring.py
Sortie : tableau PASS/FAIL des 6 cas d'acceptation ; code retour 1 si un échec.

Chaîne testée (identique à full_audit) :
    apply_alert_cap(compute_global_score(pillars), compute_alerts(pillars))
    + verdict_from_score(score, alerts)
"""

import os
import sys

# Console Windows (cp1252) : force l'UTF-8 pour afficher accents et symboles.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Rend `app` importable quel que soit le répertoire d'appel.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.audit_scoring import (  # noqa: E402
    apply_alert_cap,
    compute_alerts,
    compute_coverage,
    compute_global_score,
    verdict_from_score,
)


def _evaluate(pillars: dict) -> dict:
    """Reproduit la séquence de full_audit pour un jeu de piliers donné."""
    alerts = compute_alerts(pillars)
    score = apply_alert_cap(compute_global_score(pillars), alerts)
    return {
        "score": score,
        "verdict": verdict_from_score(score, alerts),
        "alert_types": [a["type"] for a in alerts],
        "severities": [a["severity"] for a in alerts],
        "coverage": compute_coverage(pillars),
    }


# --- Jeux de piliers des 6 cas d'acceptation -------------------------------

CASES = [
    {
        "name": "1. Escroc célèbre condamné",
        "pillars": {
            "identity_resolution": {"real_name": "Oussama Ammar", "image_url": "x"},
            "social_presence": {"found_count": 3},
            "legal_identity": {"found": True},
            "reputation": {
                "available": True,
                "reputation_score": 5,
                "harmful_count": 8,
                "score_rationale": "5 condamnations rapportées.",
                "event_breakdown": {"condamnation": 5, "accusation": 2},
            },
        },
        "expect": {"score": 5, "verdict": "alerte", "must_have_alert": "judicial_conviction"},
    },
    {
        "name": "2. Inconnu (empreinte mince)",
        "pillars": {
            "identity_resolution": {},
            "social_presence": {"found_count": 0},
            "reputation": {
                "available": True,
                "reputation_score": 100,
                "harmful_count": 0,
                "event_breakdown": {},
            },
        },
        "expect": {"score": 50, "verdict": "partiellement_verifie",
                   "no_alerts": True, "confidence": "faible"},
    },
    {
        "name": "3. Personnalité clean documentée",
        "pillars": {
            "identity_resolution": {"real_name": "Personne Clean", "wikipedia_url": "x"},
            "social_presence": {"found_count": 4},
            "reputation": {
                "available": True,
                "reputation_score": 100,
                "harmful_count": 0,
                "event_breakdown": {},
            },
        },
        "expect": {"score": 100, "verdict": "verifie", "no_alerts": True},
    },
    {
        "name": "4. Liste noire AMF",
        "pillars": {
            "identity_resolution": {"real_name": "Entité Blacklistée"},
            "compliance": {
                "is_blacklisted": True,
                "regulators": {"amf_result": "found", "acpr_result": "non consulté"},
            },
            "reputation": {
                "available": True,
                "reputation_score": 90,
                "harmful_count": 0,
                "event_breakdown": {},
            },
        },
        "expect": {"score": 20, "verdict": "alerte", "must_have_alert": "regulatory_blacklist"},
    },
    {
        "name": "5. ≥2 sociétés radiées, presse propre",
        "pillars": {
            "identity_resolution": {"real_name": "Dirigeant Récidiviste"},
            "legal_identity": {
                "found": True,
                "closed_companies_count": 3,
                "examined_companies_count": 4,
            },
            "reputation": {
                "available": True,
                "reputation_score": 95,
                "harmful_count": 0,
                "event_breakdown": {},
            },
        },
        "expect": {"score": 50, "verdict": "partiellement_verifie",
                   "must_have_alert": "multiple_closed_companies"},
    },
    {
        "name": "6. Réputation indisponible (entité connue)",
        "pillars": {
            "identity_resolution": {"real_name": "Entité Connue", "wikipedia_url": "x"},
            "social_presence": {"found_count": 2},
            "reputation": {"available": False},
        },
        "expect": {"score": 50, "verdict": "partiellement_verifie", "no_alerts": True},
    },
]


def _check(case: dict) -> tuple[bool, list[str], dict]:
    got = _evaluate(case["pillars"])
    exp = case["expect"]
    fails: list[str] = []

    if got["score"] != exp["score"]:
        fails.append(f"score {got['score']} ≠ {exp['score']}")
    if got["verdict"] != exp["verdict"]:
        fails.append(f"verdict {got['verdict']!r} ≠ {exp['verdict']!r}")
    if exp.get("must_have_alert") and exp["must_have_alert"] not in got["alert_types"]:
        fails.append(f"drapeau {exp['must_have_alert']!r} absent ({got['alert_types']})")
    if exp.get("no_alerts") and got["alert_types"]:
        fails.append(f"alertes inattendues : {got['alert_types']}")
    if exp.get("confidence") and got["coverage"]["confidence"] != exp["confidence"]:
        fails.append(f"confiance {got['coverage']['confidence']!r} ≠ {exp['confidence']!r}")

    return (not fails), fails, got


def main() -> int:
    all_ok = True
    print("=" * 78)
    print("Vérification du modèle de score « risque réel »")
    print("=" * 78)
    for case in CASES:
        ok, fails, got = _check(case)
        all_ok = all_ok and ok
        tag = "PASS" if ok else "FAIL"
        print(f"[{tag}] {case['name']}")
        print(f"       score={got['score']} verdict={got['verdict']} "
              f"alerts={got['alert_types']} confiance={got['coverage']['confidence']}")
        for f in fails:
            print(f"       ✗ {f}")
    print("-" * 78)
    print("RÉSULTAT :", "tous les cas passent ✅" if all_ok else "des cas échouent ❌")
    return 0 if all_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
