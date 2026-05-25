"""Modeles de donnees du pilier 6 - Conformite AMF/ACPR."""

from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass(frozen=True)
class AmfMatch:
    """Une correspondance trouvee dans la liste noire AMF."""

    matched_on: str          # "url" ou "denomination"
    matched_value: str
    categories: list[str]
    date_added: Optional[date]

    def to_dict(self) -> dict:
        return {
            "matched_on": self.matched_on,
            "matched_value": self.matched_value,
            "categories": self.categories,
            "date_added": self.date_added.isoformat() if self.date_added else None,
            "source": "ABE Infoservice (AMF/ACPR)",
            "source_url": "https://www.abe-infoservice.fr/liste-noire",
        }


@dataclass
class ComplianceResult:
    """Resultat complet de la verification AMF pour une entite."""

    is_blacklisted: bool
    matches: list[AmfMatch]
    checked: dict
    warning: Optional[str]

    def to_dict(self) -> dict:
        return {
            "is_blacklisted": self.is_blacklisted,
            "matches": [m.to_dict() for m in self.matches],
            "checked": self.checked,
            "warning": self.warning,
        }
