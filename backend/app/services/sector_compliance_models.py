"""Modèles du pilier Conformité secteurs — loi influenceurs du 9 juin 2023."""

from dataclasses import dataclass, field
from typing import Literal, Optional

Status = Literal["clean", "disclosed", "undisclosed"]


@dataclass
class SectorSignal:
    sector: str        # ex. "crypto/trading", "médecine esthétique"
    keyword: str       # mot-clé déclencheur trouvé
    context: str       # extrait du contenu source
    url: str = ""      # lien vers la source

    def to_dict(self) -> dict:
        return {
            "sector": self.sector,
            "keyword": self.keyword,
            "context": self.context,
            "url": self.url,
        }


@dataclass
class SectorComplianceResult:
    score: int = 20                             # 0 | 10 | 20
    status: Status = "clean"                    # clean | disclosed | undisclosed
    label: str = ""
    has_disclaimer: bool = False
    signals: list[SectorSignal] = field(default_factory=list)
    summary: str = ""
    sources: list[dict] = field(default_factory=list)
    warning: Optional[str] = None
    available: bool = True

    def to_dict(self) -> dict:
        return {
            "score": self.score,
            "status": self.status,
            "label": self.label,
            "has_disclaimer": self.has_disclaimer,
            "signals": [s.to_dict() for s in self.signals],
            "summary": self.summary,
            "sources": self.sources,
            "warning": self.warning,
            "available": self.available,
            "source": "Claude Haiku 4.5 (web_search) — loi 9 juin 2023",
        }
