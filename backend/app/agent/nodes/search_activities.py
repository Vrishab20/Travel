"""Search for activity recommendations."""
from app.agent.state import TravelAgentState
from app.providers.places.base import ActivitySearchRequest, PlacesProvider


async def search_activities(state: TravelAgentState, places_provider: PlacesProvider) -> dict:
    """Search for activities using provider."""
    preferences = state.get("preferences")
    if not preferences or not preferences.destination_cities:
        return {"errors": [{"node": "search_activities", "message": "No destination cities", "recoverable": False}]}
    
    try:
        request = ActivitySearchRequest(
            cities=preferences.destination_cities,
            interests=preferences.interests,
            travel_style=preferences.travel_style,
        )
        
        results = await places_provider.search_activities(request)
        
        return {
            "activity_results": results,
            "provider_statuses": {"activities": "succeeded"},
        }
    except Exception as e:
        return {
            "errors": [{
                "node": "search_activities",
                "message": str(e),
                "recoverable": True,
                "provider": "activities",
            }],
            "provider_statuses": {"activities": "failed"},
        }
