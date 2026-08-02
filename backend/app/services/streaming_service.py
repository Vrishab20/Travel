"""SSE streaming utilities."""
import json
from typing import Any


def format_sse_event(event_type: str, data: dict[str, Any]) -> str:
    """Format data as SSE event."""
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


def format_sse_data(data: dict[str, Any]) -> str:
    """Format data as SSE without custom event type."""
    return f"data: {json.dumps(data)}\n\n"
