"""Hotel provider protocol."""
from typing import Protocol
from pydantic import BaseModel

from app.models.hotel import HotelRecommendation


class HotelSearchRequest(BaseModel):
    """Request parameters for hotel search."""

    city: str
    check_in_date: str
    check_out_date: str
    adults: int = 1
    children: int = 0
    rooms: int = 1


class HotelProvider(Protocol):
    """Protocol for hotel search providers."""

    async def search_hotels(
        self,
        request: HotelSearchRequest,
    ) -> list[HotelRecommendation]:
        """Search for hotel recommendations."""
        ...
