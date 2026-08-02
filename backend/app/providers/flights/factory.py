"""Flight provider factory."""
from app.config import settings
from app.providers.flights.base import FlightProvider
from app.providers.flights.mock import MockFlightProvider


def create_flight_provider() -> FlightProvider:
    """Create flight provider based on configuration."""
    if settings.flight_provider == "mock":
        return MockFlightProvider()
    
    raise ValueError(f"Unknown flight provider: {settings.flight_provider}")
