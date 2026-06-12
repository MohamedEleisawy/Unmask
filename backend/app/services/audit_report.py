"""
Construction de l'audit trail et de la timeline à partir des piliers.

Audit trail : pour CHAQUE source, on dit si elle a été consultée, ce qu'elle a
renvoyé, et l'URL de preuve quand elle existe. Aucune source n'est inventée :
une source non consultée (input manquant) n'apparaît pas comme consultée.

Timeline : reconstruite à partir des années renseignées sur les articles de
presse (jamais d'année inventée — un article sans année est ignoré).
"""

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

def build_audit_trail(pillars: dict) -> list[dict]:
    """Journal des SOURCES TECHNIQUES du moteur (pipeline) et de leurs résultats.

    Volontairement limité aux sources d'infrastructure (Wikipedia, Wikidata,
    Google Search, Data.gouv, AMF, ACPR) — PAS les articles de presse ni les
    comptes sociaux, qui sont des PREUVES affichées séparément. On ne mélange
    jamais « ce qui a été consulté » avec « ce qui a été trouvé sur la personne ».
    """
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

    social = pillars.get("social_presence") or {}
    if social:
        n = social.get("found_count") or 0
        trail.append(_entry(
            "Google Search",
            consulted=True, found=n > 0, verified=True,
            result=f"{n} profil(s) social/aux détecté(s)" if n else "Aucun profil détecté",
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

    # Analyse de presse (IA) : on trace son statut et, si indisponible, la CAUSE
    # exacte (ex. « anthropic package missing ») pour le diagnostic.
    rep = pillars.get("reputation")
    if rep is not None:
        available = rep.get("available") is not False
        n_articles = len(rep.get("articles", []))
        if available:
            result = f"{n_articles} article(s) analysé(s)"
        else:
            result = f"Indisponible — {rep.get('reason') or rep.get('warning') or 'cause inconnue'}"
        trail.append(_entry(
            "Analyse de presse (IA)",
            consulted=True, found=available and n_articles > 0, verified=available,
            result=result,
        ))

    # Âge du nom de domaine (RDAP) — source technique, distincte du score.
    domain_intel = pillars.get("domain_intelligence")
    if domain_intel:
        available = domain_intel.get("available") is not False
        age = domain_intel.get("age_days")
        domain = domain_intel.get("domain") or ""
        if available and age is not None:
            result = f"Domaine créé il y a {age} jours"
        elif available:
            result = "Date de création indisponible"
        else:
            result = f"Indisponible — {domain_intel.get('reason') or 'RDAP injoignable'}"
        trail.append(_entry(
            "RDAP (âge du domaine)",
            consulted=True, found=available and age is not None, verified=available,
            result=result,
            evidence_url=f"https://rdap.org/domain/{domain}" if domain else None,
        ))

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
