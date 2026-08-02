"""Test mock flight provider for determinism."""
import pytest

from app.providers.flights.mock import MockFlightProvider
from app.providers.flights.base import FlightSearchRequest


@pytest.mark.asyncio
async def test_mock_flights_are_deterministic():
    """Mock flight provider returns same results for same request."""
    provider = MockFlightProvider()
    
    request = FlightSearchRequest(
        origin_city="Toronto",
        destination_city="Paris",
        departure_date="2024-10-15",
        return_date="2024-10-22",
        adults=2,
    )
    
    # Call twice
    results1 = await provider.search_flights(request)
    results2 = await provider.search_flights(request)
    
    # Should be identical
    assert len(results1) == len(results2)
    assert results1[0].id == results2[0].id
    assert results1[0].price_per_person == results2[0].price_per_person


@pytest.mark.asyncio
async def test_mock_flights_returns_three_categories():
    """Mock flight provider returns best_value, best_schedule, most_comfortable."""
    provider = MockFlightProvider()
    
    request = FlightSearchRequest(
        origin_city="New York",
        destination_city="London",
        departure_date="2024-11-01",
        return_date="2024-11-10",
        adults=1,
    )
    
    results = await provider.search_flights(request)
    
    assert len(results) == 3
    
    categories = {r.recommendation_category for r in results}
    assert categories == {"best_value", "best_schedule", "most_comfortable"}
    
    # All should be marked as mock data
    assert all(r.is_mock_data for r in results)


@pytest.mark.asyncio
async def test_mock_flights_respects_direct_only():
    """Mock provider respects direct_only preference."""
    provider = MockFlightProvider()
    
    request = FlightSearchRequest(
        origin_city="Boston",
        destination_city="Rome",
        departure_date="2024-12-01",
        return_date="2024-12-15",
        adults=1,
        direct_only=True,
    )
    
    results = await provider.search_flights(request)
    
    # Best value should be direct when direct_only=True
    best_value = next(r for r in results if r.recommendation_category == "best_value")
    assert best_value.stops == 0
