"""Search for flight recommendations."""
from app.agent.state import TravelAgentState
from app.providers.flights.base import FlightSearchRequest, FlightProvider


async def search_flights(state: TravelAgentState, flight_provider: FlightProvider) -> dict:
    """Search for flights using provider."""
    preferences = state.get("preferences")
    if not preferences:
        return {"errors": [{"node": "search_flights", "message": "No preferences", "recoverable": False}]}
    
    try:
        request = FlightSearchRequest(
            origin_city=preferences.origin_city or "",
            destination_city=preferences.destination_cities[0] if preferences.destination_cities else "",
            departure_date=preferences.departure_date or "",
            return_date=preferences.return_date or "",
            adults=preferences.travellers.adults,
            children=preferences.travellers.children,
            infants=preferences.travellers.infants,
            cabin_class=preferences.flight_preference.cabin_class if preferences.flight_preference else None,
            direct_only=preferences.flight_preference.direct_flights_preferred if preferences.flight_preference else False,
        )
        
        results = await flight_provider.search_flights(request)
        
        # Auto-select best value
        selected_id = results[0].id if results else None
        
        return {
            "flight_results": results,
            "selected_flight_id": selected_id,
            "provider_statuses": {"flights": "succeeded"},
        }
    except Exception as e:
        return {
            "errors": [{
                "node": "search_flights",
                "message": str(e),
                "recoverable": True,
                "provider": "flights",
            }],
            "provider_statuses": {"flights": "failed"},
        }
