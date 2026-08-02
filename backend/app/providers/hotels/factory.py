"""Hotel provider factory."""
from app.config import settings
from app.providers.hotels.base import HotelProvider
from app.providers.hotels.mock import MockHotelProvider


def create_hotel_provider() -> HotelProvider:
    """Create hotel provider based on configuration."""
    if settings.hotel_provider == "mock":
        return MockHotelProvider()
    
    raise ValueError(f"Unknown hotel provider: {settings.hotel_provider}")
