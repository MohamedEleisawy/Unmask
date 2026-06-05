"""
Correction OSINT du nom saisi par l'utilisateur.

Claude Haiku corrige les fautes, accents manquants, et identifie
le handle probable de l'influenceur/entite pour cibler les bons comptes.

Ex: "lena situation" → nom_officiel="Léna Situations", handle="lenasituations"
    "sarah frasou"  → nom_officiel="Sarah Fraisou",    handle="sarahfraisou"
    "squezie"       → nom_officiel="Squeezie",          handle="squeezie"
"""

import json
from dataclasses import dataclass

from app.config import ANTHROPIC_API_KEY

_MODEL = "claude-haiku-4-5-20251001"

_SYSTEM_PROMPT = """Tu es un expert OSINT specialise dans l'identification d'influenceurs et d'entites françaises.

Ton role : corriger les fautes d'orthographe, les accents manquants et les erreurs de frappe pour retrouver le nom officiel exact et le handle social media de la cible.

INSTRUCTIONS :
1. Corrige l'orthographe et les accents (ex: "lena situation" -> "Léna Situations")
2. Deduis la cible la plus probable selon la popularite
3. Le handle est le nom de compte sur les reseaux : sans espaces, sans accents, en minuscules

Retourne UNIQUEMENT ce JSON (sans texte autour) :
{
  "nom_officiel": "<nom corrige et accentue>",
  "handle_probable": "<handle sans espace ni accent>",
  "confiance": <nombre entre 0.0 et 1.0>
}

Exemples :
"lena situation"  -> {"nom_officiel": "Léna Situations", "handle_probable": "lenasituations", "confiance": 0.95}
"squeezie"        -> {"nom_officiel": "Squeezie", "handle_probable": "squeezie", "confiance": 0.99}
"squezie"         -> {"nom_officiel": "Squeezie", "handle_probable": "squeezie", "confiance": 0.90}
"sarah frasou"    -> {"nom_officiel": "Sarah Fraisou", "handle_probable": "sarahfraisou", "confiance": 0.85}
"mcfly et carlito"-> {"nom_officiel": "McFly et Carlito", "handle_probable": "mcflyetcarlito", "confiance": 0.97}
"amazon"          -> {"nom_officiel": "Amazon", "handle_probable": "amazon", "confiance": 0.99}
"""


@dataclass
class CorrectedName:
    nom_officiel: str
    handle_probable: str
    confiance: float
    original: str


async def correct_name(user_input: str) -> CorrectedName:
    """Corrige le nom saisi et retourne le nom officiel + handle probable."""
    original = user_input.strip()

    if not ANTHROPIC_API_KEY or not original:
        return CorrectedName(
            nom_officiel=original,
            handle_probable=original.lower().replace(" ", ""),
            confiance=0.0,
            original=original,
        )

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
        msg = await client.messages.create(
            model=_MODEL,
            max_tokens=80,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f'Identifie et corrige : "{original}"'}],
        )
        raw = msg.content[0].text.strip()
        start, end = raw.find("{"), raw.rfind("}") + 1
        data = json.loads(raw[start:end])

        return CorrectedName(
            nom_officiel=data.get("nom_officiel", original),
            handle_probable=data.get("handle_probable", "").lower().replace(" ", ""),
            confiance=float(data.get("confiance", 0.5)),
            original=original,
        )
    except Exception:
        return CorrectedName(
            nom_officiel=original,
            handle_probable=original.lower().replace(" ", ""),
            confiance=0.0,
            original=original,
        )
