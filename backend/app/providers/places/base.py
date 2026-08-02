"""Places and activities provider protocol."""
from typing import Protocol
from pydantic import BaseModel

from app.models.activity import ActivityRecommendation


class ActivitySearchRequest(BaseModel):
    """Request parameters for activity search."""

    cities: list[str]
    interests: list[str] = []
    travel_style: str | None = None


class PlacesProvider(Protocol):
    """Protocol for places and activities providers."""

    async def search_activities(
        self,
        request: ActivitySearchRequest,
    ) -> list[ActivityRecommendation]:
        """Search for activity and place recommendations."""
        ...
