"""
Pilier 4 - Coherence d'engagement YouTube (YouTube Data API v3).

Detecte les anomalies dans les metriques d'une chaine :
- Ratio vues/abonnes anormal (achat de vues)
- Faible moyenne de vues malgre une grosse audience
- Croissance suspecte

Requiert : YOUTUBE_API_KEY dans .env
Source : https://developers.google.com/youtube/v3
"""

import re
from typing import Optional

import httpx

from app.config import YOUTUBE_API_KEY
from app.services.youtube_models import EngagementFlag, YoutubeResult

_YT_API = "https://www.googleapis.com/youtube/v3"
_TIMEOUT = 10

_HANDLE_PATTERNS = [
    r"youtube\.com/channel/(UC[\w-]{22})",
    r"youtube\.com/@([\w.-]+)",
    r"youtube\.com/c/([\w.-]+)",
    r"youtube\.com/user/([\w.-]+)",
]


# ---------------------------------------------------------------------------
# Resolution d'identifiant
# ---------------------------------------------------------------------------

def _extract_channel_id(url_or_handle: str) -> Optional[str]:
    """Extrait un channel ID ou handle depuis une URL YouTube."""
    for p in _HANDLE_PATTERNS:
        m = re.search(p, url_or_handle)
        if m:
            return m.group(1)
    if url_or_handle.startswith("UC") and len(url_or_handle) == 24:
        return url_or_handle
    return None


async def _resolve_handle_to_id(handle: str, client: httpx.AsyncClient) -> Optional[str]:
    """Resout un @handle ou nom de chaine vers un channel ID via search."""
    resp = await client.get(f"{_YT_API}/search", params={
        "part": "snippet",
        "q": handle,
        "type": "channel",
        "maxResults": 1,
        "key": YOUTUBE_API_KEY,
    })
    items = resp.json().get("items", [])
    return items[0]["id"]["channelId"] if items else None


async def _fetch_channel_stats(channel_id: str, client: httpx.AsyncClient) -> Optional[dict]:
    resp = await client.get(f"{_YT_API}/channels", params={
        "part": "snippet,statistics",
        "id": channel_id,
        "key": YOUTUBE_API_KEY,
    })
    items = resp.json().get("items", [])
    return items[0] if items else None


# ---------------------------------------------------------------------------
# Analyse heuristique
# ---------------------------------------------------------------------------

def _flag_view_ratio(result: YoutubeResult) -> tuple[Optional[EngagementFlag], int]:
    if not (result.subscribers and result.total_views):
        return None, 0
    ratio = result.total_views / result.subscribers
    result.engagement_ratio = ratio

    if ratio < 0.5:
        return EngagementFlag(
            type="low_view_ratio",
            severity="suspicious",
            detail=f"Ratio vues/abonnes tres faible ({ratio:.2f}). Possible achat d'abonnes.",
        ), 40
    if ratio < 2:
        return EngagementFlag(
            type="low_view_ratio",
            severity="warning",
            detail=f"Ratio vues/abonnes faible ({ratio:.2f}). Engagement potentiellement artificiel.",
        ), 20
    return None, 0


def _flag_avg_views(result: YoutubeResult) -> tuple[Optional[EngagementFlag], int]:
    if not (result.video_count and result.total_views and result.video_count > 0):
        return None, 0
    avg = result.total_views / result.video_count
    result.avg_views_per_video = avg

    if result.subscribers and result.subscribers > 100_000 and avg < 1000:
        return EngagementFlag(
            type="low_avg_views",
            severity="suspicious",
            detail=f"Moyenne de {avg:.0f} vues/video pour {result.subscribers:,} abonnes.",
        ), 30
    return None, 0


def _analyze_metrics(result: YoutubeResult) -> YoutubeResult:
    flags: list[EngagementFlag] = []
    score = 100

    for builder in (_flag_view_ratio, _flag_avg_views):
        flag, penalty = builder(result)
        if flag:
            flags.append(flag)
            score -= penalty

    result.flags = flags
    result.engagement_score = max(0, score)
    return result


# ---------------------------------------------------------------------------
# Fonction principale
# ---------------------------------------------------------------------------

async def check_youtube_engagement(url_or_handle: str) -> YoutubeResult:
    """Analyse les metriques d'une chaine YouTube."""
    if not YOUTUBE_API_KEY:
        return YoutubeResult(
            warning="Cle YOUTUBE_API_KEY non configuree. Analyse YouTube indisponible.",
            available=False,
        )

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        raw = _extract_channel_id(url_or_handle)
        if raw and raw.startswith("UC"):
            channel_id = raw
        else:
            handle = raw or url_or_handle.strip().lstrip("@")
            channel_id = await _resolve_handle_to_id(handle, client)

        if not channel_id:
            return YoutubeResult(
                warning=f"Chaine YouTube introuvable pour : {url_or_handle}",
                available=False,
            )

        item = await _fetch_channel_stats(channel_id, client)
        if not item:
            return YoutubeResult(
                warning="Chaine non trouvee via l'API YouTube.",
                available=False,
            )

        stats = item.get("statistics", {})
        snippet = item.get("snippet", {})

        result = YoutubeResult(
            channel_id=channel_id,
            channel_name=snippet.get("title", ""),
            subscribers=int(stats["subscriberCount"]) if stats.get("subscriberCount") else None,
            total_views=int(stats["viewCount"]) if stats.get("viewCount") else None,
            video_count=int(stats["videoCount"]) if stats.get("videoCount") else None,
            channel_url=f"https://www.youtube.com/channel/{channel_id}",
        )
        return _analyze_metrics(result)
