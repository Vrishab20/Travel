"""Budget models."""
from pydantic import BaseModel, Field


class TripBudget(BaseModel):
    currency: str = "USD"
    flights: float
    hotels: float
    activities: float
    local_transport: float
    food: float
    taxes_and_fees: float
    emergency_buffer: float
    total: float
    per_person: float
    is_estimate: bool = True
    notes: list[str] = Field(default_factory=list)
