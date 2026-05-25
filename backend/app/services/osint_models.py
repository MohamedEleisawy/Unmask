"""Modeles de donnees du pilier 5 - Reputation externe OSINT."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class OsintResult_item:
    title: str
    url: str
    snippet: str
    is_alert: bool

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "url": self.url,
            "snippet": self.snippet,
            "is_alert": self.is_alert,
        }


@dataclass
class OsintResult:
    query: str = ""
    alert_count: int = 0
    results: list[OsintResult_item] = field(default_factory=list)
    reputation_score: int = 100
    warning: Optional[str] = None
    available: bool = True

    def to_dict(self) -> dict:
        return {
            "query": self.query,
            "alert_count": self.alert_count,
            "results": [r.to_dict() for r in self.results],
            "reputation_score": self.reputation_score,
            "warning": self.warning,
            "available": self.available,
            "source": "Serper.dev / Google Custom Search",
        }
