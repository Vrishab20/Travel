"""In-memory trip repository implementation."""
from datetime import datetime

from app.models.trip_plan import TripPlan


class InMemoryTripRepository:
    """Simple in-memory trip storage."""

    def __init__(self):
        self._trips: dict[str, dict] = {}

    async def create_trip(
        self,
        trip_id: str,
        thread_id: str,
        origin_country: str,
        destination_country: str,
    ) -> None:
        """Create a new trip."""
        self._trips[trip_id] = {
            "trip_id": trip_id,
            "thread_id": thread_id,
            "origin_country": origin_country,
            "destination_country": destination_country,
            "trip_plan": None,
            "status": "created",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

    async def get_trip(self, trip_id: str) -> dict | None:
        """Retrieve trip by ID."""
        return self._trips.get(trip_id)

    async def update_trip_plan(self, trip_id: str, trip_plan: TripPlan) -> None:
        """Update the trip plan."""
        if trip_id in self._trips:
            self._trips[trip_id]["trip_plan"] = trip_plan
            self._trips[trip_id]["status"] = trip_plan.status
            self._trips[trip_id]["updated_at"] = datetime.utcnow().isoformat()

    async def reset_trip(self, trip_id: str) -> None:
        """Reset trip to initial state."""
        if trip_id in self._trips:
            origin = self._trips[trip_id]["origin_country"]
            destination = self._trips[trip_id]["destination_country"]
            thread_id = self._trips[trip_id]["thread_id"]
            self._trips[trip_id] = {
                "trip_id": trip_id,
                "thread_id": thread_id,
                "origin_country": origin,
                "destination_country": destination,
                "trip_plan": None,
                "status": "reset",
                "created_at": self._trips[trip_id]["created_at"],
                "updated_at": datetime.utcnow().isoformat(),
            }
