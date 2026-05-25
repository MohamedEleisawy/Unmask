"""
Service de verification d'identite legale via l'API data.gouv.fr.

Utilise l'API Recherche Entreprises (recherche-entreprises.api.gouv.fr)
pour verifier si une entite possede une existence legale declaree en France.

Pas de cle API requise - API publique et gratuite.
Source : https://recherche-entreprises.api.gouv.fr
"""

from typing import Optional

import httpx

from app.services.siren_models import LegalCheckResult, LegalIdentity

_API_BASE = "https://recherche-entreprises.api.gouv.fr/search"
_TIMEOUT = 8

# Mapping des codes nature juridique (les plus courants)
_NATURE_JURIDIQUE = {
    "1000": "Entrepreneur individuel",
    "5499": "Societe a responsabilite limitee (SARL)",
    "5710": "Societe anonyme (SA)",
    "5720": "Societe par actions simplifiee (SAS)",
    "5800": "Societe en commandite",
    "6317": "Association loi 1901",
    "9110": "Etablissement public",
    "9220": "Commune",
}


def _libelle_nature_juridique(code: Optional[str]) -> Optional[str]:
    if not code:
        return None
    return _NATURE_JURIDIQUE.get(code, f"Code {code}")


def _parse_result(data: dict) -> LegalIdentity:
    """Extrait les champs utiles d'un resultat brut de l'API."""
    siege = data.get("siege") or {}
    complements = data.get("complements") or {}
    siren = data.get("siren", "")

    return LegalIdentity(
        siren=siren,
        nom=data.get("nom_complet") or data.get("nom_raison_sociale", ""),
        est_actif=data.get("etat_administratif") == "A",
        date_creation=data.get("date_creation"),
        date_fermeture=data.get("date_fermeture"),
        forme_juridique=_libelle_nature_juridique(data.get("nature_juridique")),
        adresse=siege.get("adresse"),
        est_entrepreneur_individuel=complements.get("est_entrepreneur_individuel", False),
        source_url=f"https://annuaire-entreprises.data.gouv.fr/entreprise/{siren}",
    )


async def check_legal_identity(
    entity_name: Optional[str] = None,
    siren: Optional[str] = None,
) -> LegalCheckResult:
    """
    Verifie l'identite legale via data.gouv.fr.

    Priorite : SIREN si fourni, sinon nom d'entite.
    """
    if siren:
        query = siren.strip().replace(" ", "")
    elif entity_name:
        query = entity_name.strip()
    else:
        return LegalCheckResult(
            found=False,
            identity=None,
            query_used="",
            warning="Aucun parametre fourni (entity_name ou siren requis).",
        )

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        response = await client.get(_API_BASE, params={"q": query, "per_page": 1})
        response.raise_for_status()
        data = response.json()

    results = data.get("results", [])

    if not results:
        warning = None
        if not siren:
            warning = (
                "Aucune societe trouvee pour ce nom. "
                "Les personnes physiques sans structure juridique ne sont pas dans ce registre."
            )
        return LegalCheckResult(found=False, identity=None, query_used=query, warning=warning)

    identity = _parse_result(results[0])
    warning = None
    if not identity.est_actif:
        warning = f"La societe '{identity.nom}' existe dans le registre mais est fermee (radiation)."

    return LegalCheckResult(found=True, identity=identity, query_used=query, warning=warning)
