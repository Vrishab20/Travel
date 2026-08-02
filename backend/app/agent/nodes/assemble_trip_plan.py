"""Assemble complete trip plan."""
from datetime import datetime, timezone

from app.agent.state import TravelAgentState
from app.models.trip_plan import TripPlan


def assemble_trip_plan(state: TravelAgentState) -> dict:
    trip_id = state.get("trip_id", "")
    preferences = state.get("preferences")
    if not preferences:
        return {"current_stage": "error"}

    flights = state.get("flight_results", [])
    hotels = state.get("hotel_results", [])
    activities = state.get("activity_results", [])
    itinerary = state.get("itinerary", [])
    budget = state.get("budget")
    errors = state.get("errors", [])

    has_flights = bool(flights)
    has_hotels = bool(hotels)
    has_activities = bool(activities)
    has_itinerary = bool(itinerary)
    has_budget = budget is not None
    has_failures = bool(errors)

    if all([has_flights, has_hotels, has_activities, has_itinerary, has_budget]) and not has_failures:
        status = "ready"
    elif any([has_flights, has_hotels, has_activities]):
        status = "partial"
    else:
        status = "incomplete"

    now = datetime.now(timezone.utc).isoformat()
    existing = state.get("trip_plan")
    created_at = existing.created_at if existing else now

    trip_plan = TripPlan(
        id=trip_id,
        preferences=preferences,
        flights=flights,
        hotels=hotels,
        activities=activities,
        itinerary=itinerary,
        budget=budget,
        selected_flight_id=state.get("selected_flight_id"),
        selected_hotel_ids=state.get("selected_hotel_ids", []),
        status=status,
        assumptions=state.get("assumptions", [])
        or [
            "Recommendations are generated from mock providers for development.",
            "Prices and availability are estimates, not live booking quotes.",
        ],
        warnings=[getattr(err, "message", str(err)) for err in errors],
        suggestions=[
            "Ask for cheaper flights or direct-only options.",
            "Request a more relaxed day or different neighbourhood hotel.",
        ],
        data_freshness={
            "flights": now,
            "hotels": now,
            "activities": now,
        },
        created_at=created_at,
        updated_at=now,
    )

    return {"trip_plan": trip_plan, "current_stage": "assembling_plan"}
