"""Validate trip requirements."""
from datetime import datetime

from app.agent.state import TravelAgentState


def validate_trip_requirements(state: TravelAgentState) -> dict:
    """Validate that all required trip information is present."""
    preferences = state.get("preferences")
    if not preferences:
        return {
            "missing_required_fields": ["origin_city", "destination_cities", "departure_date", "return_date"],
            "should_ask_user": True,
            "should_search": False,
        }
    
    missing = []
    
    if not preferences.origin_city:
        missing.append("origin_city")
    
    if not preferences.destination_cities:
        missing.append("destination_cities")
    
    if not preferences.departure_date:
        missing.append("departure_date")
    
    if not preferences.return_date:
        missing.append("return_date")
    
    # Validate dates if present
    if preferences.departure_date and preferences.return_date:
        try:
            dep = datetime.fromisoformat(preferences.departure_date)
            ret = datetime.fromisoformat(preferences.return_date)
            
            if ret <= dep:
                missing.append("valid_date_range")
        except ValueError:
            missing.append("valid_dates")
    
    return {
        "missing_required_fields": missing,
        "should_ask_user": bool(missing),
        "should_search": not bool(missing),
    }
