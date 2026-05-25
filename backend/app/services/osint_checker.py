"""
Pilier 5 - Reputation externe / OSINT.

Croise l'entite avec des sources publiques via :
- Serper.dev (prioritaire, 2500 req/mois gratuits)
- Google Custom Search API (fallback)

Requiert : SERPER_API_KEY ou (GOOGLE_CSE_API_KEY + GOOGLE_CSE_ID) dans .env
"""

import httpx

from app.config import GOOGLE_CSE_API_KEY, GOOGLE_CSE_ID, SERPER_API_KEY
from app.services.osint_models import OsintResult, OsintResult_item

_TIMEOUT = 10

_ALERT_KEYWORDS = [
    "arnaque", "escroquerie", "plainte", "condamné", "frauduleux",
    "mise en garde", "signalement", "dgccrf", "amf", "procès",
    "fake", "scam", "fraud", "warning", "alert",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_alert(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in _ALERT_KEYWORDS)


def _build_query(entity_name: str) -> str:
    return f'"{entity_name}" (arnaque OR escroquerie OR plainte OR "mise en garde" OR scam OR fraud)'


def _score_results(results: list[OsintResult_item]) -> int:
    alerts = sum(1 for r in results if r.is_alert)
    if alerts == 0:
        return 100
    if alerts == 1:
        return 70
    if alerts <= 3:
        return 40
    return 10


def _to_items(raw: list[dict]) -> list[OsintResult_item]:
    return [
        OsintResult_item(
            title=r.get("title", ""),
            url=r.get("link", ""),
            snippet=r.get("snippet", ""),
            is_alert=_is_alert(r.get("title", "") + " " + r.get("snippet", "")),
        )
        for r in raw
    ]


# ---------------------------------------------------------------------------
# Backends de recherche
# ---------------------------------------------------------------------------

async def _search_serper(query: str, client: httpx.AsyncClient) -> list[dict]:
    resp = await client.post(
        "https://google.serper.dev/search",
        headers={"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"},
        json={"q": query, "num": 10, "gl": "fr", "hl": "fr"},
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json().get("organic", [])


async def _search_google_cse(query: str, client: httpx.AsyncClient) -> list[dict]:
    resp = await client.get(
        "https://www.googleapis.com/customsearch/v1",
        params={
            "key": GOOGLE_CSE_API_KEY,
            "cx": GOOGLE_CSE_ID,
            "q": query,
            "num": 10,
            "lr": "lang_fr",
        },
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    raw = resp.json().get("items", [])
    return [{"title": i.get("title", ""), "link": i.get("link", ""), "snippet": i.get("snippet", "")} for i in raw]


# ---------------------------------------------------------------------------
# Fonction principale
# ---------------------------------------------------------------------------

async def check_osint_reputation(entity_name: str) -> OsintResult:
    """Effectue une recherche OSINT sur l'entite."""
    if not entity_name or not entity_name.strip():
        return OsintResult(warning="Nom d'entite requis pour la recherche OSINT.", available=False)

    if not SERPER_API_KEY and not (GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID):
        return OsintResult(
            warning="Aucune cle API de recherche configuree (SERPER_API_KEY ou GOOGLE_CSE_API_KEY+ID). OSINT indisponible.",
            available=False,
        )

    query = _build_query(entity_name.strip())

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            raw = await (_search_serper(query, client) if SERPER_API_KEY else _search_google_cse(query, client))

        items = _to_items(raw)
        return OsintResult(
            query=query,
            alert_count=sum(1 for i in items if i.is_alert),
            results=items,
            reputation_score=_score_results(items),
        )

    except Exception as e:
        return OsintResult(
            warning=f"Erreur lors de la recherche OSINT : {type(e).__name__}",
            available=False,
        )
