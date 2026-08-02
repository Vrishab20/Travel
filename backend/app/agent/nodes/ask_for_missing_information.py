"""Ask user for missing information."""
from langchain_core.messages import AIMessage

from app.agent.state import TravelAgentState


def ask_for_missing_information(state: TravelAgentState) -> dict:
    """Generate questions for missing required information."""
    missing = state.get("missing_required_fields", [])
    
    if not missing:
        return {}
    
    # Build question based on what's missing
    questions = []
    
    if "origin_city" in missing:
        questions.append("Which city will you be departing from?")
    
    if "destination_cities" in missing:
        questions.append("Which city or cities would you like to visit?")
    
    if "departure_date" in missing:
        questions.append("When would you like to depart? (Please provide a date)")
    
    if "return_date" in missing:
        questions.append("When would you like to return?")
    
    if "valid_date_range" in missing:
        questions.append("Your return date must be after your departure date. Could you clarify your dates?")
    
    if "valid_dates" in missing:
        questions.append("I couldn't parse those dates. Please use format YYYY-MM-DD (e.g., 2024-10-15)")
    
    # Limit to 3 questions
    questions = questions[:3]
    
    message = " ".join(questions)
    
    return {
        "messages": [AIMessage(content=message)],
        "current_stage": "awaiting_user_input",
    }
