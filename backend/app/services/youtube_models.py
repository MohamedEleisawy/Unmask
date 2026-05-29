"""Modeles de donnees du pilier 4 - Coherence d'engagement YouTube."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class EngagementFlag:
    type: str
    severity: str  # "info" | "warning" | "suspicious"
    detail: str

    def to_dict(self) -> dict:
        return {"type": self.type, "severity": self.severity, "detail": self.detail}


@dataclass
class YoutubeResult:
    channel_id: str = ""
    channel_name: str = ""
    subscribers: Optional[int] = None
    total_views: Optional[int] = None
    video_count: Optional[int] = None
    avg_views_per_video: Optional[float] = None
    engagement_ratio: Optional[float] = None  # vues/abonnes
    flags: list[EngagementFlag] = field(default_factory=list)
    engagement_score: int = 100  # 100 = sain
    channel_url: str = ""
    warning: Optional[str] = None
    available: bool = True

    def to_dict(self) -> dict:
        return {
            "channel_id": self.channel_id,
            "channel_name": self.channel_name,
            "subscribers": self.subscribers,
            "total_views": self.total_views,
            "video_count": self.video_count,
            "avg_views_per_video": round(self.avg_views_per_video, 0) if self.avg_views_per_video else None,
            "engagement_ratio": round(self.engagement_ratio, 4) if self.engagement_ratio else None,
            "flags": [f.to_dict() for f in self.flags],
            "engagement_score": self.engagement_score,
            "channel_url": self.channel_url,
            "warning": self.warning,
            "available": self.available,
            "source": "YouTube Data API v3",
            "source_url": "https://developers.google.com/youtube/v3",
        }
