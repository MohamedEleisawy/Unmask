"""Modèles — présence sociale avec score de confiance."""

from dataclasses import dataclass, field
from typing import Optional

# Seuil d'affichage : un compte n'est montré que si confidence >= ce seuil.
DISPLAY_THRESHOLD = 70


@dataclass
class PlatformHit:
    platform: str
    domain: str
    found: bool
    profile_url: Optional[str] = None
    title: str = ""
    snippet: str = ""
    # Identité enrichie du compte
    username: str = ""          # handle extrait de l'URL (ex. "IbraTV")
    followers: str = ""         # libellé lisible (ex. "2.3M")
    verified: bool = False      # badge de vérification détecté
    # Score 0-100 : >= 80 confirmé, 70-79 probable, < 70 non affiché
    confidence: int = 0
    # "confirmed" | "probable" | "unverified" | "not_found"
    verification_status: str = "not_found"
    confidence_reasons: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        show = self.found and self.confidence >= DISPLAY_THRESHOLD
        return {
            "platform":            self.platform,
            "domain":              self.domain,
            "found":               show,
            "profile_url":         self.profile_url if show else None,
            "url":                 self.profile_url if show else None,
            "title":               self.title if show else "",
            "snippet":             self.snippet if show else "",
            "username":            self.username if show else "",
            "followers":           self.followers if show else "",
            "verified":            self.verified if show else False,
            "official":            show and self.confidence >= 90,
            "confidence":          self.confidence,
            "verification_status": self.verification_status,
            "confidence_reasons":  self.confidence_reasons,
        }


@dataclass
class SocialPresenceResult:
    query: str = ""
    hits: list[PlatformHit] = field(default_factory=list)
    found_count: int = 0
    confirmed_count: int = 0
    warning: Optional[str] = None
    available: bool = True

    def to_dict(self) -> dict:
        return {
            "query":           self.query,
            "hits":            [h.to_dict() for h in self.hits],
            "found_count":     self.found_count,
            "confirmed_count": self.confirmed_count,
            "warning":         self.warning,
            "available":       self.available,
            "source":          "Serper Knowledge Graph + recherche site:",
        }
