"""Route POST /audit/social-presence - Detection de presence sur les reseaux."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.social_presence_checker import find_social_presence

router = APIRouter(prefix="/audit", tags=["Presence sociale"])


class SocialPresenceRequest(BaseModel):
    query: str = Field(
        description="Nom, @handle ou raison sociale a rechercher sur les reseaux.",
        examples=["@mrbeast", "Marie Dupont"],
    )


@router.post("/social-presence", summary="Recherche de profils sociaux via Google site:")
async def social_presence(body: SocialPresenceRequest):
    if not body.query or not body.query.strip():
        raise HTTPException(status_code=422, detail="Le champ 'query' est requis.")
    result = await find_social_presence(body.query.strip())
    return result.to_dict()
