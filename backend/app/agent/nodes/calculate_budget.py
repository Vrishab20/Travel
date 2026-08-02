"""Calculate trip budget node."""
from app.agent.state import TravelAgentState
from app.services.budget_service import calculate_budget


def calculate_budget_node(state: TravelAgentState) -> dict:
    preferences = state.get("preferences")
    if not preferences:
        return {}

    budget = calculate_budget(
        preferences=preferences,
        flights=state.get("flight_results", []),
        hotels=state.get("hotel_results", []),
        activities=state.get("activity_results", []),
        selected_flight_id=state.get("selected_flight_id"),
        selected_hotel_ids=state.get("selected_hotel_ids"),
    )
    return {"budget": budget, "current_stage": "calculating_budget"}
