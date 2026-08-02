"""Activity recommendation models."""
from typing import Literal
from pydantic import BaseModel, Field

from app.models.flight import Money


class ActivityRecommendation(BaseModel):
    id: str
    name: str
    city: str
    category: Literal[
        "attraction", "neighbourhood", "tour", "restaurant", "activity"
    ]
    description: str
    estimated_cost: Money | None = None
    duration_minutes: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    booking_url: str | None = None
    is_mock_data: bool = True
    recommendation_reason: str
