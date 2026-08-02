"""LangGraph state definition with custom reducers."""
from typing import Annotated, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

from app.agent.reducers import (
    append_assumptions,
    append_errors,
    append_sections,
    last_value,
    merge_provider_statuses,
    replace_list,
)
from app.models.activity import ActivityRecommendation
from app.models.agent import AgentError, TravelAgentStage
from app.models.budget import TripBudget
from app.models.flight import FlightRecommendation
from app.models.hotel import HotelRecommendation
from app.models.itinerary import ItineraryDay
from app.models.trip_plan import TripPlan
from app.models.trip_preferences import TripPreferences


class TravelAgentState(TypedDict):
    """State for the travel agent graph."""

    messages: Annotated[list[BaseMessage], add_messages]

    trip_id: str
    thread_id: str

    preferences: Annotated[TripPreferences, last_value]
    missing_required_fields: Annotated[list[str], replace_list]

    flight_results: Annotated[list[FlightRecommendation], replace_list]
    hotel_results: Annotated[list[HotelRecommendation], replace_list]
    activity_results: Annotated[list[ActivityRecommendation], replace_list]

    selected_flight_id: Annotated[str | None, last_value]
    selected_hotel_ids: Annotated[list[str], replace_list]

    itinerary: Annotated[list[ItineraryDay], replace_list]
    budget: Annotated[TripBudget | None, last_value]
    trip_plan: Annotated[TripPlan | None, last_value]

    user_intent: Annotated[str | None, last_value]
    affected_sections: Annotated[list[str], append_sections]

    provider_statuses: Annotated[dict, merge_provider_statuses]

    errors: Annotated[list[AgentError], append_errors]
    assumptions: Annotated[list[str], append_assumptions]

    current_stage: Annotated[TravelAgentStage, last_value]
    should_ask_user: Annotated[bool, last_value]
    should_search: Annotated[bool, last_value]
    should_rebuild_itinerary: Annotated[bool, last_value]
    should_recalculate_budget: Annotated[bool, last_value]
    assistant_summary: Annotated[str, last_value]
