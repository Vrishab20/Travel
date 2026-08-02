"""Hotel recommendation models."""
from typing import Literal
from pydantic import BaseModel, Field

from app.models.flight import Money


class HotelRecommendation(BaseModel):
    id: str
    provider: str
    name: str
    city: str
    neighbourhood: str | None = None
    star_rating: float | None = None
    review_score: float | None = None
    check_in_date: str | None = None
    check_out_date: str | None = None
    nightly_price: Money
    total_price: Money
    amenities: list[str] = Field(default_factory=list)
    image_url: str | None = None
    booking_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_mock_data: bool = True
    recommendation_category: Literal["budget", "balanced", "premium"] | None = None
    recommendation_reason: str
