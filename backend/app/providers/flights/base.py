"""Flight provider protocol."""
from typing import Protocol
from pydantic import BaseModel

from app.models.flight import FlightRecommendation


class FlightSearchRequest(BaseModel):
    """Request parameters for flight search."""

    origin_city: str
    destination_city: str
    departure_date: str
    return_date: str
    adults: int = 1
    children: int = 0
    infants: int = 0
    cabin_class: str | None = None
    direct_only: bool = False


class FlightProvider(Protocol):
    """Protocol for flight search providers."""

    async def search_flights(
        self,
        request: FlightSearchRequest,
    ) -> list[FlightRecommendation]:
        """Search for flight recommendations."""
        ...
