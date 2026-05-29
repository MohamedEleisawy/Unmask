"""
Pilier 3 - Analyse du discours par LLM (Claude API).

Detecte les signaux de manipulation rhetorique, FOMO, fausses promesses,
et langage de secte dans les contenus textuels.

Requiert : ANTHROPIC_API_KEY dans .env
"""

import json

from app.config import ANTHROPIC_API_KEY
from app.services.discourse_models import DiscourseResult, DiscourseSignal

_MODEL = "claude-haiku-4-5-20251001"
_MAX_WORDS = 3000

_SYSTEM_PROMPT = """Tu es un expert en détection de manipulation rhétorique et de désinformation.
Analyse le texte fourni et retourne UNIQUEMENT un JSON valide avec cette structure exacte :
{
  "manipulation_score": <0-100>,
  "signals": [
    {"type": "<type>", "quote": "<extrait exact>", "explanation": "<explication courte>"}
  ],
  "summary": "<résumé en 1-2 phrases>",
  "verdict": "safe" | "suspicious" | "manipulative"
}

Types de signaux à détecter :
- "fomo" : Urgence artificielle, rareté fabriquée ("dernière chance", "offre limitée")
- "false_promise" : Promesses de revenus garantis, résultats irréalistes
- "social_proof_fake" : Faux témoignages, statistiques invérifiables
- "authority_claim" : Fausses expertises, certifications non vérifiables
- "cult_language" : Langage sectaire, communauté fermée, "les autres ne comprennent pas"
- "fear" : Exploitation de la peur (perdre de l'argent, rater sa vie)
- "price_anchor" : Manipulation par ancrage de prix
- "forbidden_sector" : Promotion de secteurs réglementés sans agrément

Sois factuel et précis. Si le texte est banal et sans signal, retourne manipulation_score: 0 et signals: [].
"""


def _truncate(text: str) -> str:
    words = text.split()
    if len(words) > _MAX_WORDS:
        return " ".join(words[:_MAX_WORDS]) + "\n[...texte tronque]"
    return text


def _parse_response(raw: str) -> DiscourseResult:
    """Extrait le JSON meme si le modele ajoute du texte autour."""
    start = raw.find("{")
    end = raw.rfind("}") + 1
    data = json.loads(raw[start:end])

    signals = [
        DiscourseSignal(
            type=s.get("type", ""),
            quote=s.get("quote", ""),
            explanation=s.get("explanation", ""),
        )
        for s in data.get("signals", [])
    ]

    return DiscourseResult(
        manipulation_score=int(data.get("manipulation_score", 0)),
        signals=signals,
        summary=data.get("summary", ""),
        verdict=data.get("verdict", "safe"),
    )


async def analyze_discourse(text: str) -> DiscourseResult:
    """Analyse un texte via Claude pour detecter les signaux de manipulation."""
    if not ANTHROPIC_API_KEY:
        return DiscourseResult(
            manipulation_score=0,
            summary="",
            verdict="safe",
            warning="Cle ANTHROPIC_API_KEY non configuree. Analyse du discours indisponible.",
            available=False,
        )

    if not text or not text.strip():
        return DiscourseResult(
            manipulation_score=0,
            summary="Aucun texte fourni.",
            verdict="safe",
        )

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
        message = await client.messages.create(
            model=_MODEL,
            max_tokens=1024,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Analyse ce texte :\n\n{_truncate(text)}"}],
        )
        return _parse_response(message.content[0].text.strip())

    except Exception as e:
        return DiscourseResult(
            manipulation_score=0,
            summary="",
            verdict="safe",
            warning=f"Erreur lors de l'analyse : {type(e).__name__}",
            available=False,
        )
