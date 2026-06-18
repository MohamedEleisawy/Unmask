"""Configuration centralisée — lit les variables d'environnement."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def _csv_env(name: str, default: str = "") -> list[str]:
    """Lit une variable d'env CSV (ex. 'a,b,c') et retourne la liste nettoyée."""
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


# --- Clés API ---
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")
GOOGLE_CSE_API_KEY: str = os.getenv("GOOGLE_CSE_API_KEY", "")
GOOGLE_CSE_ID: str = os.getenv("GOOGLE_CSE_ID", "")
SERPER_API_KEY: str = os.getenv("SERPER_API_KEY", "")

# --- Déploiement ---
# Origines autorisées par CORS. Jamais "*" : défaut sûr couvrant le front local
# (dev) + le front Vercel (prod). Surchargeable via la variable d'env
# ALLOWED_ORIGINS (CSV) sur l'hébergeur. Ne jamais réintroduire le wildcard.
ALLOWED_ORIGINS: list[str] = _csv_env(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,https://unmask-gamma.vercel.app",
)

# TTL du cache liste noire AMF (secondes). 6h par défaut.
AMF_CACHE_TTL_SECONDS: int = int(os.getenv("AMF_CACHE_TTL_SECONDS", "21600"))


def key_status() -> dict[str, bool]:
    """État de chargement des clés API (booléens — jamais les valeurs).

    Sert au diagnostic en prod (logs de démarrage + /health) : permet de voir
    immédiatement si une clé manque sur l'hébergeur (Render, etc.).
    """
    return {
        "ANTHROPIC_API_KEY": bool(ANTHROPIC_API_KEY),
        "SERPER_API_KEY": bool(SERPER_API_KEY),
        "GOOGLE_CSE_API_KEY": bool(GOOGLE_CSE_API_KEY),
        "GOOGLE_CSE_ID": bool(GOOGLE_CSE_ID),
        "YOUTUBE_API_KEY": bool(YOUTUBE_API_KEY),
    }
