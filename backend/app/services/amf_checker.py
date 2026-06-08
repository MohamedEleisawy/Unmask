"""
Verification AMF/ACPR - Liste noire ABE Infoservice.

Source primaire : data.gouv.fr - dataset "Listes noires des entites non
autorisees a proposer des produits ou services financiers en France".
URL stable : /api/1/datasets/r/<resource_id>

Schema CSV (separateur `;`, encodage UTF-8 BOM) :
    "nom";"categorie";"date_inscription"

Le champ `nom` melange domaines, emails et raisons sociales.

LIMITE CONNUE : La liste ne contient pas les noms/prenoms de personnes
physiques. La recherche par nom n'est fiable que pour les societes declarees.
"""

import csv
import io
import time
import unicodedata
from datetime import date
from pathlib import Path
from typing import Optional

import httpx


from app.config import AMF_CACHE_TTL_SECONDS
from app.services.amf_models import AmfMatch, ComplianceResult

_DATAGOUV_URL = (
    "https://www.data.gouv.fr/api/1/datasets/r/d2d9df6d-1cd2-41a8-96f5-684cb3057ecb"
)
_FALLBACK_CSV = Path(__file__).resolve().parent.parent.parent / "data" / "abeis-liste-noire.csv"

_cache: dict = {"entries": None, "fetched_at": 0.0, "source": None}


# ---------------------------------------------------------------------------
# Helpers de normalisation
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text.removeprefix("www.")


def _extract_hostname(url_or_email: str) -> str:
    text = _normalize(url_or_email)
    if "://" in text:
        text = text.split("://", 1)[1]
    if "@" in text:
        text = text.split("@")[-1]
    text = text.split("/")[0].split("?")[0].split("#")[0]
    return text.removeprefix("www.")


def _looks_like_host_or_email(raw: str) -> bool:
    return "@" in raw or "." in raw


def _parse_date(raw: str) -> Optional[date]:
    raw = raw.strip()
    for fmt_attempt in (
        lambda s: date.fromisoformat(s),                                # YYYY-MM-DD
        lambda s: date(*reversed([int(x) for x in s.split("/")])),      # DD/MM/YYYY
    ):
        try:
            return fmt_attempt(raw)
        except (ValueError, TypeError):
            continue
    return None


# ---------------------------------------------------------------------------
# Parsing CSV (multi-schemas : data.gouv et legacy ABE)
# ---------------------------------------------------------------------------

def _parse_csv(text: str) -> list[dict]:
    # Detection du separateur via la 1re ligne
    first_line = text.splitlines()[0] if text else ""
    delimiter = ";" if first_line.count(";") >= first_line.count(",") else ","

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    entries: list[dict] = []
    for row in reader:
        raw_name = (row.get("nom") or row.get("URL / Mails") or "").strip()
        raw_denom = (row.get("Dénomination") or "").strip()
        raw_cats = row.get("categorie") or row.get("Catégorie(s)") or ""
        raw_date = row.get("date_inscription") or row.get("Date d'inscription") or ""

        if _looks_like_host_or_email(raw_name):
            hostname = _extract_hostname(raw_name)
            denomination = _normalize(raw_denom)
        else:
            hostname = ""
            denomination = _normalize(raw_denom or raw_name)

        entries.append({
            "hostname": hostname,
            "denomination": denomination,
            "raw_value": raw_name or raw_denom,
            "categories": [c.strip() for c in raw_cats.split(",") if c.strip()],
            "date_added": _parse_date(raw_date),
        })
    return entries


# ---------------------------------------------------------------------------
# Chargement avec cache TTL et fallback fichier local
# ---------------------------------------------------------------------------

def _load_blacklist() -> list[dict]:
    now = time.time()
    if _cache["entries"] is not None and (now - _cache["fetched_at"]) < AMF_CACHE_TTL_SECONDS:
        return _cache["entries"]

    entries: Optional[list[dict]] = None
    source = None

    try:
        with httpx.Client(timeout=20.0, follow_redirects=True) as client:
            r = client.get(_DATAGOUV_URL)
            r.raise_for_status()
            entries = _parse_csv(r.content.decode("utf-8-sig"))
            source = "data.gouv.fr"
    except (httpx.HTTPError, ValueError):
        entries = None

    if not entries and _FALLBACK_CSV.exists():
        with open(_FALLBACK_CSV, encoding="utf-8-sig") as f:
            entries = _parse_csv(f.read())
            source = "local-fallback"

    if entries is None:
        raise RuntimeError(
            "Liste AMF indisponible : echec data.gouv.fr et aucun fichier local de fallback."
        )

    _cache.update(entries=entries, fetched_at=now, source=source)
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
        for e in blacklist if e["hostname"] and e["hostname"] == query
    ]
    return matches, query


def _match_by_name(
    blacklist: list[dict], name: Optional[str], already: list[AmfMatch],
) -> tuple[list[AmfMatch], Optional[str]]:
    if not name:
        return [], None
    query = _normalize(name)
    if len(query) < 3:
        return [], query
    existing = {m.matched_value for m in already}
    matches = [
        AmfMatch(
            matched_on="denomination",
            matched_value=e["raw_value"],
            categories=e["categories"],
            date_added=e["date_added"],
        )
        for e in blacklist
        if e["denomination"] and query in e["denomination"] and e["raw_value"] not in existing
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
# API publique
# ---------------------------------------------------------------------------

def check_compliance(
    url: Optional[str] = None,
    entity_name: Optional[str] = None,
    sector: Optional[str] = None,
    siren: Optional[str] = None,
) -> ComplianceResult:
    blacklist = _load_blacklist()

    url_matches, url_query = _match_by_url(blacklist, url)
    name_matches, name_query = _match_by_name(blacklist, entity_name, url_matches)
    matches = url_matches + name_matches

    checked = {
        "url_checked": url_query,
        "entity_name_checked": name_query,
        "sector": sector,
        "source": _cache.get("source"),
        "source_url": _DATAGOUV_URL,
        "entries_count": len(blacklist),
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
