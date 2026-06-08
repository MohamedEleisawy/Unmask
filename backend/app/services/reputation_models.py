"""Modeles de donnees du sous-signal Reputation mediatique (analyse Claude).

Distinct de l'OSINT brut (osint_models) : ici Claude (via web_search) recherche
les articles de presse mentionnant l'entite dans un contexte d'arnaque/fraude,
puis evalue si chaque article nuit ou non a son image.
"""

from dataclasses import dataclass, field
from typing import Literal, Optional

# Impact d'un article sur l'image de l'entite.
Impact = Literal["harmful", "neutral", "favorable"]
# Nature factuelle de l'evenement rapporte (gradation juridique).
EventType = Literal["accusation", "plainte", "enquete", "condamnation", "autre"]


@dataclass
class ReputationArticle:
    title: str
    url: str
    # "harmful" : l'entite est accusee/mise en cause.
    # "neutral" : mention factuelle sans atteinte directe.
    # "favorable" : l'entite est la source qui denonce/met en garde.
    impact: Impact
    reason: str
    # Gradation factuelle : accusation < plainte < enquete < condamnation.
    event_type: EventType = "autre"
    # Annee de l'evenement (pour la timeline), si datable.
    year: Optional[int] = None

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "url": self.url,
            "impact": self.impact,
            "reason": self.reason,
            "event_type": self.event_type,
            "year": self.year,
        }


@dataclass
class ReputationResult:
    summary: str = ""
    # 0-100 : 100 = aucune atteinte a l'image, 0 = atteinte grave averee.
    reputation_score: int = 100
    # Justification du palier de score (transparence du bareme).
    score_rationale: str = ""
    harmful_count: int = 0
    articles: list[ReputationArticle] = field(default_factory=list)
    # Sources reellement citees par Claude (web_search) — preuve verifiable.
    # Chaque entree : {"label": <titre/domaine>, "url": <url reelle de la source>}.
    sources: list[dict] = field(default_factory=list)
    warning: Optional[str] = None
    available: bool = True

    def _event_breakdown(self) -> dict:
        """Compte les articles defavorables par nature factuelle."""
        counts = {"accusation": 0, "plainte": 0, "enquete": 0, "condamnation": 0}
        for a in self.articles:
            if a.impact == "harmful" and a.event_type in counts:
                counts[a.event_type] += 1
        return counts

    def to_dict(self) -> dict:
        return {
            "summary": self.summary,
            "reputation_score": self.reputation_score,
            "score_rationale": self.score_rationale,
            "harmful_count": self.harmful_count,
            "event_breakdown": self._event_breakdown(),
            "articles": [a.to_dict() for a in self.articles],
            "sources": self.sources,
            "warning": self.warning,
            "available": self.available,
            "source": "Claude Haiku 4.5 (web_search)",
        }
