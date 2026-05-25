"""Modeles de donnees du pilier 3 - Analyse du discours (Claude API)."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class DiscourseSignal:
    type: str
    quote: str
    explanation: str

    def to_dict(self) -> dict:
        return {"type": self.type, "quote": self.quote, "explanation": self.explanation}


@dataclass
class DiscourseResult:
    manipulation_score: int
    signals: list[DiscourseSignal] = field(default_factory=list)
    summary: str = ""
    verdict: str = "safe"
    warning: Optional[str] = None
    available: bool = True

    def to_dict(self) -> dict:
        return {
            "manipulation_score": self.manipulation_score,
            "signals": [s.to_dict() for s in self.signals],
            "summary": self.summary,
            "verdict": self.verdict,
            "warning": self.warning,
            "available": self.available,
        }
