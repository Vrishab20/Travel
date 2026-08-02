"""Trip repository protocol."""
from typing import Protocol

from app.models.trip_plan import TripPlan


class TripRepository(Protocol):
    """Protocol for trip persistence."""

    async def create_trip(
        self,
        trip_id: str,
        thread_id: str,
        origin_country: str,
        destination_country: str,
    ) -> None:
        """Create a new trip."""
        ...

    async def get_trip(self, trip_id: str) -> dict | None:
        """Retrieve trip by ID."""
        ...

    async def update_trip_plan(self, trip_id: str, trip_plan: TripPlan) -> None:
        """Update the trip plan."""
        ...

    async def reset_trip(self, trip_id: str) -> None:
        """Reset trip to initial state."""
        ...
