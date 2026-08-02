"""SSE event schemas."""
from typing import Literal
from pydantic import BaseModel

from app.models.agent import TravelAgentStage
from app.models.trip_plan import TripPlan


class StageChangedEvent(BaseModel):
    """Notification that the agent stage changed."""

    type: Literal["stage_changed"] = "stage_changed"
    stage: TravelAgentStage
    label: str


class ProviderStartedEvent(BaseModel):
    """Notification that a provider search started."""

    type: Literal["provider_started"] = "provider_started"
    provider: Literal["flights", "hotels", "activities"]


class ProviderCompletedEvent(BaseModel):
    """Notification that a provider search completed."""

    type: Literal["provider_completed"] = "provider_completed"
    provider: Literal["flights", "hotels", "activities"]
    result_count: int


class ProviderFailedEvent(BaseModel):
    """Notification that a provider search failed."""

    type: Literal["provider_failed"] = "provider_failed"
    provider: Literal["flights", "hotels", "activities"]
    recoverable: bool
    message: str


class TripPlanUpdatedEvent(BaseModel):
    """Notification that the trip plan was updated."""

    type: Literal["trip_plan_updated"] = "trip_plan_updated"
    trip_plan: TripPlan


class AssistantTokenEvent(BaseModel):
    """Streaming token from assistant message."""

    type: Literal["assistant_token"] = "assistant_token"
    content: str


class AssistantMessageEvent(BaseModel):
    """Complete assistant message."""

    type: Literal["assistant_message"] = "assistant_message"
    content: str


class GraphCompletedEvent(BaseModel):
    """Notification that graph execution completed."""

    type: Literal["graph_completed"] = "graph_completed"
    stage: TravelAgentStage


class ErrorEvent(BaseModel):
    """Error notification."""

    type: Literal["error"] = "error"
    message: str
    recoverable: bool = True
