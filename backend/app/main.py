"""
Point d'entree FastAPI - Unmask Backend.

Lancement : uvicorn app.main:app --reload
Docs auto  : http://localhost:8000/docs
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import ALLOWED_ORIGINS, key_status
from app.api.compliance import router as compliance_router
from app.api.legal_identity import router as legal_identity_router
from app.api.partnerships import router as partnerships_router
from app.api.discourse import router as discourse_router
from app.api.youtube import router as youtube_router
from app.api.osint import router as osint_router
from app.api.social_presence import router as social_presence_router
from app.api.full_audit import router as full_audit_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("unmask")

# httpx loggue les URLs complètes (avec les clés API en query string) en INFO.
# On le remonte à WARNING pour ne jamais écrire de secret dans les logs (Render…).
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

app = FastAPI(
    title="Unmask API",
    description=(
        "API d'audit de crédibilité pour influenceurs et marques. "
        "Modèle « risque réel » : réputation publique notée, drapeaux réglementaires "
        "(AMF/ACPR, condamnations) qui plafonnent ; SIREN/réseaux/identité descriptifs."
    ),
    version="2.0.0",
)


@app.on_event("startup")
def _log_config() -> None:
    """Trace au démarrage quelles clés API sont chargées (sans révéler les valeurs)."""
    status = key_status()
    for name, loaded in status.items():
        logger.info("Clé %s : %s", name, "CHARGÉE" if loaded else "MANQUANTE")
    if not status["ANTHROPIC_API_KEY"]:
        logger.warning("ANTHROPIC_API_KEY manquante → analyse de réputation indisponible.")
    if not status["SERPER_API_KEY"] and not (status["GOOGLE_CSE_API_KEY"] and status["GOOGLE_CSE_ID"]):
        logger.warning("Aucun backend de recherche (Serper/CSE) → réseaux sociaux indisponibles.")
    logger.info("CORS autorisé pour : %s", ALLOWED_ORIGINS)

# CORS — origines pilotées par ALLOWED_ORIGINS (CSV) dans .env
# Dev : "*" par défaut. Prod : "https://unmask.vercel.app,https://app.unmask.fr"
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Identité légale (data.gouv.fr) — descriptif + radiations (drapeau)
app.include_router(legal_identity_router)

# Transparence partenariats (loi 2023) — analyse manuelle, hors score
app.include_router(partnerships_router)

# Analyse du discours (Claude API) — analyse manuelle, hors score
app.include_router(discourse_router)

# Cohérence engagement (YouTube Data API) — descriptif
app.include_router(youtube_router)

# Réputation externe OSINT (Serper/CSE) — descriptif/fallback
app.include_router(osint_router)

# Conformité institutionnelle (AMF/ACPR) — drapeau critique (cap 20)
app.include_router(compliance_router)

# Présence sociale (Google site:) — descriptif, hors score
app.include_router(social_presence_router)

# Orchestrateur — Audit complet (réputation notée + drapeaux réglementaires)
app.include_router(full_audit_router)


@app.get("/", tags=["Santé"])
def root():
    """Racine de l'API — évite le 404 du health-check par défaut (Render ping `/`)."""
    return {"service": "Unmask API", "status": "ok", "docs": "/docs", "health": "/health"}


@app.get("/health", tags=["Santé"])
def health_check():
    """Vérifie que l'API est opérationnelle et quelles clés sont chargées.

    `keys` ne contient que des booléens (jamais les valeurs des clés).
    Pratique pour diagnostiquer un déploiement (Render/Vercel) depuis le navigateur.
    """
    return {"status": "ok", "version": "2.0.0", "keys": key_status()}
