"""API request schemas."""
from pydantic import BaseModel, Field


class CreateTripRequest(BaseModel):
    """Request to create a new trip."""

    origin_country: str
    destination_country: str


class AgentMessageRequest(BaseModel):
    """Request to send a message to the travel agent."""

    trip_id: str
    thread_id: str
    message: str = Field(min_length=1)
