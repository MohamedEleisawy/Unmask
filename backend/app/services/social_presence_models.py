"""Modeles de donnees - Recherche de presence sur les reseaux sociaux."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class PlatformHit:
    platform: str
    domain: str
    found: bool
    profile_url: Optional[str] = None
    title: Optional[str] = None
    snippet: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "platform": self.platform,
            "domain": self.domain,
            "found": self.found,
            "profile_url": self.profile_url,
            "title": self.title,
            "snippet": self.snippet,
        }


@dataclass
class SocialPresenceResult:
    query: str = ""
    hits: list[PlatformHit] = field(default_factory=list)
    found_count: int = 0
    warning: Optional[str] = None
    available: bool = True

    def to_dict(self) -> dict:
        return {
            "query": self.query,
            "hits": [h.to_dict() for h in self.hits],
            "found_count": self.found_count,
            "warning": self.warning,
            "available": self.available,
            "source": "Google via Serper / CSE (operateur site:)",
        }
