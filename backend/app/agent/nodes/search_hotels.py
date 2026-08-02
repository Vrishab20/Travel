"""Search for hotel recommendations."""
from app.agent.state import TravelAgentState
from app.providers.hotels.base import HotelProvider, HotelSearchRequest


async def search_hotels(state: TravelAgentState, hotel_provider: HotelProvider) -> dict:
    preferences = state.get("preferences")
    if not preferences or not preferences.destination_cities:
        return {
            "errors": [
                {
                    "node": "search_hotels",
                    "message": "No destination cities",
                    "recoverable": False,
                }
            ]
        }

    try:
        check_in = preferences.departure_date or ""
        check_out = preferences.return_date or ""
        city = preferences.destination_cities[0]
        request = HotelSearchRequest(
            city=city,
            check_in_date=check_in,
            check_out_date=check_out,
            adults=preferences.travellers.adults,
            children=preferences.travellers.children,
        )
        results = await hotel_provider.search_hotels(request)
        selected_ids = (
            [results[1].id]
            if len(results) > 1
            else ([results[0].id] if results else [])
        )
        return {
            "hotel_results": results,
            "selected_hotel_ids": selected_ids,
            "provider_statuses": {"hotels": "succeeded"},
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "errors": [
                {
                    "node": "search_hotels",
                    "message": str(exc),
                    "recoverable": True,
                    "provider": "hotels",
                }
            ],
            "provider_statuses": {"hotels": "failed"},
        }
