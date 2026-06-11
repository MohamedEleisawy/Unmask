"""
Route POST /audit/full - Orchestrateur de l'audit complet.

Lance en parallele les services dont les inputs requis sont presents,
puis calcule un score pondere sur 3 criteres (cf. audit_scoring).
"""

import asyncio
import logging
from typing import Awaitable, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.amf_checker import check_compliance
from app.services.audit_report import build_audit_trail, build_timeline
from app.services.audit_scoring import (
    apply_alert_cap,
    compute_alerts,
    compute_breakdown,
    compute_coverage,
    compute_global_score,
    verdict_from_score,
)
from app.services.handle_resolver import resolve_handle
from app.services.reputation_analyzer import analyze_reputation
from app.services.siren_checker import check_legal_identity
from app.services.social_presence_checker import find_social_presence
from app.services.youtube_checker import check_youtube_engagement

router = APIRouter(prefix="/audit", tags=["Audit Complet"])
logger = logging.getLogger("unmask")

_DISCLAIMER = (
    "Cet audit est informatif et ne constitue pas un avis juridique. "
    "L'absence d'alerte ne garantit pas la fiabilite. "
    "Source : donnees publiques officielles."
)


class FullAuditRequest(BaseModel):
    entity_name: Optional[str] = Field(default=None, description="Nom public de l'entite.")
    siren: Optional[str] = Field(default=None, description="SIREN a 9 chiffres.")
    url: Optional[str] = Field(default=None, description="URL du site ou profil reseau social.")
    youtube_url: Optional[str] = Field(default=None, description="URL de la chaine YouTube.")
    # Pas de secteur par défaut « autre » : si non fourni, il reste None
    # (un secteur non fiable ne doit pas être affiché — cf. UX).
    sector: Optional[str] = Field(default=None, description="Secteur d'activite.")


def _build_async_tasks(body: FullAuditRequest) -> dict[str, Awaitable]:
    """Construit le dict des coroutines a executer en parallele."""
    tasks: dict[str, Awaitable] = {}

    if body.entity_name or body.siren:
        tasks["legal_identity"] = check_legal_identity(
            entity_name=body.entity_name, siren=body.siren,
        )

    if body.youtube_url or (body.url and "youtube" in (body.url or "").lower()):
        tasks["youtube"] = check_youtube_engagement(body.youtube_url or body.url)

    if body.entity_name:
        tasks["identity_resolution"] = resolve_handle(body.entity_name)
        tasks["reputation"] = analyze_reputation(body.entity_name)
        tasks["social_presence"] = find_social_presence(body.entity_name)

    if body.entity_name or body.url:
        async def _compliance():
            return check_compliance(
                url=body.url, entity_name=body.entity_name,
                sector=body.sector, siren=body.siren,
            )
        tasks["compliance"] = _compliance()

    return tasks


def _serialize(res) -> dict:
    if isinstance(res, Exception):
        return {"error": str(res), "available": False}
    if hasattr(res, "to_dict"):
        return res.to_dict()
    return res


async def _run_pillars(body: FullAuditRequest) -> dict:
    tasks = _build_async_tasks(body)
    keys = list(tasks.keys())
    logger.info("Audit '%s' — sources lancées : %s", body.entity_name, ", ".join(keys))
    raw_results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    pillars = {}
    for k, v in zip(keys, raw_results):
        if isinstance(v, Exception):
            logger.warning("  source '%s' : EXCEPTION %s : %s", k, type(v).__name__, str(v)[:200])
        pillars[k] = _serialize(v)
    return pillars


def _log_audit_summary(name: Optional[str], pillars: dict, breakdown: list[dict], score: int) -> None:
    """Trace, source par source : succès/échec, nombre de résultats, score attribué."""
    logger.info("──── Résultat audit '%s' : %s/100 ────", name, score)

    res = pillars.get("identity_resolution") or {}
    logger.info("  Identité : wikipedia=%s · photo=%s · nom=%s",
                bool(res.get("wikipedia_url")), bool(res.get("image_url")), res.get("real_name") or "—")

    social = pillars.get("social_presence") or {}
    logger.info("  Réseaux : %s détecté(s), %s confirmé(s) officiels (Wikidata)",
                social.get("found_count", 0), social.get("confirmed_count", 0))

    legal = pillars.get("legal_identity") or {}
    logger.info("  Entreprise (data.gouv) : trouvée=%s", bool(legal.get("found")))

    comp = pillars.get("compliance") or {}
    logger.info("  AMF/ACPR : liste_noire=%s", comp.get("is_blacklisted"))

    rep = pillars.get("reputation") or {}
    if rep.get("available"):
        logger.info("  Réputation : %s article(s), score=%s",
                    len(rep.get("articles", [])), rep.get("reputation_score"))
    else:
        logger.warning("  Réputation : INDISPONIBLE — %s",
                       rep.get("warning") or rep.get("error") or "raison inconnue")

    for r in breakdown:
        state = f"{r['score']}/100 (+{r['points']} pts)" if r["available"] else "NON évalué (poids redistribué)"
        logger.info("    • %-28s %s", r["label"], state)


@router.post("/preview", summary="Pré-vérification d'identité (rapide) avant l'audit complet")
async def audit_preview(body: FullAuditRequest):
    """
    Recherche RAPIDE pour confirmer l'identité avant de lancer l'audit complet :
    seulement la résolution d'identité (Wikipédia/Wikidata) + la présence sociale.
    Pas de réputation, pas de réglementaire (donc pas d'appel IA coûteux).
    Permet à l'utilisateur de valider « est-ce bien cette personne ? » et d'éviter
    les faux positifs.
    """
    name = (body.entity_name or "").strip()
    if not name:
        return {"query": body.entity_name, "found": False, "real_name": None,
                "image_url": None, "wikipedia_url": None, "networks": []}

    resolved, social = await asyncio.gather(
        resolve_handle(name), find_social_presence(name), return_exceptions=True,
    )
    res = _serialize(resolved)
    soc = _serialize(social)

    networks = [
        {
            "platform": h.get("platform"),
            "username": h.get("username"),
            "url": h.get("profile_url"),
            "official": h.get("official"),
            "confidence": h.get("confidence"),
        }
        for h in (soc.get("hits") or []) if h.get("found")
    ]
    real_name = res.get("real_name")
    image_url = res.get("image_url")
    return {
        "query": name,
        "found": bool(real_name or image_url or networks),
        "real_name": real_name,
        "image_url": image_url,
        "wikipedia_url": res.get("wikipedia_url"),
        "networks": networks,
    }


@router.post("/full", summary="Audit complet - 3 criteres ponderes + presence sociale")
async def full_audit(body: FullAuditRequest):
    """
    Lance les services disponibles en parallele.
    Un service sans input requis ou sans cle API renvoie available=False sans bloquer les autres.
    """
    pillars = await _run_pillars(body)
    audit_trail = build_audit_trail(pillars)
    timeline = build_timeline(pillars)
    breakdown = compute_breakdown(pillars)
    alerts = compute_alerts(pillars)
    score = apply_alert_cap(compute_global_score(pillars), alerts)
    coverage = compute_coverage(breakdown)
    verdict = verdict_from_score(score, alerts)
    _log_audit_summary(body.entity_name, pillars, breakdown, score)

    return {
        "entity": {
            "name": body.entity_name,
            "siren": body.siren,
            "url": body.url,
            "sector": body.sector,
        },
        "global_score": score,
        "verdict": verdict,
        "score_breakdown": breakdown,
        "alerts": alerts,
        "coverage": coverage,
        "audit_trail": audit_trail,
        "timeline": timeline,
        "pillars": pillars,
        "disclaimer": _DISCLAIMER,
    }
