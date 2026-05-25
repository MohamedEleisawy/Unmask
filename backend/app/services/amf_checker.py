"""
Verification AMF/ACPR - Liste noire ABE Infoservice.

LIMITE CONNUE : La liste AMF recense des domaines, emails et noms de societes.
Elle ne contient PAS les noms/prenoms de personnes physiques.

Source : https://www.abe-infoservice.fr/liste-noire
"""

import csv
import unicodedata
from datetime import date
from functools import lru_cache
from pathlib import Path
from typing import Optional

from app.services.amf_models import AmfMatch, ComplianceResult

_CSV_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "abeis-liste-noire.csv"


# ---------------------------------------------------------------------------
# Helpers de normalisation
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    """Minuscules + suppression accents + suppression du prefixe www."""
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text.removeprefix("www.")


def _extract_hostname(url_or_email: str) -> str:
    """Extrait le hostname depuis une URL ou un email."""
    text = _normalize(url_or_email)
    if "@" in text:
        text = text.split("@")[-1]
    return text.split("/")[0].split("?")[0]


def _parse_date(raw: str) -> Optional[date]:
    try:
        day, month, year = raw.strip().split("/")
        return date(int(year), int(month), int(day))
    except (ValueError, AttributeError):
        return None


# ---------------------------------------------------------------------------
# Chargement du CSV (cache LRU)
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _load_blacklist() -> list[dict]:
    """Charge le CSV une seule fois en memoire."""
    if not _CSV_PATH.exists():
        raise FileNotFoundError(
            f"Fichier AMF introuvable : {_CSV_PATH}\n"
            "Telechargez-le sur https://www.abe-infoservice.fr/liste-noire"
        )

    entries = []
    with open(_CSV_PATH, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            raw_url = row.get("URL / Mails", "").strip()
            raw_cats = row.get("Catégorie(s)", "") or ""
            entries.append({
                "hostname": _extract_hostname(raw_url),
                "denomination": _normalize(row.get("Dénomination", "").strip()),
                "raw_value": raw_url,
                "categories": [c.strip() for c in raw_cats.split(",") if c.strip()],
                "date_added": _parse_date(row.get("Date d'inscription", "")),
            })
    return entries


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------

def _match_by_url(blacklist: list[dict], url: Optional[str]) -> tuple[list[AmfMatch], Optional[str]]:
    if not url:
        return [], None
    query = _extract_hostname(url)
    matches = [
        AmfMatch(
            matched_on="url",
            matched_value=e["raw_value"],
            categories=e["categories"],
            date_added=e["date_added"],
        )
        for e in blacklist if e["hostname"] == query
    ]
    return matches, query


def _match_by_name(
    blacklist: list[dict], name: Optional[str], already: list[AmfMatch],
) -> tuple[list[AmfMatch], Optional[str]]:
    if not name:
        return [], None
    query = _normalize(name)
    existing_values = {m.matched_value for m in already}
    matches = [
        AmfMatch(
            matched_on="denomination",
            matched_value=e["raw_value"],
            categories=e["categories"],
            date_added=e["date_added"],
        )
        for e in blacklist
        if e["denomination"] and query in e["denomination"] and e["raw_value"] not in existing_values
    ]
    return matches, query


def _build_warning(
    url: Optional[str], entity_name: Optional[str], sector: Optional[str],
) -> Optional[str]:
    financial_sectors = {"finance", "crypto", "forex", "investissement", "trading", "placement"}
    is_financial = sector and any(s in _normalize(sector) for s in financial_sectors)

    if not url and not entity_name:
        return "Aucune donnee fournie pour la verification AMF."
    if not is_financial and sector:
        return (
            f"Secteur '{sector}' non-financier : la liste noire AMF est principalement "
            "destinee aux escroqueries financieres. L'absence de resultat ne garantit pas la fiabilite."
        )
    if entity_name and not url:
        return (
            "La liste AMF ne recense pas les personnes physiques par leur nom. "
            "La recherche par nom ne fonctionne que pour les societes declarees."
        )
    return None


# ---------------------------------------------------------------------------
# Fonction principale
# ---------------------------------------------------------------------------

def check_compliance(
    url: Optional[str] = None,
    entity_name: Optional[str] = None,
    sector: Optional[str] = None,
    siren: Optional[str] = None,
) -> ComplianceResult:
    """
    Verifie une entite contre la liste noire AMF/ACPR.

    Args:
        url         : URL ou profil reseau social.
        entity_name : Nom public de la personne ou de la marque.
        sector      : Secteur declare (ex. "finance", "coaching"...).
        siren       : SIREN optionnel (non present dans la liste AMF).
    """
    blacklist = _load_blacklist()

    url_matches, url_query = _match_by_url(blacklist, url)
    name_matches, name_query = _match_by_name(blacklist, entity_name, url_matches)
    matches = url_matches + name_matches

    checked = {
        "url_checked": url_query,
        "entity_name_checked": name_query,
        "sector": sector,
        "siren_note": (
            "SIREN absent de la liste AMF - a verifier via data.gouv.fr (pilier Identite Legale)"
            if siren else None
        ),
    }

    return ComplianceResult(
        is_blacklisted=len(matches) > 0,
        matches=matches,
        checked=checked,
        warning=_build_warning(url, entity_name, sector),
    )
