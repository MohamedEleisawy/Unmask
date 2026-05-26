"""
Pilier 5 - Reputation externe / OSINT.

Croise l'entite avec des sources publiques via :
- Serper.dev (prioritaire, 2500 req/mois gratuits)
- Google Custom Search API (fallback)

Requiert : SERPER_API_KEY ou (GOOGLE_CSE_API_KEY + GOOGLE_CSE_ID) dans .env
"""

from app.services._search_backend import has_search_backend, search
from app.services.osint_models import OsintResult, OsintResult_item

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
# Fonction principale
# ---------------------------------------------------------------------------

async def check_osint_reputation(entity_name: str) -> OsintResult:
    """Effectue une recherche OSINT sur l'entite."""
    if not entity_name or not entity_name.strip():
        return OsintResult(warning="Nom d'entite requis pour la recherche OSINT.", available=False)

    if not has_search_backend():
        return OsintResult(
            warning="Aucune cle API de recherche configuree (SERPER_API_KEY ou GOOGLE_CSE_API_KEY+ID). OSINT indisponible.",
            available=False,
        )

    query = _build_query(entity_name.strip())

    try:
        raw = await search(query, num=10)
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
