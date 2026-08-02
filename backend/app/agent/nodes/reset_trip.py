"""Reset trip to initial state."""
from langchain_core.messages import AIMessage

from app.agent.state import TravelAgentState
from app.models.trip_preferences import TripPreferences


def reset_trip(state: TravelAgentState) -> dict:
    """Clear trip while preserving origin/destination countries."""
    preferences = state.get("preferences")
    
    # Keep only the country selections
    new_prefs = TripPreferences(
        origin_country=preferences.origin_country if preferences else "",
        destination_country=preferences.destination_country if preferences else "",
    )
    
    return {
        "preferences": new_prefs,
        "missing_required_fields": [],
        "flight_results": [],
        "hotel_results": [],
        "activity_results": [],
        "selected_flight_id": None,
        "selected_hotel_ids": [],
        "itinerary": [],
        "budget": None,
        "trip_plan": None,
        "user_intent": None,
        "affected_sections": [],
        "provider_statuses": {},
        "errors": [],
        "assumptions": [],
        "current_stage": "collecting_requirements",
        "messages": [AIMessage(content="I've reset your trip. Let's start fresh! Where would you like to go?")],
    }
