"""
Detection de presence sur les reseaux sociaux via recherche Google `site:`.

PAS de scraping. On interroge Google (via Serper.dev ou Google CSE) avec
l'operateur `site:<domaine>` pour chaque plateforme cible, et on retient
uniquement les metadonnees SERP (titre, URL, snippet).

Exemple de requete envoyee a Google :
    "mrbeast" site:tiktok.com

Resultat : liste de plateformes avec, pour chacune, le 1er profil trouve.
"""

import asyncio
from typing import Optional

import httpx

from app.services._search_backend import has_search_backend, search
from app.services.social_presence_models import PlatformHit, SocialPresenceResult

# (platform_display_name, domain) - ordre = ordre d'affichage
_PLATFORMS: list[tuple[str, str]] = [
    ("Instagram", "instagram.com"),
    ("TikTok", "tiktok.com"),
    ("YouTube", "youtube.com"),
    ("X (Twitter)", "x.com"),
]


def _normalize_query(raw: str) -> str:
    """Strip @ et espaces de bords. Garde la query telle quelle pour Google."""
    q = raw.strip()
    return q.lstrip("@").strip()


def _looks_like_profile_url(url: str, domain: str, handle: str) -> bool:
    """Heuristique : l'URL contient le domaine + un fragment qui ressemble au handle."""
    if not url or domain not in url:
        return False
    if not handle:
        return True
    needle = handle.lower()
    return needle in url.lower()


async def _search_platform(
    raw_query: str, handle: str, platform: str, domain: str, client: httpx.AsyncClient,
) -> PlatformHit:
    # On strip le @ pour la query Google : "@x" donne moins de resultats que "x".
    query = f'"{handle}" site:{domain}'
    try:
        results = await search(query, num=3, client=client)
    except Exception:
        return PlatformHit(platform=platform, domain=domain, found=False)

    for r in results:
        url = r.get("link", "")
        if _looks_like_profile_url(url, domain, handle):
            return PlatformHit(
                platform=platform,
                domain=domain,
                found=True,
                profile_url=url,
                title=r.get("title", ""),
                snippet=r.get("snippet", ""),
            )

    # Fallback : aucun match strict, on prend le 1er resultat du domaine si dispo
    for r in results:
        if domain in r.get("link", ""):
            return PlatformHit(
                platform=platform,
                domain=domain,
                found=True,
                profile_url=r.get("link"),
                title=r.get("title", ""),
                snippet=r.get("snippet", ""),
            )

    return PlatformHit(platform=platform, domain=domain, found=False)


async def find_social_presence(query: str) -> SocialPresenceResult:
    """
    Cherche la presence de `query` sur chaque plateforme cible.
    `query` accepte : nom prenom, @handle, raison sociale.
    """
    if not query or not query.strip():
        return SocialPresenceResult(
            warning="Query requise pour la recherche de presence sociale.",
            available=False,
        )

    if not has_search_backend():
        return SocialPresenceResult(
            warning="Aucune cle API de recherche configuree (SERPER_API_KEY ou GOOGLE_CSE_API_KEY+ID).",
            available=False,
        )

    raw = query.strip()
    handle = _normalize_query(raw)

    async with httpx.AsyncClient(timeout=15.0) as client:
        tasks = [
            _search_platform(raw, handle, platform, domain, client)
            for platform, domain in _PLATFORMS
        ]
        hits = await asyncio.gather(*tasks)

    return SocialPresenceResult(
        query=raw,
        hits=list(hits),
        found_count=sum(1 for h in hits if h.found),
    )
