"""Summarize results for the user."""
from langchain_core.messages import AIMessage

from app.agent.state import TravelAgentState


def summarize_results(state: TravelAgentState) -> dict:
    trip_plan = state.get("trip_plan")
    if not trip_plan:
        message = (
            "I couldn't create a complete trip plan yet. "
            "Share your cities, dates, and traveller count to continue."
        )
        return {
            "messages": [AIMessage(content=message)],
            "current_stage": "awaiting_user_input",
            "assistant_summary": message,
        }

    parts: list[str] = []
    if trip_plan.status == "ready":
        parts.append("I've drafted your trip plan.")
    elif trip_plan.status == "partial":
        parts.append("I've drafted a **partial** trip plan from the providers that succeeded.")
    else:
        parts.append("Your trip plan is still incomplete.")

    if trip_plan.flights:
        flight = next(
            (item for item in trip_plan.flights if item.id == trip_plan.selected_flight_id),
            trip_plan.flights[0],
        )
        parts.append(
            f"\n\n**Top flight:** {flight.airline} "
            f"({flight.origin_airport} → {flight.destination_airport}) "
            f"— {flight.price.currency} {flight.price.amount}"
        )
        if flight.is_mock_data:
            parts.append(" _(mock estimate)_")

    if trip_plan.hotels:
        hotel = next(
            (item for item in trip_plan.hotels if item.id in trip_plan.selected_hotel_ids),
            trip_plan.hotels[0],
        )
        parts.append(
            f"\n**Hotel pick:** {hotel.name} in {hotel.city} "
            f"— {hotel.nightly_price.currency} {hotel.nightly_price.amount}/night"
        )

    if trip_plan.itinerary:
        parts.append(f"\n**Itinerary:** {len(trip_plan.itinerary)} day(s) drafted.")

    if trip_plan.budget:
        parts.append(
            f"\n**Estimated total:** {trip_plan.budget.currency} {trip_plan.budget.total} "
            f"(about {trip_plan.budget.currency} {trip_plan.budget.per_person} per person)."
        )

    parts.append(
        "\n\nTell me what to refine — cheaper flight, different hotel, calmer day 3, vegetarian food, etc."
    )
    message = "".join(parts)
    stage = "ready" if trip_plan.status in {"ready", "partial"} else "awaiting_user_input"
    return {
        "messages": [AIMessage(content=message)],
        "current_stage": stage,
        "assistant_summary": message,
    }
