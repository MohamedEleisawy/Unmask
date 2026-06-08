"""
Construction de l'audit trail et de la timeline à partir des piliers.

Audit trail : pour CHAQUE source, on dit si elle a été consultée, ce qu'elle a
renvoyé, et l'URL de preuve quand elle existe. Aucune source n'est inventée :
une source non consultée (input manquant) n'apparaît pas comme consultée.

Timeline : reconstruite à partir des années renseignées sur les articles de
presse (jamais d'année inventée — un article sans année est ignoré).
"""

from typing import Optional
from urllib.parse import urlparse


def _domain(url: str) -> str:
    try:
        host = urlparse(url).netloc.lower()
        return host[4:] if host.startswith("www.") else host
    except Exception:
        return ""


def _entry(source, consulted, found, verified, result, detail="", evidence_url=None) -> dict:
    return {
        "source": source,
        "consulted": consulted,
        "found": found,
        "verified": verified,
        "result": result,
        "detail": detail,
        "evidence_url": evidence_url,
    }


# ---------------------------------------------------------------------------
# Audit trail
# ---------------------------------------------------------------------------

def _press_entries(reputation: dict) -> list[dict]:
    """Une entrée par média cité, avec le nombre d'articles défavorables trouvés."""
    if not reputation or not reputation.get("available"):
        return []

    # Compte les articles par domaine.
    counts: dict[str, int] = {}
    for a in reputation.get("articles", []):
        dom = _domain(a.get("url", ""))
        if dom:
            counts[dom] = counts.get(dom, 0) + 1

    entries: list[dict] = []
    seen: set[str] = set()
    for s in reputation.get("sources", []):
        url = s.get("url", "")
        dom = _domain(url)
        if not dom or dom in seen:
            continue
        seen.add(dom)
        n = counts.get(dom, 0)
        result = f"{n} article(s) trouvé(s)" if n else "Source consultée"
        entries.append(_entry(
            source=s.get("label") or dom,
            consulted=True, found=n > 0, verified=True,
            result=result, evidence_url=url,
        ))
    return entries


def _social_entries(social: dict) -> list[dict]:
    if not social:
        return []
    entries: list[dict] = []
    for h in social.get("hits", []):
        if not h.get("found"):
            continue
        tag = "officiel" if h.get("official") else "probable"
        entries.append(_entry(
            source=h.get("platform"),
            consulted=True, found=True, verified=True,
            result=f"@{h.get('username')} — {tag} ({h.get('confidence')}%)",
            evidence_url=h.get("profile_url"),
        ))
    return entries


def build_audit_trail(pillars: dict) -> list[dict]:
    """Journal complet des sources consultées et de leurs résultats."""
    trail: list[dict] = []

    res = pillars.get("identity_resolution") or {}
    if res:
        real_name = res.get("real_name")
        wiki_url = res.get("wikipedia_url") or (
            res.get("source") if "wiki" in (res.get("source") or "") else None
        )
        page_found = bool(real_name or wiki_url)
        if real_name:
            wiki_result = f"Identité trouvée : {real_name}"
        elif wiki_url:
            wiki_result = "Fiche Wikipédia trouvée"
        else:
            wiki_result = "Aucune fiche trouvée"
        trail.append(_entry(
            "Wikipedia",
            consulted=True, found=page_found, verified=page_found,
            result=wiki_result,
            evidence_url=wiki_url,
        ))
        image = res.get("image_url")
        trail.append(_entry(
            "Wikidata / Knowledge Graph",
            consulted=True, found=bool(image), verified=bool(image),
            result="Photo trouvée" if image else "Aucune photo trouvée",
            evidence_url=image,
        ))

    legal = pillars.get("legal_identity") or {}
    if legal:
        identity = legal.get("identity") or {}
        found = bool(legal.get("found"))
        name = identity.get("nom") if found else None
        trail.append(_entry(
            "Annuaire des Entreprises (data.gouv)",
            consulted=True, found=found, verified=True,
            result=f"Entreprise trouvée : {name}" if found else "Aucune entreprise identifiée",
            evidence_url=identity.get("source_url") if found else None,
        ))

    comp = pillars.get("compliance") or {}
    reg = comp.get("regulators") or {}
    if reg:
        for code, label in (("amf", "AMF"), ("acpr", "ACPR")):
            result = reg.get(f"{code}_result")
            found = result == "found"
            trail.append(_entry(
                label,
                consulted=bool(reg.get(f"{code}_checked")), found=found, verified=True,
                result="Correspondance trouvée" if found else "Aucune correspondance",
                evidence_url=reg.get(f"{code}_source"),
            ))

    trail.extend(_social_entries(pillars.get("social_presence") or {}))
    trail.extend(_press_entries(pillars.get("reputation") or {}))
    return trail


# ---------------------------------------------------------------------------
# Timeline
# ---------------------------------------------------------------------------

_EVENT_LABELS = {
    "accusation": "Accusation publique",
    "plainte": "Plainte déposée",
    "enquete": "Enquête ouverte",
    "condamnation": "Condamnation",
    "autre": "Article de presse",
}


def build_timeline(pillars: dict) -> dict:
    """Chronologie des événements datables issus de la presse.

    Retourne {"entries": [{year, events:[...]}], "has_conviction": bool}.
    Un article sans année n'est jamais daté arbitrairement : il est ignoré ici.
    """
    reputation = pillars.get("reputation") or {}
    if not reputation.get("available"):
        return {"entries": [], "has_conviction": False}

    by_year: dict[int, list[dict]] = {}
    has_conviction = False
    for a in reputation.get("articles", []):
        if a.get("impact") != "harmful":
            continue
        if a.get("event_type") == "condamnation":
            has_conviction = True
        year = a.get("year")
        if not isinstance(year, int):
            continue
        by_year.setdefault(year, []).append({
            "label": _EVENT_LABELS.get(a.get("event_type"), "Article de presse"),
            "type": a.get("event_type", "autre"),
            "title": a.get("title", ""),
            "url": a.get("url", ""),
        })

    entries = [{"year": y, "events": by_year[y]} for y in sorted(by_year)]
    return {"entries": entries, "has_conviction": has_conviction}
