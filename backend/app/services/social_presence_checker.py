"""
Détection de présence sur les réseaux sociaux via recherche Google `site:`.

PAS de scraping. On interroge Google (via Serper.dev ou Google CSE) avec
l'opérateur `site:<domaine>` pour chaque plateforme cible, et on n'exploite que
les métadonnées SERP (titre, URL, snippet).

Principe de détection (robuste pour les influenceurs au pseudo ≠ nom civil) :
le handle n'est PAS exigé dans l'URL. Exemple : « Cyprien » a pour handle
Instagram `6pri1`. On s'appuie sur le NOM présent dans le titre du résultat
(« Cyprien (@6pri1) … ») + le rang Google + les abonnés lus dans le snippet.

Score de confiance — signaux réellement mesurables sans clé d'API plateforme
(le badge « vérifié » officiel n'est pas exposé par les SERP, on le remplace
par des signaux équivalents) :
  • nom présent dans le titre du résultat ......... +35
  • > 100k abonnés (lus dans le snippet) .......... +25
  • personnalité présente sur Wikipédia ........... +25
  • badge vérifié détecté dans le texte ........... +20
  • même handle sur ≥ 2 plateformes ............... +15
  • URL de profil « propre » (pas un post/vidéo) .. +10

Paliers d'affichage :
  ≥ 90 → « officiel »            (official = True)
  70-89 → « probablement officiel »
  < 70 → « non confirmé »        (masqué du détail, listé en « non détecté »)
"""

import asyncio
import re
import unicodedata
from typing import Optional

import httpx

from app.services._search_backend import has_search_backend, search
from app.services.social_presence_models import (
    DISPLAY_THRESHOLD,
    PlatformHit,
    SocialPresenceResult,
)

# (nom d'affichage, domaine) — l'ordre fixe l'ordre d'affichage
_PLATFORMS: list[tuple[str, str]] = [
    ("Instagram", "instagram.com"),
    ("TikTok", "tiktok.com"),
    ("YouTube", "youtube.com"),
    ("X (Twitter)", "x.com"),
]

_TIMEOUT = 15.0
_OFFICIAL_THRESHOLD = 90  # ≥ 90 → compte considéré officiel

# Segments d'URL qui ne sont PAS une page de profil (posts, vidéos, recherche…)
_NON_PROFILE_SEGMENTS: dict[str, tuple[str, ...]] = {
    "instagram.com": ("/p/", "/reel/", "/reels/", "/tv/", "/explore/", "/stories/"),
    "tiktok.com": ("/video/", "/tag/", "/discover", "/music/"),
    "youtube.com": ("/watch", "/playlist", "/shorts/", "/results", "/hashtag/", "/feed"),
    "x.com": ("/status/", "/search", "/hashtag/", "/i/"),
}

# Extraction du handle depuis l'URL de profil, par plateforme
_USERNAME_PATTERNS: dict[str, re.Pattern] = {
    "instagram.com": re.compile(r"instagram\.com/([A-Za-z0-9_.]+)/?"),
    "tiktok.com": re.compile(r"tiktok\.com/@([A-Za-z0-9_.]+)/?"),
    "youtube.com": re.compile(r"youtube\.com/(?:@|c/|user/|channel/)([A-Za-z0-9_.\-]+)/?"),
    "x.com": re.compile(r"(?:x|twitter)\.com/([A-Za-z0-9_]+)/?"),
}

# Abonnés : « 14.5M subscribers », « 5,2 M abonnés », « 1 038 followers »…
_FOLLOWERS_RE = re.compile(
    r"([0-9][0-9.,   ]*)\s*([KMBkmb])?\s*"
    r"(?:subscribers?|abonn[ée]s?|followers?|suivis?)",
    re.IGNORECASE,
)

# Badge vérifié éventuellement mentionné dans le texte SERP (rare mais fiable)
_VERIFIED_RE = re.compile(r"\b(?:verified account|compte certifi[ée]|✓ verified)\b", re.IGNORECASE)

_WIKI_HEADERS = {
    "User-Agent": "Unmask/1.0 (https://unmask.fr; contact@unmask.fr) python-httpx",
    "Accept": "application/json",
}


# ---------------------------------------------------------------------------
# Normalisation
# ---------------------------------------------------------------------------

def _strip_accents(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn"
    )


def _compact(text: str) -> str:
    """Minuscules, sans accents, sans espace/tiret/underscore/point.

    « Cyprien », « cyprien_officiel », « Cyprien-Officiel » → comparables.
    """
    text = _strip_accents(text).lower()
    return re.sub(r"[\s\-_.]+", "", text)


def _normalize_query(raw: str) -> str:
    return raw.strip().lstrip("@").strip()


# ---------------------------------------------------------------------------
# Extraction depuis les métadonnées SERP
# ---------------------------------------------------------------------------

def _extract_username(url: str, domain: str) -> str:
    pattern = _USERNAME_PATTERNS.get(domain)
    if not pattern:
        return ""
    m = pattern.search(url)
    return m.group(1) if m else ""


def _is_profile_url(url: str, domain: str) -> bool:
    """Vrai si l'URL pointe vers une page de profil (pas un post/une vidéo)."""
    if not url or domain not in url:
        return False
    low = url.lower()
    # music.youtube.com référence des albums/playlists, pas la chaîne du créateur.
    if "music.youtube.com" in low:
        return False
    if any(seg in low for seg in _NON_PROFILE_SEGMENTS.get(domain, ())):
        return False
    return bool(_extract_username(url, domain))


def _is_youtube_channel_id(username: str) -> bool:
    """Identifiant de chaîne YouTube brut (ex. UCL9aTJb0ur4...), non lisible."""
    return bool(re.fullmatch(r"UC[A-Za-z0-9_\-]{20,}", username or ""))


def _youtube_name_from_title(title: str) -> str:
    """Déduit le nom de chaîne du titre SERP (« Inoxtag - YouTube » → « Inoxtag »)."""
    return re.sub(r"\s*[-–|]\s*YouTube.*$", "", title or "", flags=re.IGNORECASE).strip()


def _extract_followers(text: str) -> tuple[str, int]:
    """Retourne (libellé lisible, nombre entier) ou ('', 0) si absent."""
    m = _FOLLOWERS_RE.search(text or "")
    if not m:
        return "", 0
    num_raw, suffix = m.group(1), (m.group(2) or "").upper()
    cleaned = num_raw.strip().replace(" ", "").replace(" ", "").replace(" ", "")
    cleaned = cleaned.replace(",", ".").rstrip(".")
    try:
        value = float(cleaned)
    except ValueError:
        return "", 0
    mult = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}.get(suffix, 1)
    count = int(value * mult)
    label = f"{cleaned}{suffix}" if suffix else str(int(value)) if value.is_integer() else cleaned
    return label, count


# ---------------------------------------------------------------------------
# Signal global : présence sur Wikipédia
# ---------------------------------------------------------------------------

async def _on_wikipedia(name: str, client: httpx.AsyncClient) -> bool:
    """Vrai si une page Wikipédia (FR ou EN) correspond à ce nom.

    Utilise l'API de recherche (et non le slug exact) : robuste pour les
    pseudos mononymes (« Cyprien » → page « Cyprien Iov », « Michou » →
    « Michou (vidéaste) »). On valide via correspondance du nom sur le titre.
    """
    name_compact = _compact(name)
    for lang in ("fr", "en"):
        try:
            resp = await client.get(
                f"https://{lang}.wikipedia.org/w/api.php",
                params={
                    "action": "query", "list": "search",
                    "srsearch": name, "srlimit": 1, "format": "json",
                },
                timeout=_TIMEOUT,
                headers=_WIKI_HEADERS,
            )
            if resp.status_code != 200:
                continue
            hits = resp.json().get("query", {}).get("search", [])
            if not hits:
                continue
            title_compact = _compact(hits[0].get("title", ""))
            if title_compact and (name_compact in title_compact or title_compact in name_compact):
                return True
        except Exception:
            pass
    return False


# ---------------------------------------------------------------------------
# Recherche par plateforme → candidat brut (sans confiance finale)
# ---------------------------------------------------------------------------

async def _search_platform(
    name: str, platform: str, domain: str, client: httpx.AsyncClient,
) -> PlatformHit:
    query = f'"{name}" site:{domain}'
    try:
        results = await search(query, num=5, client=client)
    except Exception:
        return PlatformHit(platform=platform, domain=domain, found=False)

    name_compact = _compact(name)
    candidates: list[tuple[tuple, PlatformHit]] = []

    for index, r in enumerate(results):
        url = r.get("link", "")
        if not _is_profile_url(url, domain):
            continue

        title = r.get("title", "")
        snippet = r.get("snippet", "")
        username = _extract_username(url, domain)
        # Chaîne YouTube en /channel/UC… : on affiche le nom (titre) plutôt que l'ID.
        if domain == "youtube.com" and _is_youtube_channel_id(username):
            username = _youtube_name_from_title(title) or username
        haystack = _compact(f"{title} {snippet}")
        user_compact = _compact(username)

        name_in_title = name_compact in _compact(title)
        name_coherent = (
            name_in_title
            or name_compact in haystack
            or (user_compact and (user_compact in name_compact or name_compact in user_compact))
        )
        # On n'accepte un résultat que s'il est cohérent avec le nom recherché,
        # pour éviter de rattacher un homonyme ou un compte sans rapport.
        if not name_coherent:
            continue

        followers_label, followers_count = _extract_followers(f"{title} {snippet}")
        hit = PlatformHit(
            platform=platform,
            domain=domain,
            found=True,
            profile_url=url,
            title=title,
            snippet=snippet,
            username=username,
            followers=followers_label,
            verified=bool(_VERIFIED_RE.search(f"{title} {snippet}")),
            confidence=0,  # calculée plus tard (besoin des signaux globaux)
            confidence_reasons=["nom dans le titre"] if name_in_title else ["nom cohérent"],
        )
        # Tri : on préfère un profil avec abonnés, puis nom dans le titre,
        # puis le mieux classé par Google (index croissant).
        rank = (followers_count > 0, name_in_title, -index)
        candidates.append((rank, hit))

    if not candidates:
        return PlatformHit(platform=platform, domain=domain, found=False)

    candidates.sort(key=lambda c: c[0], reverse=True)
    return candidates[0][1]


# ---------------------------------------------------------------------------
# Scoring de confiance (après collecte de tous les signaux)
# ---------------------------------------------------------------------------

def _score_hit(hit: PlatformHit, on_wikipedia: bool, cross_platform: bool) -> None:
    """Calcule confidence + verification_status sur place selon les signaux."""
    score = 0
    reasons: list[str] = []

    name_in_title = "nom dans le titre" in hit.confidence_reasons
    if name_in_title:
        score += 35
        reasons.append("nom présent dans le titre (+35)")
    else:
        score += 15
        reasons.append("nom cohérent (+15)")

    _, count = _extract_followers(f"{hit.title} {hit.snippet}")
    if count >= 100_000:
        score += 25
        reasons.append(f"audience élevée : {hit.followers} (+25)")

    if on_wikipedia:
        score += 25
        reasons.append("personnalité présente sur Wikipédia (+25)")

    if hit.verified:
        score += 20
        reasons.append("badge vérifié détecté (+20)")

    if cross_platform:
        score += 15
        reasons.append("même handle sur plusieurs plateformes (+15)")

    if _extract_username(hit.profile_url or "", hit.domain):
        score += 10
        reasons.append("URL de profil dédiée (+10)")

    hit.confidence = min(100, score)
    hit.confidence_reasons = reasons

    if hit.confidence >= _OFFICIAL_THRESHOLD:
        hit.verification_status = "official"
    elif hit.confidence >= DISPLAY_THRESHOLD:
        hit.verification_status = "probable"
    else:
        hit.verification_status = "unconfirmed"


def _apply_scoring(hits: list[PlatformHit], on_wikipedia: bool) -> None:
    # Un handle est « multi-plateformes » si sa forme compacte apparaît ≥ 2 fois.
    counts: dict[str, int] = {}
    for h in hits:
        if h.found and h.username:
            counts[_compact(h.username)] = counts.get(_compact(h.username), 0) + 1

    for h in hits:
        if not h.found:
            h.verification_status = "not_found"
            continue
        cross = counts.get(_compact(h.username), 0) >= 2 if h.username else False
        _score_hit(h, on_wikipedia, cross)


# ---------------------------------------------------------------------------
# API publique
# ---------------------------------------------------------------------------

async def find_social_presence(query: str) -> SocialPresenceResult:
    """
    Cherche la présence de `query` sur chaque plateforme cible.
    `query` accepte : nom prénom, @handle, raison sociale.
    """
    if not query or not query.strip():
        return SocialPresenceResult(
            warning="Query requise pour la recherche de présence sociale.",
            available=False,
        )

    if not has_search_backend():
        return SocialPresenceResult(
            warning="Aucune clé API de recherche configurée (SERPER_API_KEY ou GOOGLE_CSE_API_KEY+ID).",
            available=False,
        )

    raw = query.strip()
    name = _normalize_query(raw)

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        platform_tasks = [
            _search_platform(name, platform, domain, client)
            for platform, domain in _PLATFORMS
        ]
        wiki_task = _on_wikipedia(name, client)
        *hits, on_wikipedia = await asyncio.gather(*platform_tasks, wiki_task)

    _apply_scoring(hits, bool(on_wikipedia))

    shown = [h for h in hits if h.found and h.confidence >= DISPLAY_THRESHOLD]
    return SocialPresenceResult(
        query=raw,
        hits=list(hits),
        found_count=len(shown),
        confirmed_count=sum(1 for h in shown if h.confidence >= _OFFICIAL_THRESHOLD),
    )
