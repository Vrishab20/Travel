"""API response schemas."""
from pydantic import BaseModel

from app.models.agent import TravelAgentStage
from app.models.trip_plan import TripPlan


class HealthResponse(BaseModel):
    status: str = "ok"


class CreateTripResponse(BaseModel):
    trip_id: str
    thread_id: str
    status: str = "created"


class TripResponse(BaseModel):
    trip_id: str
    thread_id: str
    trip_plan: TripPlan | None = None
    status: str
    current_stage: TravelAgentStage | None = None
    assistant_summary: str | None = None
