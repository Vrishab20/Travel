"""Agent-specific models for state and events."""
from typing import Literal
from pydantic import BaseModel, Field


TravelAgentStage = Literal[
    "collecting_requirements",
    "awaiting_user_input",
    "classifying_request",
    "searching_flights",
    "searching_hotels",
    "searching_activities",
    "building_itinerary",
    "calculating_budget",
    "assembling_plan",
    "ready",
    "refining",
    "partial_failure",
    "error",
]


TravelRefinementIntent = Literal[
    "provide_trip_information",
    "generate_initial_plan",
    "find_cheaper_flights",
    "find_direct_flights",
    "change_flight_preferences",
    "replace_hotel",
    "change_hotel_preferences",
    "modify_itinerary_day",
    "add_destination",
    "remove_destination",
    "change_dates",
    "change_budget",
    "change_travel_style",
    "change_interests",
    "change_dietary_preferences",
    "recalculate_budget",
    "general_trip_question",
    "start_over",
    "unknown",
]


TripPlanSection = Literal["flights", "hotels", "activities", "itinerary", "budget", "all"]


class ProviderStatuses(BaseModel):
    """Status tracking for external providers."""

    flights: str = Field(default="pending")
    hotels: str = Field(default="pending")
    activities: str = Field(default="pending")


class AgentError(BaseModel):
    """Structured error from agent execution."""

    node: str
    message: str
    recoverable: bool = Field(default=True)
    provider: str | None = None
