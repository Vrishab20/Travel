"""Classify user intent for refinement."""
import re
from langchain_core.messages import HumanMessage

from app.agent.state import TravelAgentState
from app.models.agent import TravelRefinementIntent


def classify_user_intent(state: TravelAgentState) -> dict:
    """Classify user message into refinement intent using heuristics."""
    messages = state.get("messages", [])
    if not messages:
        return {"user_intent": "unknown"}
    
    # Get latest human message
    latest_msg = None
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            latest_msg = msg.content.lower()
            break
    
    if not latest_msg:
        return {"user_intent": "unknown"}
    
    # Keyword-based classification
    if "start over" in latest_msg or "reset" in latest_msg:
        return {"user_intent": "start_over", "current_stage": "classifying_request"}
    
    if "cheaper" in latest_msg and "flight" in latest_msg:
        return {"user_intent": "find_cheaper_flights", "current_stage": "classifying_request"}
    
    if "direct" in latest_msg and "flight" in latest_msg:
        return {"user_intent": "find_direct_flights", "current_stage": "classifying_request"}
    
    if "hotel" in latest_msg and ("change" in latest_msg or "replace" in latest_msg or "different" in latest_msg):
        return {"user_intent": "replace_hotel", "current_stage": "classifying_request"}
    
    if re.search(r"day\s+\d+", latest_msg) or "itinerary" in latest_msg:
        return {"user_intent": "modify_itinerary_day", "current_stage": "classifying_request"}
    
    if "date" in latest_msg and ("change" in latest_msg or "different" in latest_msg):
        return {"user_intent": "change_dates", "current_stage": "classifying_request"}
    
    if "budget" in latest_msg:
        return {"user_intent": "recalculate_budget", "current_stage": "classifying_request"}
    
    if "dietary" in latest_msg or "vegetarian" in latest_msg or "vegan" in latest_msg:
        return {"user_intent": "change_dietary_preferences", "current_stage": "classifying_request"}
    
    if any(word in latest_msg for word in ["what", "where", "when", "how", "why", "tell me", "?"]):
        return {"user_intent": "general_trip_question", "current_stage": "classifying_request"}
    
    # Default to general information
    return {"user_intent": "provide_trip_information", "current_stage": "classifying_request"}
