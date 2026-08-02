"""Money and flight recommendation models."""
from typing import Literal
from pydantic import BaseModel, Field


class Money(BaseModel):
    amount: float
    currency: str = Field(default="USD")


class FlightRecommendation(BaseModel):
    id: str
    provider: str
    airline: str
    flight_numbers: list[str]
    origin_airport: str
    destination_airport: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    stops: int
    cabin_class: str
    price: Money
    baggage_summary: str | None = None
    booking_url: str | None = None
    is_mock_data: bool = True
    recommendation_category: Literal[
        "best_value", "best_schedule", "most_comfortable"
    ] | None = None
    recommendation_reason: str
