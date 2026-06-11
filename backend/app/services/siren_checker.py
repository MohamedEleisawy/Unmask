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


# Sections NAF (lettre → libellé) — l'API ne renvoie pas le libellé d'activité,
# seulement le code NAF + la section. On donne au moins la catégorie lisible.
_NAF_SECTIONS = {
    "A": "Agriculture, sylviculture et pêche",
    "B": "Industries extractives",
    "C": "Industrie manufacturière",
    "D": "Production et distribution d'électricité et de gaz",
    "E": "Production et distribution d'eau, assainissement, déchets",
    "F": "Construction",
    "G": "Commerce, réparation d'automobiles et de motocycles",
    "H": "Transports et entreposage",
    "I": "Hébergement et restauration",
    "J": "Information et communication",
    "K": "Activités financières et d'assurance",
    "L": "Activités immobilières",
    "M": "Activités spécialisées, scientifiques et techniques",
    "N": "Activités de services administratifs et de soutien",
    "O": "Administration publique",
    "P": "Enseignement",
    "Q": "Santé humaine et action sociale",
    "R": "Arts, spectacles et activités récréatives",
    "S": "Autres activités de services",
    "T": "Activités des ménages en tant qu'employeurs",
    "U": "Activités extra-territoriales",
}


def _libelle_nature_juridique(code: Optional[str]) -> Optional[str]:
    if not code:
        return None
    return _NATURE_JURIDIQUE.get(code, f"Code {code}")


def _libelle_activite(naf_code: Optional[str], section: Optional[str]) -> Optional[str]:
    """Combine code NAF + libellé de section (ex. « 59.11B — Information et communication »)."""
    if not naf_code and not section:
        return None
    label = _NAF_SECTIONS.get((section or "").upper())
    if naf_code and label:
        return f"{naf_code} — {label}"
    return naf_code or label


def _format_dirigeant(dirigeants: Optional[list]) -> Optional[str]:
    """Formate le premier dirigeant : « Lucas Hauchard (Gérant) ». Jamais inventé."""
    if not dirigeants:
        return None
    d = dirigeants[0] or {}
    if d.get("type_dirigeant") == "personne morale" or d.get("denomination"):
        name = (d.get("denomination") or "").strip()
    else:
        name = f"{d.get('prenoms', '')} {d.get('nom', '')}".strip().title()
    qualite = (d.get("qualite") or "").strip()
    if name and qualite:
        return f"{name} ({qualite})"
    return name or qualite or None


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
        siret=siege.get("siret"),
        activite=_libelle_activite(
            data.get("activite_principale"), data.get("section_activite_principale")
        ),
        dirigeant=_format_dirigeant(data.get("dirigeants")),
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

    # Recherche par SIREN : 1 résultat exact. Recherche par nom : on élargit à 10
    # pour pouvoir détecter d'éventuelles radiations répétées (signal comportemental).
    per_page = 1 if siren else 10
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        response = await client.get(_API_BASE, params={"q": query, "per_page": per_page})
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

    # Comptage des entreprises fermées/radiées parmi les résultats (état != "A").
    closed = sum(1 for r in results if r.get("etat_administratif") not in ("A", None))

    return LegalCheckResult(
        found=True,
        identity=identity,
        query_used=query,
        warning=warning,
        closed_companies_count=closed,
        examined_companies_count=len(results),
    )
