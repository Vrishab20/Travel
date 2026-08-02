"""Trip plan model aligned with frontend wire format."""
from typing import Literal
from pydantic import BaseModel, Field

from app.models.trip_preferences import TripPreferences
from app.models.flight import FlightRecommendation
from app.models.hotel import HotelRecommendation
from app.models.activity import ActivityRecommendation
from app.models.itinerary import ItineraryDay
from app.models.budget import TripBudget


TripPlanStatus = Literal["draft", "incomplete", "ready", "partial"]


class TripPlan(BaseModel):
    id: str
    preferences: TripPreferences
    flights: list[FlightRecommendation] = Field(default_factory=list)
    hotels: list[HotelRecommendation] = Field(default_factory=list)
    activities: list[ActivityRecommendation] = Field(default_factory=list)
    itinerary: list[ItineraryDay] = Field(default_factory=list)
    budget: TripBudget | None = None
    selected_flight_id: str | None = None
    selected_hotel_ids: list[str] = Field(default_factory=list)
    status: TripPlanStatus = "incomplete"
    assumptions: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    data_freshness: dict[str, str] | None = None
    created_at: str
    updated_at: str
