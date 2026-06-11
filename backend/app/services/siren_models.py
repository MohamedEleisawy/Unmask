"""Modeles de donnees du pilier 1 - Identite legale (data.gouv.fr)."""

from dataclasses import dataclass
from typing import Optional


_NON_TROUVE = "Information non trouvée"


@dataclass
class LegalIdentity:
    """Informations legales d'une entite trouvee sur data.gouv.fr."""

    siren: str
    nom: str
    est_actif: bool
    date_creation: Optional[str]
    date_fermeture: Optional[str]
    forme_juridique: Optional[str]
    adresse: Optional[str]
    est_entrepreneur_individuel: bool
    source_url: str
    siret: Optional[str] = None
    activite: Optional[str] = None
    dirigeant: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "siren": self.siren,
            "nom": self.nom,
            "est_actif": self.est_actif,
            "date_creation": self.date_creation,
            "date_fermeture": self.date_fermeture,
            "forme_juridique": self.forme_juridique,
            "adresse": self.adresse,
            "est_entrepreneur_individuel": self.est_entrepreneur_individuel,
            "siret": self.siret,
            "activite": self.activite,
            "dirigeant": self.dirigeant,
            "source": "Annuaire des Entreprises (data.gouv.fr)",
            "source_url": self.source_url,
            # Bloc "Entreprise" prêt à afficher (jamais inventé : champs manquants
            # explicitement marqués "Information non trouvée").
            "company": {
                "company_name": self.nom or _NON_TROUVE,
                "siren": self.siren or _NON_TROUVE,
                "siret": self.siret or _NON_TROUVE,
                "legal_status": self.forme_juridique or _NON_TROUVE,
                "creation_date": self.date_creation or _NON_TROUVE,
                "activity": self.activite or _NON_TROUVE,
                "manager": self.dirigeant or _NON_TROUVE,
            },
        }


@dataclass
class LegalCheckResult:
    """Resultat complet de la verification d'identite legale."""

    found: bool
    identity: Optional[LegalIdentity]
    query_used: str
    warning: Optional[str]
    # Indicateur comportemental (hors score) : nombre d'entreprises liées au nom
    # qui sont fermées/radiées/cessées, sur le total examiné. Sert au signal
    # « multiple_closed_companies ».
    closed_companies_count: int = 0
    examined_companies_count: int = 0

    def to_dict(self) -> dict:
        return {
            "found": self.found,
            "identity": self.identity.to_dict() if self.identity else None,
            "query_used": self.query_used,
            "warning": self.warning,
            "closed_companies_count": self.closed_companies_count,
            "examined_companies_count": self.examined_companies_count,
        }
