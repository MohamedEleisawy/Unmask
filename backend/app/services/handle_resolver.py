"""
Résolution de pseudo/handle → identité civile + photo.

Ordre de priorité :
  1. Wikipédia FR/EN  → nom canonique + photo (fiable, gratuit, CORS-friendly)
  2. Serper Knowledge Graph → nom + photo (si clé valide)
  3. Google CSE organic → extraction regex en dernier recours
"""

import re
import httpx

from app.config import GOOGLE_CSE_API_KEY, GOOGLE_CSE_ID, SERPER_API_KEY

_TIMEOUT = 10

# Prénom Nom : les deux mots commencent par une majuscule suivie de minuscules
# Exclut les mots tout-en-caps (ex: PRENOM, BFM, TV)
_NAME_RE = re.compile(
    r"\b([A-ZÁÀÂÄÉÈÊËÎÏÔÙÛÜÇ][a-záàâäéèêëîïôùûüç\-]+)"
    r"\s+"
    r"([A-ZÁÀÂÄÉÈÊËÎÏÔÙÛÜÇ][a-záàâäéèêëîïôùûüç\-]+)\b"
)

# Patterns indiquant un vrai nom dans du texte
_REALNAME_CONTEXT_RE = re.compile(
    r"(?:de son vrai nom|née?|vrai(?:e)? nom|s'appelle|née? le|civil(?:e)?(?:\s*:)?)\s+"
    r"([A-ZÁÀÂÄÉÈÊËÎÏÔÙÛÜÇ][a-záàâäéèêëîïôùûüç\-]+\s+[A-ZÁÀÂÄÉÈÊËÎÏÔÙÛÜÇ][a-záàâäéèêëîïôùûüç\-]+)",
    re.IGNORECASE,
)


class ResolvedIdentity:
    def __init__(
        self,
        pseudo: str,
        real_name: str | None,
        confidence: str,
        source: str | None = None,
        image_url: str | None = None,
    ):
        self.pseudo = pseudo
        self.real_name = real_name
        self.confidence = confidence  # "high" | "medium" | "low" | "unknown"
        self.source = source
        self.image_url = image_url

    def to_dict(self) -> dict:
        return {
            "pseudo": self.pseudo,
            "real_name": self.real_name,
            "confidence": self.confidence,
            "source": self.source,
            "image_url": self.image_url,
        }


def _looks_like_pseudo(name: str, pseudo: str) -> bool:
    """True si le nom extrait ressemble trop au pseudo lui-même."""
    pseudo_words = set(pseudo.lower().split())
    name_words = set(name.lower().split())
    return name_words.issubset(pseudo_words)


def _extract_name(text: str) -> str | None:
    """Cherche d'abord un contexte explicite (vrai nom : X), puis un Prénom Nom générique."""
    m = _REALNAME_CONTEXT_RE.search(text)
    if m:
        return m.group(1).strip()
    m2 = _NAME_RE.search(text)
    return f"{m2.group(1)} {m2.group(2)}" if m2 else None


# ---------------------------------------------------------------------------
# Sources de données
# ---------------------------------------------------------------------------

_WIKI_HEADERS = {
    "User-Agent": "Unmask/1.0 (https://unmask.fr; contact@unmask.fr) python-httpx",
    "Accept": "application/json",
}


async def _wikipedia(name: str, client: httpx.AsyncClient) -> tuple[str | None, str | None]:
    """
    Cherche la personnalité sur Wikipédia FR puis EN.
    Retourne (nom_canonique, url_photo).
    """
    slugs = [name.replace(" ", "_")]
    # Essai sans accents si le premier slug échoue (ex: "Lena Situations" → "Léna Situations")
    import unicodedata
    no_accent = "".join(
        c for c in unicodedata.normalize("NFD", name) if unicodedata.category(c) != "Mn"
    ).replace(" ", "_")
    if no_accent != slugs[0]:
        slugs.append(no_accent)

    for lang in ("fr", "en"):
        for slug in slugs:
            try:
                resp = await client.get(
                    f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{slug}",
                    timeout=_TIMEOUT,
                    headers=_WIKI_HEADERS,
                )
                if resp.status_code == 200:
                    d = resp.json()
                    title = d.get("title", "").strip()
                    image = d.get("thumbnail", {}).get("source")
                    return (title or None), image
            except Exception:
                pass
    return None, None


async def _serper(query: str, client: httpx.AsyncClient) -> dict:
    resp = await client.post(
        "https://google.serper.dev/search",
        headers={"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"},
        json={"q": query, "num": 5, "gl": "fr", "hl": "fr"},
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json()


async def _google_cse(query: str, client: httpx.AsyncClient) -> list[dict]:
    resp = await client.get(
        "https://www.googleapis.com/customsearch/v1",
        params={"key": GOOGLE_CSE_API_KEY, "cx": GOOGLE_CSE_ID, "q": query, "num": 5, "lr": "lang_fr"},
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    return [
        {"title": i.get("title", ""), "link": i.get("link", ""), "snippet": i.get("snippet", "")}
        for i in resp.json().get("items", [])
    ]


# ---------------------------------------------------------------------------
# Résolution principale
# ---------------------------------------------------------------------------

async def resolve_handle(pseudo: str) -> ResolvedIdentity:
    """Résout un pseudo/nom en identité civile avec photo."""
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:

        # ── 1. Wikipédia (source la plus fiable) ──────────────────────────
        wiki_name, wiki_image = await _wikipedia(pseudo, client)
        if wiki_name:
            # Wikipédia a trouvé une page pour ce nom
            real = wiki_name if not _looks_like_pseudo(wiki_name, pseudo) else None
            confidence = "high" if real else "medium"
            return ResolvedIdentity(
                pseudo=pseudo,
                real_name=real,
                confidence=confidence,
                source=f"https://fr.wikipedia.org/wiki/{pseudo.replace(' ', '_')}",
                image_url=wiki_image,
            )

        # ── 2. Serper Knowledge Graph ──────────────────────────────────────
        if SERPER_API_KEY:
            try:
                data = await _serper(f'"{pseudo}" vrai nom prénom influenceur', client)
                kg = data.get("knowledgeGraph", {})
                kg_title = kg.get("title", "").strip()
                if kg_title and not _looks_like_pseudo(kg_title, pseudo):
                    return ResolvedIdentity(
                        pseudo=pseudo,
                        real_name=kg_title,
                        confidence="high",
                        source=kg.get("descriptionUrl"),
                        image_url=kg.get("imageUrl"),
                    )
                ab = data.get("answerBox", {})
                answer = (ab.get("answer") or ab.get("title") or "").strip()
                if answer:
                    name = _extract_name(answer) or answer
                    if name and not _looks_like_pseudo(name, pseudo):
                        _, img = await _wikipedia(name, client)
                        return ResolvedIdentity(pseudo=pseudo, real_name=name, confidence="high", image_url=img)
            except Exception:
                pass

        # ── 3. Google CSE organic (dernier recours — contexte explicite uniquement) ──
        if GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID:
            try:
                results = await _google_cse(f'"{pseudo}" vrai nom prénom', client)
                for r in results[:3]:
                    combined = f"{r.get('title', '')} {r.get('snippet', '')}"
                    # N'utilise que les patterns de contexte explicite (évite les faux positifs)
                    m = _REALNAME_CONTEXT_RE.search(combined)
                    if m:
                        name = m.group(1).strip()
                        if not _looks_like_pseudo(name, pseudo):
                            _, img = await _wikipedia(name, client)
                            return ResolvedIdentity(
                                pseudo=pseudo, real_name=name, confidence="medium",
                                source=r.get("link"), image_url=img,
                            )
            except Exception:
                pass

    return ResolvedIdentity(pseudo=pseudo, real_name=None, confidence="low")
