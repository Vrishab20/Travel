"""Trip preference models."""
from typing import Literal
from pydantic import BaseModel, Field


class Travellers(BaseModel):
    adults: int = Field(default=1, ge=1)
    children: int = Field(default=0, ge=0)
    infants: int = Field(default=0, ge=0)


class BudgetPreference(BaseModel):
    amount: float = Field(gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)


class FlightPreference(BaseModel):
    cabin_class: Literal["economy", "premium_economy", "business", "first"] | None = None
    direct_flights_preferred: bool | None = None
    checked_bags: int | None = Field(default=None, ge=0)


class TripPreferences(BaseModel):
    origin_country: str
    origin_city: str | None = None

    destination_country: str
    destination_cities: list[str] = Field(default_factory=list)

    departure_date: str | None = None
    return_date: str | None = None

    travellers: Travellers = Field(default_factory=Travellers)

    budget: BudgetPreference | None = None
    travel_style: Literal["budget", "balanced", "comfort", "luxury"] | None = None
    interests: list[str] = Field(default_factory=list)

    accommodation_preference: str | None = None
    flight_preference: FlightPreference | None = None

    pace: Literal["relaxed", "balanced", "packed"] | None = None
    accessibility_needs: list[str] = Field(default_factory=list)
    dietary_preferences: list[str] = Field(default_factory=list)
    notes: str | None = None
