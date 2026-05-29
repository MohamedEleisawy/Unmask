"""Modeles de donnees du pilier 2 - Transparence partenariats (loi 2023-451)."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class PartnershipFlag:
    rule: str
    severity: str  # "warning" | "violation"
    detail: str
    source: str = "Loi n°2023-451 du 9 juin 2023"
    source_url: str = "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047663185"

    def to_dict(self) -> dict:
        return {
            "rule": self.rule,
            "severity": self.severity,
            "detail": self.detail,
            "source": self.source,
            "source_url": self.source_url,
        }


@dataclass
class PartnershipResult:
    has_disclosure: bool
    flags: list[PartnershipFlag] = field(default_factory=list)
    score: int = 0
    warning: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "has_disclosure": self.has_disclosure,
            "flags": [f.to_dict() for f in self.flags],
            "compliance_score": self.score,
            "warning": self.warning,
            "source": "Analyse automatique — Loi influenceurs 2023",
        }
