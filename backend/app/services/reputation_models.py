"""Modeles de donnees du sous-signal Reputation mediatique (analyse Claude).

Distinct de l'OSINT brut (osint_models) : ici Claude (via web_search) recherche
les articles de presse mentionnant l'entite dans un contexte d'arnaque/fraude,
puis evalue si chaque article nuit ou non a son image.
"""

from dataclasses import dataclass, field
from typing import Literal, Optional

# Impact d'un article sur l'image de l'entite.
Impact = Literal["harmful", "neutral", "favorable"]


@dataclass
class ReputationArticle:
    title: str
    url: str
    # "harmful" : l'entite est accusee/mise en cause.
    # "neutral" : mention factuelle sans atteinte directe.
    # "favorable" : l'entite est la source qui denonce/met en garde.
    impact: Impact
    reason: str

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "url": self.url,
            "impact": self.impact,
            "reason": self.reason,
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

    def to_dict(self) -> dict:
        return {
            "summary": self.summary,
            "reputation_score": self.reputation_score,
            "score_rationale": self.score_rationale,
            "harmful_count": self.harmful_count,
            "articles": [a.to_dict() for a in self.articles],
            "sources": self.sources,
            "warning": self.warning,
            "available": self.available,
            "source": "Claude Haiku 4.5 (web_search)",
        }
