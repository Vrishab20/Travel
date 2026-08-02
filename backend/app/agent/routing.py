"""Routing logic for graph conditional edges."""
from app.agent.state import TravelAgentState


# Map refinement intents to affected sections
REFINEMENT_IMPACT_MAP = {
    "provide_trip_information": ["all"],
    "generate_initial_plan": ["all"],
    "find_cheaper_flights": ["flights", "budget"],
    "find_direct_flights": ["flights", "budget"],
    "change_flight_preferences": ["flights", "budget"],
    "replace_hotel": ["hotels", "itinerary", "budget"],
    "change_hotel_preferences": ["hotels", "itinerary", "budget"],
    "modify_itinerary_day": ["itinerary"],
    "add_destination": ["all"],
    "remove_destination": ["all"],
    "change_dates": ["flights", "hotels", "activities", "itinerary", "budget"],
    "change_budget": ["flights", "hotels", "budget"],
    "change_travel_style": ["activities", "itinerary"],
    "change_interests": ["activities", "itinerary"],
    "change_dietary_preferences": ["activities", "itinerary"],
    "recalculate_budget": ["budget"],
    "general_trip_question": [],
    "start_over": ["all"],
    "unknown": [],
}


def route_after_extract(state: TravelAgentState) -> str:
    """Route after extraction based on trip plan existence."""
    if state.get("trip_plan"):
        # Existing trip - go to classification
        return "classify_user_intent"
    else:
        # New trip - validate requirements
        return "validate_trip_requirements"


def route_after_validation(state: TravelAgentState) -> str:
    """Route after validation based on missing fields."""
    if state.get("missing_required_fields"):
        return "ask_for_missing_information"
    else:
        return "dispatch_searches"


def route_refinement(state: TravelAgentState) -> str:
    """Route refinement requests based on classified intent."""
    intent = state.get("user_intent", "unknown")
    
    if intent == "start_over":
        return "reset_trip"
    
    if intent == "general_trip_question":
        return "answer_trip_question"
    
    affected = REFINEMENT_IMPACT_MAP.get(intent, [])
    
    if "all" in affected:
        # Full rebuild
        return "validate_trip_requirements"
    
    if "flights" in affected:
        return "search_flights"
    
    if "hotels" in affected:
        return "search_hotels"
    
    if "activities" in affected:
        return "search_activities"
    
    if "itinerary" in affected:
        return "generate_itinerary"
    
    if "budget" in affected:
        return "calculate_budget"
    
    # Default to answering as a question
    return "answer_trip_question"
