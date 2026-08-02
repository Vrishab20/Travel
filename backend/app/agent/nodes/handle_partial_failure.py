"""Handle partial provider failures."""
from app.agent.state import TravelAgentState


def handle_partial_failure(state: TravelAgentState) -> dict:
    """Handle cases where some providers succeeded and others failed."""
    errors = state.get("errors", [])
    
    if not errors:
        return {"current_stage": "ready"}
    
    # Check which providers failed
    failed_providers = [e.get("provider") for e in errors if e.get("provider")]
    
    # Continue with successful results
    return {
        "current_stage": "partial_failure",
        "assumptions": [f"Continuing without {provider} results" for provider in failed_providers],
    }
