"""
Signal de confiance « âge du nom de domaine » via le protocole RDAP.

RDAP (Registration Data Access Protocol, RFC 9082/9083) est le successeur
standardisé de WHOIS : officiel, gratuit, sans clé API, et renvoie du JSON
structuré. On interroge le redirecteur de bootstrap https://rdap.org/domain/{domaine}
qui suit l'enregistrement IANA jusqu'au serveur RDAP du registre compétent.

Un domaine très récent n'est PAS une preuve d'arnaque, mais c'est un signal
faible (utilisé par ScamAdviser & co.) : les sites frauduleux sont souvent
créés quelques jours/semaines avant une campagne. Ce signal est donc PUREMENT
INFORMATIF — il alimente les alertes et l'audit trail, mais n'entre JAMAIS dans
le score global (cf. full_audit : les alertes domaine sont ajoutées APRÈS le
plafonnement du score).
"""

from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

import httpx

_RDAP_BASE = "https://rdap.org/domain/"
_TIMEOUT = 10.0
_HEADERS = {
    "Accept": "application/rdap+json, application/json",
    "User-Agent": "Unmask/1.0 (https://unmask.fr; contact@unmask.fr) python-httpx",
}

# Plateformes sociales / vidéo : l'âge de leur domaine racine (youtube.com…)
# ne dit rien sur l'entité auditée. On NE lance PAS RDAP dessus.
_SOCIAL_DOMAINS = {
    "instagram.com", "tiktok.com", "youtube.com", "youtu.be",
    "x.com", "twitter.com", "facebook.com", "fb.com", "linkedin.com",
    "snapchat.com", "twitch.tv", "t.me", "telegram.me", "pinterest.com",
    "linktr.ee", "beacons.ai",
}


# ---------------------------------------------------------------------------
# Extraction du domaine auditable depuis une URL
# ---------------------------------------------------------------------------

def extract_auditable_domain(url: Optional[str]) -> Optional[str]:
    """Réduit une URL au domaine enregistrable à auditer, ou None.

    - ajoute un schéma si absent (« mentor-finance.com » → parsable) ;
    - retire « www. » et les sous-domaines (RDAP s'interroge sur le domaine
      enregistré, pas un sous-domaine) en gardant les 2 derniers labels ;
    - renvoie None pour les plateformes sociales (âge non pertinent) et pour
      tout ce qui n'est pas un hôte avec point.

    NB : l'heuristique « 2 derniers labels » est imparfaite pour les SLD à
    rallonge (.co.uk) mais correcte pour les cas visés (.com/.fr/.net…).
    """
    if not url or not url.strip():
        return None
    raw = url.strip()
    if "://" not in raw:
        raw = "http://" + raw
    host = (urlparse(raw).hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    if not host or "." not in host:
        return None

    labels = host.split(".")
    registrable = ".".join(labels[-2:])
    if registrable in _SOCIAL_DOMAINS or host in _SOCIAL_DOMAINS:
        return None
    return registrable


# ---------------------------------------------------------------------------
# Niveau de risque selon l'âge
# ---------------------------------------------------------------------------

def compute_domain_risk(age_days: int) -> str:
    """Barème ScamAdviser-like : plus le domaine est jeune, plus le risque est élevé."""
    if age_days < 30:
        return "critical"
    if age_days < 90:
        return "high"
    if age_days < 180:
        return "medium"
    return "low"


# ---------------------------------------------------------------------------
# Parsing de la réponse RDAP
# ---------------------------------------------------------------------------

def _parse_iso(value: Optional[str]) -> Optional[datetime]:
    if not value or not isinstance(value, str):
        return None
    raw = value.strip().replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(raw)
    except ValueError:
        # Certains serveurs RDAP omettent l'heure/le fuseau : on retombe sur la date.
        try:
            return datetime.fromisoformat(raw[:10])
        except ValueError:
            return None


def _age_days(event_date: str) -> Optional[int]:
    dt = _parse_iso(event_date)
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    delta = datetime.now(timezone.utc) - dt
    return max(delta.days, 0)


def _registration_date(data: dict) -> Optional[str]:
    """Cherche l'événement {"eventAction": "registration"} dans `events`."""
    for ev in data.get("events") or []:
        if isinstance(ev, dict) and ev.get("eventAction") == "registration":
            return ev.get("eventDate")
    return None


def _vcard_fn(entity: dict) -> Optional[str]:
    """Extrait le nom lisible (« fn ») du vcardArray d'une entité RDAP."""
    vcard = entity.get("vcardArray")
    if not isinstance(vcard, list) or len(vcard) < 2 or not isinstance(vcard[1], list):
        return None
    for field in vcard[1]:
        if isinstance(field, list) and len(field) >= 4 and field[0] == "fn":
            val = field[3]
            if isinstance(val, str) and val.strip():
                return val.strip()
    return None


def _registrar_name(data: dict) -> Optional[str]:
    """Nom du registrar : entité dont les rôles incluent « registrar »."""
    for ent in data.get("entities") or []:
        if not isinstance(ent, dict):
            continue
        if "registrar" in (ent.get("roles") or []):
            name = _vcard_fn(ent)
            if name:
                return name
            for pid in ent.get("publicIds") or []:
                ident = pid.get("identifier") if isinstance(pid, dict) else None
                if ident:
                    return f"IANA {ident}"
    return None


# ---------------------------------------------------------------------------
# API publique du service
# ---------------------------------------------------------------------------

def _empty(domain: str, reason: str) -> dict:
    return {
        "domain": domain,
        "created_at": None,
        "age_days": None,
        "registrar": None,
        "status": [],
        "risk_level": None,
        "available": False,
        "reason": reason,
        "source": "RDAP (rdap.org)",
    }


async def get_domain_info(domain: str) -> dict:
    """Interroge RDAP et renvoie l'âge + le registrar + le niveau de risque.

    En cas d'échec (réseau, 404, format), renvoie available=False avec la cause
    — l'absence de donnée n'est jamais traitée comme un signal négatif.
    """
    if not domain:
        return _empty(domain, "Domaine vide")

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(_RDAP_BASE + domain, headers=_HEADERS)
    except Exception as exc:  # noqa: BLE001 — on consigne la cause, jamais d'exception remontée
        return _empty(domain, f"RDAP injoignable ({type(exc).__name__})")

    if resp.status_code == 404:
        return _empty(domain, "Domaine introuvable dans RDAP")
    if resp.status_code >= 400:
        return _empty(domain, f"RDAP a renvoyé {resp.status_code}")

    try:
        data = resp.json()
    except Exception:  # noqa: BLE001
        return _empty(domain, "Réponse RDAP illisible")

    status = data.get("status")
    info = {
        "domain": domain,
        "created_at": None,
        "age_days": None,
        "registrar": _registrar_name(data),
        "status": status if isinstance(status, list) else [],
        "risk_level": None,
        "available": True,
        "source": "RDAP (rdap.org)",
    }

    created_at = _registration_date(data)
    if not created_at:
        info["reason"] = "Date d'enregistrement absente de la réponse RDAP"
        return info

    age = _age_days(created_at)
    info["created_at"] = created_at
    info["age_days"] = age
    info["risk_level"] = compute_domain_risk(age) if age is not None else None
    return info


# ---------------------------------------------------------------------------
# Alertes hors-score (informatives) dérivées du signal domaine
# ---------------------------------------------------------------------------

def compute_domain_alerts(info: Optional[dict]) -> list[dict]:
    """Alertes « young_domain » — UNIQUEMENT pour les domaines jeunes.

    IMPORTANT : ces alertes sont informatives. Elles doivent être ajoutées à la
    réponse APRÈS apply_alert_cap / verdict_from_score, sinon une sévérité
    « critique » plafonnerait le score (cf. audit_scoring.apply_alert_cap).

    - risque critical (< 30 j) → sévérité « critique » ;
    - risque high (30-89 j)    → sévérité « warning » ;
    - medium / low (≥ 90 j)    → aucune alerte (domaine pas « récent »).
    """
    if not info or not info.get("available"):
        return []
    age = info.get("age_days")
    risk = info.get("risk_level")
    if age is None:
        return []

    domain = info.get("domain") or "le domaine"
    if risk == "critical":
        return [{
            "type": "young_domain",
            "severity": "critique",
            "message": "Nom de domaine très récent",
            "details": [f"Domaine : {domain}", f"Âge du domaine : {age} jours"],
        }]
    if risk == "high":
        return [{
            "type": "young_domain",
            "severity": "warning",
            "message": "Nom de domaine récent",
            "details": [f"Domaine : {domain}", f"Âge du domaine : {age} jours"],
        }]
    return []
