"""Generate day-by-day itinerary."""
from app.agent.state import TravelAgentState
from app.services.itinerary_service import generate_itinerary


def generate_itinerary_node(state: TravelAgentState) -> dict:
    """Generate itinerary from validated state."""
    preferences = state.get("preferences")
    if not preferences:
        return {}
    
    # Get selected flight
    selected_flight = None
    selected_id = state.get("selected_flight_id")
    if selected_id:
        flights = state.get("flight_results", [])
        selected_flight = next((f for f in flights if f.id == selected_id), None)
    
    # Get selected hotels
    selected_hotels = []
    selected_ids = state.get("selected_hotel_ids", [])
    if selected_ids:
        hotels = state.get("hotel_results", [])
        selected_hotels = [h for h in hotels if h.id in selected_ids]
    
    activities = state.get("activity_results", [])
    
    itinerary = generate_itinerary(
        preferences=preferences,
        flight=selected_flight,
        hotels=selected_hotels,
        activities=activities,
    )
    
    return {
        "itinerary": itinerary,
        "current_stage": "building_itinerary",
    }
