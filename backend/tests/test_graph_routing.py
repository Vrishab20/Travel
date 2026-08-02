from app.agent.routing import route_after_validation, route_refinement
from app.models.trip_preferences import TripPreferences
from app.providers.flights.mock import MockFlightProvider
from app.services.budget_service import calculate_budget
import asyncio


def test_route_after_validation_asks_when_missing():
    state = {"missing_required_fields": ["origin_city"]}
    assert route_after_validation(state) == "ask_for_missing_information"


def test_route_after_validation_searches_when_complete():
    state = {"missing_required_fields": []}
    assert route_after_validation(state) == "dispatch_searches"


def test_route_refinement_cheaper_flights():
    state = {"user_intent": "find_cheaper_flights"}
    assert route_refinement(state) == "search_flights"


def test_mock_flights_deterministic_and_categorized():
    provider = MockFlightProvider()
    request = {
        "origin_city": "Toronto",
        "destination_city": "Paris",
        "departure_date": "2026-10-10",
        "return_date": "2026-10-17",
        "adults": 2,
    }
    from app.providers.flights.base import FlightSearchRequest

    req = FlightSearchRequest(**request)
    first = asyncio.get_event_loop().run_until_complete(provider.search_flights(req))
    second = asyncio.get_event_loop().run_until_complete(provider.search_flights(req))
    assert [f.id for f in first] == [f.id for f in second]
    categories = {f.recommendation_category for f in first}
    assert categories == {"best_value", "best_schedule", "most_comfortable"}
    assert all(f.is_mock_data for f in first)


def test_budget_totals():
    prefs = TripPreferences(
        origin_country="Canada",
        destination_country="France",
        origin_city="Toronto",
        destination_cities=["Paris"],
        departure_date="2026-10-10",
        return_date="2026-10-17",
        travellers={"adults": 2, "children": 0, "infants": 0},
    )
    from app.models.flight import FlightRecommendation, Money

    flight = FlightRecommendation(
        id="f1",
        provider="mock",
        airline="Test",
        flight_numbers=["T1"],
        origin_airport="YYZ",
        destination_airport="CDG",
        departure_time="2026-10-10T08:00:00",
        arrival_time="2026-10-10T20:00:00",
        duration_minutes=480,
        stops=0,
        cabin_class="economy",
        price=Money(amount=500, currency="USD"),
        is_mock_data=True,
        recommendation_reason="test",
    )
    budget = calculate_budget(prefs, [flight], [], [], selected_flight_id="f1")
    assert budget.is_estimate is True
    assert budget.flights == 1000
    assert budget.total > budget.flights
