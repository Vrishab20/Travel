"""Places provider factory."""
from app.config import settings
from app.providers.places.base import PlacesProvider
from app.providers.places.mock import MockPlacesProvider


def create_places_provider() -> PlacesProvider:
    """Create places provider based on configuration."""
    if settings.places_provider == "mock":
        return MockPlacesProvider()
    
    raise ValueError(f"Unknown places provider: {settings.places_provider}")
