"""Itinerary models."""
from typing import Literal
from pydantic import BaseModel, Field

from app.models.flight import Money


class ItineraryItem(BaseModel):
    id: str
    start_time: str | None = None
    end_time: str | None = None
    category: Literal[
        "flight", "hotel", "transport", "activity", "food", "free_time"
    ]
    title: str
    description: str | None = None
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    estimated_cost: Money | None = None
    booking_url: str | None = None


class ItineraryDay(BaseModel):
    date: str
    city: str
    title: str
    summary: str
    items: list[ItineraryItem] = Field(default_factory=list)
    estimated_daily_cost: Money | None = None
