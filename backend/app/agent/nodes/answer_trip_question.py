"""Answer general trip questions."""
from langchain_core.messages import AIMessage

from app.agent.state import TravelAgentState


def answer_trip_question(state: TravelAgentState) -> dict:
    trip_plan = state.get("trip_plan")
    if not trip_plan:
        message = "I don't have enough information about your trip yet to answer that."
    else:
        message = "I can help with your current plan. "
        if trip_plan.budget:
            message += (
                f"Estimated total is {trip_plan.budget.currency} {trip_plan.budget.total}. "
            )
        if trip_plan.itinerary:
            message += f"Your itinerary covers {len(trip_plan.itinerary)} days. "
        message += "What would you like to know more about?"

    return {
        "messages": [AIMessage(content=message)],
        "current_stage": "ready",
        "assistant_summary": message,
    }
