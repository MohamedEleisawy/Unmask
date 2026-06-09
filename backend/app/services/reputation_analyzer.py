"""Sous-signal Reputation mediatique - analyse d'articles via Claude + web_search.

Claude (Haiku 4.5) utilise l'outil serveur `web_search` pour rechercher les
articles de presse mentionnant l'entite dans un contexte d'arnaque/fraude, puis
evalue si chaque article nuit ou non a son image. Le score alimente le
critere 3 (reputation publique).

Distinction clef : un article ou l'entite EST accusee nuit a l'image ;
un article ou l'entite est la SOURCE qui denonce/met en garde ne nuit pas.

Requiert : ANTHROPIC_API_KEY dans .env (deja utilisee par discourse_analyzer).
Sans cle ou en cas d'erreur, l'audit retombe sur l'OSINT Serper (fallback gere
par le scoring).
"""

import json
import logging
from typing import Optional

from app.config import ANTHROPIC_API_KEY
from app.services.reputation_models import ReputationArticle, ReputationResult

_MODEL = "claude-haiku-4-5-20251001"
_MAX_SEARCHES = 5  # plafond d'appels web_search par audit (cf. quotas/cout)

_SYSTEM_PROMPT = """Tu es un analyste de reputation mediatique factuel et prudent.

Tu disposes d'un outil de recherche web. Utilise-le pour trouver UNIQUEMENT les
sources ou la personne/entite demandee est DIRECTEMENT mise en cause pour :
arnaque, escroquerie, fraude, plainte, signalement, mise en garde d'une autorite,
condamnation ou litige LA CONCERNANT.

REGLE D'INCLUSION STRICTE — ne retiens un article QUE si l'entite nommee est
elle-meme l'objet de l'accusation. EXCLUS systematiquement :
- les articles generiques sur un secteur ("les formations en ligne sont-elles une
  arnaque ?", "le dropshipping est-il une arnaque ?") ou l'entite n'est qu'un exemple ;
- les contenus ou l'entite emploie le mot "arnaque" dans un titre racoleur sans etre accusee ;
- les simples avis/comparatifs neutres qui posent la question sans accusation etayee ;
- les homonymes et les entites differentes.
En cas de doute sur le fait que l'entite soit DIRECTEMENT visee, NE retiens PAS l'article.

Pour chaque article RETENU, classe son impact :
- "harmful"  : l'entite EST nommement accusee, mise en cause, condamnee ou signalee.
- "favorable": l'entite est la SOURCE qui denonce une arnaque, ou est explicitement disculpee.
- "neutral"  : mise en cause indirecte mais bien centree sur l'entite.

Classe aussi la NATURE factuelle de l'evenement (gradation juridique) — ne JAMAIS
surclasser : une accusation n'est pas une condamnation.
- "accusation"   : reproches/temoignages publics, pas de procedure officielle citee.
- "plainte"      : depot de plainte mentionne.
- "enquete"      : enquete/instruction ouverte par une autorite (parquet, AMF...).
- "condamnation" : decision de justice/sanction d'autorite EXPLICITEMENT rapportee.
- "autre"        : ne correspond a aucune categorie ci-dessus.

Indique l'annee de l'evenement ("year", entier sur 4 chiffres) si l'article la
mentionne, sinon null. N'invente jamais d'annee.

BAREME DE NOTATION (reputation_score, 0-100, transparent et justifiable) :
- 100 : aucune mise en cause directe trouvee.
- 75-99 : 1 mise en cause mineure non etayee (rumeur, avis isole).
- 40-74 : plusieurs mises en cause concordantes ou un signalement d'autorite.
- 10-39 : accusations graves et recurrentes, plainte(s) deposee(s).
- 0-9  : condamnation judiciaire ou interdiction par une autorite.

Ne deduis jamais une culpabilite : rapporte uniquement ce que disent les sources.
Si aucune source pertinente n'existe, reputation_score = 100 et articles = [].

Apres tes recherches, retourne TON DERNIER MESSAGE comme un JSON valide UNIQUEMENT,
sans texte autour, avec cette structure exacte :
{
  "summary": "<resume neutre en 1-2 phrases>",
  "reputation_score": <0-100 selon le bareme>,
  "score_rationale": "<palier applique + justification factuelle en une phrase>",
  "articles": [
    {"title": "<titre>", "url": "<url de la source>", "impact": "harmful|neutral|favorable", "event_type": "accusation|plainte|enquete|condamnation|autre", "year": <annee ou null>, "reason": "<en quoi CETTE entite est directement visee>"}
  ]
}"""


def _extract_text(message) -> str:
    """Concatene les blocs texte de la reponse (le JSON final est dedans)."""
    parts = []
    for block in message.content:
        if getattr(block, "type", None) == "text":
            parts.append(block.text)
    return "".join(parts).strip()


def _extract_sources(message) -> list[dict]:
    """Sources reelles citees par Claude (web_search) — preuve verifiable.

    Combine les resultats de recherche bruts et les citations des blocs texte.
    """
    sources: list[dict] = []
    seen: set[str] = set()

    def _add(url, title):
        if url and url not in seen:
            seen.add(url)
            sources.append({"label": title or url, "url": url})

    for block in message.content:
        btype = getattr(block, "type", None)
        if btype == "web_search_tool_result":
            content = getattr(block, "content", None) or []
            for r in content:
                _add(getattr(r, "url", None), getattr(r, "title", None))
        elif btype == "text":
            for cit in getattr(block, "citations", None) or []:
                _add(getattr(cit, "url", None), getattr(cit, "title", None))
    return sources


_VALID_EVENTS = {"accusation", "plainte", "enquete", "condamnation", "autre"}


def _normalize_event_type(raw) -> str:
    val = str(raw or "").strip().lower()
    # tolère "enquête" accentué renvoyé par le modèle
    val = val.replace("ê", "e").replace("é", "e")
    return val if val in _VALID_EVENTS else "autre"


def _safe_year(raw) -> Optional[int]:
    """Année plausible (2000-2100) ou None — n'invente rien."""
    try:
        year = int(raw)
    except (TypeError, ValueError):
        return None
    return year if 2000 <= year <= 2100 else None


def _parse(raw: str) -> tuple[str, int, str, list[ReputationArticle]]:
    """Extrait le JSON meme si le modele ajoute du texte/balises autour."""
    start = raw.find("{")
    end = raw.rfind("}") + 1
    data = json.loads(raw[start:end])

    articles = [
        ReputationArticle(
            title=a.get("title", ""),
            url=a.get("url", ""),
            impact=a.get("impact", "neutral"),
            reason=a.get("reason", ""),
            event_type=_normalize_event_type(a.get("event_type")),
            year=_safe_year(a.get("year")),
        )
        for a in data.get("articles", [])
    ]
    score = max(0, min(100, int(data.get("reputation_score", 100))))
    return data.get("summary", ""), score, data.get("score_rationale", ""), articles


async def analyze_reputation(entity_name: str) -> ReputationResult:
    """Analyse la reputation mediatique de l'entite via Claude + web_search."""
    if not ANTHROPIC_API_KEY:
        return ReputationResult(
            warning="Cle ANTHROPIC_API_KEY non configuree. Analyse de reputation indisponible.",
            available=False,
        )

    if not entity_name or not entity_name.strip():
        return ReputationResult(
            warning="Nom d'entite requis pour l'analyse de reputation.",
            available=False,
        )

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
        message = await client.messages.create(
            model=_MODEL,
            max_tokens=2048,
            system=_SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": (
                    f'Analyse la reputation mediatique de cette entite : "{entity_name.strip()}". '
                    "Recherche les mises en cause directes la concernant, puis retourne le JSON demande."
                ),
            }],
            tools=[{
                "type": "web_search_20250305",
                "name": "web_search",
                "max_uses": _MAX_SEARCHES,
                "user_location": {"type": "approximate", "country": "FR"},
            }],
        )

        summary, score, rationale, articles = _parse(_extract_text(message))
        return ReputationResult(
            summary=summary,
            reputation_score=score,
            score_rationale=rationale,
            harmful_count=sum(1 for a in articles if a.impact == "harmful"),
            articles=articles,
            sources=_extract_sources(message),
        )

    except Exception as e:
        # Log détaillé côté serveur (visible dans les logs Render) pour diagnostiquer :
        # clé invalide, solde insuffisant, réseau bloqué… sans casser l'audit.
        logging.getLogger("unmask").warning(
            "Analyse de réputation échouée (%s) : %s", type(e).__name__, str(e)[:300]
        )
        return ReputationResult(
            warning=f"Erreur lors de l'analyse de reputation : {type(e).__name__}",
            available=False,
        )
