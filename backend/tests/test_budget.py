"""Test budget calculation service."""
import pytest
from datetime import datetime, timedelta

from app.services.budget_service import calculate_budget
from app.models.trip_preferences import TripPreferences, Travellers
from app.models.flight import FlightRecommendation
from app.models.hotel import HotelRecommendation
from app.models.activity import ActivityRecommendation


def test_budget_calculation_basic():
    """Budget calculation is deterministic."""
    departure = datetime.now().date().isoformat()
    return_date = (datetime.now() + timedelta(days=7)).date().isoformat()
    
    preferences = TripPreferences(
        origin_country="US",
        destination_country="FR",
        origin_city="New York",
        destination_cities=["Paris"],
        departure_date=departure,
        return_date=return_date,
        travellers=Travellers(adults=2, children=0, infants=0),
    )
    
    flight = FlightRecommendation(
        id="flight_1",
        airline="TestAir",
        flight_number="TA100",
        departure_airport="JFK",
        arrival_airport="CDG",
        departure_time="2024-10-15T10:00:00",
        arrival_time="2024-10-15T22:00:00",
        duration_minutes=480,
        stops=0,
        price_per_person=500.0,
        currency="USD",
        cabin_class="economy",
        baggage_allowance="1 bag",
        recommendation_category="best_value",
        is_mock_data=True,
    )
    
    hotel = HotelRecommendation(
        id="hotel_1",
        name="Test Hotel",
        city="Paris",
        address="123 Test St",
        check_in_date=departure,
        check_out_date=return_date,
        price_per_night=150.0,
        total_price=1050.0,  # 7 nights
        currency="USD",
        star_rating=4.0,
        recommendation_category="balanced",
        is_mock_data=True,
    )
    
    activity = ActivityRecommendation(
        id="activity_1",
        name="Museum Visit",
        description="Test activity",
        city="Paris",
        category="museum",
        estimated_cost=20.0,
        currency="USD",
        is_free=False,
        is_mock_data=True,
    )
    
    budget = calculate_budget(
        preferences=preferences,
        flight=flight,
        hotels=[hotel],
        activities=[activity],
    )
    
    # Verify calculations
    assert budget.flight_cost == 1000.0  # 500 * 2 adults
    assert budget.hotel_cost == 1050.0
    assert budget.activities_cost == 40.0  # 20 * 2 adults
    assert budget.food_cost == 700.0  # 7 days * 50 * 2 adults
    assert budget.local_transportation_cost == 200.0  # 100 * 2 adults
    
    # Verify total includes taxes and buffer
    subtotal = 1000 + 1050 + 40 + 700 + 200
    taxes = subtotal * 0.08
    buffer = subtotal * 0.10
    expected_total = subtotal + taxes + buffer
    
    assert budget.total_cost == expected_total
    assert budget.per_person_cost == expected_total / 2
    assert budget.is_estimate is True


def test_budget_with_no_flight():
    """Budget calculation works without flight data."""
    departure = datetime.now().date().isoformat()
    return_date = (datetime.now() + timedelta(days=3)).date().isoformat()
    
    preferences = TripPreferences(
        origin_country="US",
        destination_country="FR",
        departure_date=departure,
        return_date=return_date,
        travellers=Travellers(adults=1),
    )
    
    budget = calculate_budget(
        preferences=preferences,
        flight=None,
        hotels=[],
        activities=[],
    )
    
    assert budget.flight_cost == 0.0
    assert budget.total_cost > 0  # Should still have food and transport estimates
