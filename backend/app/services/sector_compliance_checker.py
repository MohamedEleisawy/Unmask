"""
Pilier Conformite secteurs — loi influenceurs du 9 juin 2023.

Claude (Haiku 4.5) utilise web_search pour :
  1. Identifier les comptes OFFICIELS de l'entite (Instagram, TikTok, YouTube)
  2. Analyser UNIQUEMENT le contenu publie par ces comptes officiels
  3. Detecter la promotion de secteurs interdits ou des promesses de gains

Requiert : ANTHROPIC_API_KEY dans .env
"""

import json

from app.config import ANTHROPIC_API_KEY
from app.services.sector_compliance_models import (
    SectorComplianceResult,
    SectorSignal,
)

_MODEL = "claude-haiku-4-5-20251001"
_MAX_SEARCHES = 5

_SYSTEM_PROMPT = """Tu es un analyste de conformite legale specialise dans la loi francaise du 9 juin 2023 sur les influenceurs commerciaux.

ETAPE 1 — TROUVER LES COMPTES OFFICIELS
Commence par identifier les comptes officiels de l'entite. Recherche :
- "[nom] instagram officiel"
- "[nom] tiktok compte"
- "[nom] chaine youtube"

Criteres pour identifier un compte officiel :
- Badge de verification (coche bleue) OU compte le plus suivi portant ce nom
- Mentionne dans des articles de presse sur cette personne
- Lien present dans la bio d'un autre reseau officiel

IMPORTANT : n'analyse QUE le contenu PUBLIE PAR le titulaire du compte.
EXCLUS absolument : videos d'autres createurs parlant de la personne, commentaires, fan pages, compilations tierces, articles de presse.

ETAPE 2 — ANALYSER LE CONTENU OFFICIEL
Sur chaque compte officiel identifie, observe UNIQUEMENT :
- La bio / description du profil
- Les derniers posts, videos, reels publies par ce compte
- Les stories epinglees ou liens en bio

SECTEURS INTERDITS (loi 2023, art. 3-4) :
1. Chirurgie et medecine esthetique
2. Produits/services financiers non regules (crypto sans AMF, trading non encadre, forex, NFT speculatif)
3. Pronostics sportifs en abonnement
4. Abstention therapeutique
5. Sachets de nicotine
6. Commerce d'animaux sauvages
7. Alcool hors cadre reglementaire

MOTS-CLES A DETECTER (dans les posts du compte officiel UNIQUEMENT) :
Financier/Crypto : crypto, bitcoin, trading, forex, NFT, placement garanti, rendement garanti, 10x, 100x, revenus passifs, liberte financiere
Medical/Esthetique : chirurgie, botox, rhinoplastie, lifting, clinique esthetique
Pronostics : pronostic, cote, pari sportif, tip, abonnement VIP, picks

ETAPE 3 — VERIFIER LES MENTIONS LEGALES
Si signal detecte : verifie si une mention legale est presente dans le meme contenu
(#partenariat, #ad, #collaboration, "en partenariat avec", mention AMF, cadre reglementaire cite)

REGLES DE FORMULATION :
- Ne jamais ecrire "cet influenceur enfreint la loi" -> ecrire "signal detecte, a verifier"
- Ce critere est interpretatif
- En cas de doute, classer "disclosed" plutot que "undisclosed"

BAREME :
- Aucun signal sur les comptes officiels -> score=20, status="clean"
- Signal + mention legale presente -> score=10, status="disclosed"
- Signal SANS mention legale -> score=0, status="undisclosed"

LABELS EXACTS :
clean       -> "Aucun contenu lie a un secteur interdit par la loi 2023 detecte"
disclosed   -> "Contenu dans un secteur sensible (loi 2023) — mention legale presente"
undisclosed -> "Signal detecte (a verifier) : contenu dans un secteur interdit ou reglemente (loi 2023, art. 3-4) sans encadrement visible"

Retourne TON DERNIER MESSAGE comme un JSON valide UNIQUEMENT, sans texte autour :
{
  "score": <0, 10 ou 20>,
  "status": "clean|disclosed|undisclosed",
  "label": "<label exact>",
  "has_disclaimer": <true|false>,
  "official_accounts": {
    "instagram": "<url complete ou null>",
    "tiktok": "<url complete ou null>",
    "youtube": "<url complete ou null>"
  },
  "signals": [
    {"sector": "<secteur>", "keyword": "<mot-cle>", "context": "<extrait du post officiel>", "url": "<url du compte officiel>"}
  ],
  "summary": "<resume factuel et prudent en 1-2 phrases>"
}"""


def _extract_text(message) -> str:
    parts = []
    for block in message.content:
        if getattr(block, "type", None) == "text":
            parts.append(block.text)
    return "".join(parts).strip()


def _extract_sources(message) -> list[dict]:
    sources: list[dict] = []
    seen: set[str] = set()

    def _add(url, title):
        if url and url not in seen:
            seen.add(url)
            sources.append({"label": title or url, "url": url})

    for block in message.content:
        btype = getattr(block, "type", None)
        if btype == "web_search_tool_result":
            for r in getattr(block, "content", None) or []:
                _add(getattr(r, "url", None), getattr(r, "title", None))
        elif btype == "text":
            for cit in getattr(block, "citations", None) or []:
                _add(getattr(cit, "url", None), getattr(cit, "title", None))
    return sources


def _parse(raw: str) -> dict:
    start = raw.find("{")
    end = raw.rfind("}") + 1
    return json.loads(raw[start:end])


async def check_sector_compliance(entity_name: str) -> SectorComplianceResult:
    """Detecte la promotion de secteurs interdits sur les comptes officiels de l'entite."""
    if not ANTHROPIC_API_KEY:
        return SectorComplianceResult(
            warning="ANTHROPIC_API_KEY non configuree. Analyse secteurs indisponible.",
            available=False,
        )
    if not entity_name or not entity_name.strip():
        return SectorComplianceResult(
            warning="Nom d'entite requis.",
            available=False,
        )

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
        message = await client.messages.create(
            model=_MODEL,
            max_tokens=1500,
            system=_SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": (
                    f'Analyse les comptes officiels de cet influenceur : "{entity_name.strip()}". '
                    "Etape 1 : trouve ses comptes officiels Instagram, TikTok, YouTube. "
                    "Etape 2 : analyse UNIQUEMENT le contenu qu'il/elle publie sur ces comptes. "
                    "Etape 3 : detecte les secteurs interdits ou promesses de gains. "
                    "Retourne le JSON demande."
                ),
            }],
            tools=[{
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": _MAX_SEARCHES,
                "user_location": {"type": "approximate", "country": "FR"},
            }],
        )

        data = _parse(_extract_text(message))
        score = data.get("score", 20)
        if score not in (0, 10, 20):
            score = 20

        signals = [
            SectorSignal(
                sector=s.get("sector", ""),
                keyword=s.get("keyword", ""),
                context=s.get("context", ""),
                url=s.get("url", ""),
            )
            for s in data.get("signals", [])
        ]

        # Ajouter les comptes officiels aux sources
        sources = _extract_sources(message)
        official = data.get("official_accounts", {}) or {}
        for platform, url in official.items():
            if url and isinstance(url, str) and url.startswith("http"):
                sources.insert(0, {"label": f"Compte officiel {platform}", "url": url})

        return SectorComplianceResult(
            score=score,
            status=data.get("status", "clean"),
            label=data.get("label", ""),
            has_disclaimer=bool(data.get("has_disclaimer", False)),
            signals=signals,
            summary=data.get("summary", ""),
            sources=sources,
        )

    except Exception as e:
        return SectorComplianceResult(
            warning=f"Erreur analyse secteurs : {type(e).__name__}",
            available=False,
        )
