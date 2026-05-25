"""
Pilier 2 - Transparence des partenariats (loi influenceurs 2023-451).

Detecte les violations de l'obligation de mention partenariat et la promotion
de secteurs reglementes (finance, esthetique, paris sportifs).
"""

import re

from app.services.partnership_models import PartnershipFlag, PartnershipResult

# ---------------------------------------------------------------------------
# Patterns legaux (loi 2023-451)
# ---------------------------------------------------------------------------

_DISCLOSURE_PATTERNS = [
    r"#(?:sponsoris[eé]|partenariat|collaboration|publi[- ]?r[eé]dactionnel|publicite|pub\b|ad\b|sponsored|gifted)",
    r"\b(?:en partenariat avec|offert par|sponsoris[eé] par|en collaboration avec)\b",
]

_FORBIDDEN_FINANCE = [
    r"\b(?:forex|cfd|crypto(?:monnaie)?|trading|bitcoin|investissement garanti|rendement)\b",
    r"\b(?:copy.?trading|signal.?trading|formation trading)\b",
]

_FORBIDDEN_AESTHETIC = [
    r"\b(?:chirurgie|lip\s*filler|botox|rhinoplastie|liposuccion|augmentation mammaire)\b",
]

_GAMBLING_PATTERNS = [
    r"\b(?:paris sportifs?|bet365|winamax|betclic|unibet|pmu)\b",
]

_LEGAL_GAMBLING_MENTION = [
    r"\bjouez responsable\b",
    r"\binterdits? aux mineurs?\b",
    r"\bargj?\b",
]

_COMMERCIAL_SIGNALS = [
    r"\b(?:code promo|réduction|lien en bio|swipe up|utilisez mon code)\b",
    r"\b(?:offert|cadeau|gifted|c/o|courtesy of)\b",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _match_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(p, text, re.IGNORECASE) for p in patterns)


def _detect_flags(text: str, has_disclosure: bool) -> list[PartnershipFlag]:
    flags: list[PartnershipFlag] = []

    if _match_any(text, _FORBIDDEN_FINANCE):
        flags.append(PartnershipFlag(
            rule="Promotion produit financier",
            severity="violation",
            detail=(
                "Contenu potentiellement lie a la promotion de produits financiers "
                "non reglementes (trading, crypto, forex). Interdit sans agrement AMF."
            ),
        ))

    if _match_any(text, _FORBIDDEN_AESTHETIC):
        flags.append(PartnershipFlag(
            rule="Promotion acte chirurgical",
            severity="violation",
            detail="Mention d'actes chirurgicaux ou de medecine esthetique. Promotion interdite par la loi 2023-451.",
        ))

    if _match_any(text, _GAMBLING_PATTERNS) and not _match_any(text, _LEGAL_GAMBLING_MENTION):
        flags.append(PartnershipFlag(
            rule="Paris sportifs sans mention legale",
            severity="warning",
            detail='Promotion de paris sportifs sans les mentions obligatoires ("Jouez responsable", interdiction aux mineurs).',
        ))

    if _match_any(text, _COMMERCIAL_SIGNALS) and not has_disclosure:
        flags.append(PartnershipFlag(
            rule="Partenariat commercial non declare",
            severity="violation",
            detail="Contenu commercial detecte (code promo, lien, cadeau) sans mention de partenariat (#sponsorise, #publicite, etc.).",
        ))

    return flags


def _compute_score(flags: list[PartnershipFlag], has_disclosure: bool) -> int:
    deductions = sum(20 if f.severity == "violation" else 10 for f in flags)
    bonus = 10 if has_disclosure else 0
    return max(0, min(100, 100 - deductions + bonus))


# ---------------------------------------------------------------------------
# Fonction principale
# ---------------------------------------------------------------------------

def check_partnership_transparency(text: str) -> PartnershipResult:
    """Analyse un texte pour detecter les violations de la loi influenceurs 2023."""
    if not text or not text.strip():
        return PartnershipResult(
            has_disclosure=False,
            warning="Aucun texte fourni pour l'analyse.",
            score=50,
        )

    has_disclosure = _match_any(text, _DISCLOSURE_PATTERNS)
    flags = _detect_flags(text, has_disclosure)
    return PartnershipResult(
        has_disclosure=has_disclosure,
        flags=flags,
        score=_compute_score(flags, has_disclosure),
    )
