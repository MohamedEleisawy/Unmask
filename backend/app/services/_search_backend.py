"""
Couche transport partagee pour les recherches Google (Serper / Google CSE).

Module prive (prefixe `_`) : ne pas importer hors du package `services`.
Centralise la logique de selection du backend et normalise la reponse en
`[{title, link, snippet}]` quel que soit le fournisseur.
"""

from typing import Optional

import httpx

from app.config import GOOGLE_CSE_API_KEY, GOOGLE_CSE_ID, SERPER_API_KEY

_TIMEOUT = 10


def has_search_backend() -> bool:
    """Retourne True si au moins un backend de recherche est configure."""
    return bool(SERPER_API_KEY or (GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID))


async def _via_serper(query: str, num: int, client: httpx.AsyncClient) -> list[dict]:
    resp = await client.post(
        "https://google.serper.dev/search",
        headers={"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"},
        json={"q": query, "num": num, "gl": "fr", "hl": "fr"},
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json().get("organic", [])


async def _via_google_cse(query: str, num: int, client: httpx.AsyncClient) -> list[dict]:
    resp = await client.get(
        "https://www.googleapis.com/customsearch/v1",
        params={
            "key": GOOGLE_CSE_API_KEY,
            "cx": GOOGLE_CSE_ID,
            "q": query,
            "num": num,
            "lr": "lang_fr",
        },
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    raw = resp.json().get("items", [])
    return [
        {"title": i.get("title", ""), "link": i.get("link", ""), "snippet": i.get("snippet", "")}
        for i in raw
    ]


async def search(query: str, num: int = 10, client: Optional[httpx.AsyncClient] = None) -> list[dict]:
    """
    Lance une recherche et retourne `[{title, link, snippet}]`.
    Utilise Serper en priorite, Google CSE en fallback.
    Retourne [] si aucun backend configure.
    """
    if not has_search_backend():
        return []

    own_client = client is None
    client = client or httpx.AsyncClient(timeout=_TIMEOUT)
    try:
        if SERPER_API_KEY:
            return await _via_serper(query, num, client)
        return await _via_google_cse(query, num, client)
    finally:
        if own_client:
            await client.aclose()
