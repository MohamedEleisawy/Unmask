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
# Origines autorisées par CORS. En dev, "*" est acceptable.
# En prod, lister les URLs front exactes (ex. "https://unmask.vercel.app").
ALLOWED_ORIGINS: list[str] = _csv_env("ALLOWED_ORIGINS", "*")

# TTL du cache liste noire AMF (secondes). 6h par défaut.
AMF_CACHE_TTL_SECONDS: int = int(os.getenv("AMF_CACHE_TTL_SECONDS", "21600"))
