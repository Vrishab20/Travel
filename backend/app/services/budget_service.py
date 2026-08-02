"""Deterministic budget calculation."""
from datetime import datetime

from app.models.activity import ActivityRecommendation
from app.models.budget import TripBudget
from app.models.flight import FlightRecommendation
from app.models.hotel import HotelRecommendation
from app.models.trip_preferences import TripPreferences


def calculate_budget(
    preferences: TripPreferences,
    flights: list[FlightRecommendation],
    hotels: list[HotelRecommendation],
    activities: list[ActivityRecommendation],
    selected_flight_id: str | None = None,
    selected_hotel_ids: list[str] | None = None,
) -> TripBudget:
    currency = preferences.budget.currency if preferences.budget else "USD"
    people = max(
        1,
        preferences.travellers.adults
        + preferences.travellers.children
        + preferences.travellers.infants,
    )

    nights = 3
    if preferences.departure_date and preferences.return_date:
        start = datetime.fromisoformat(preferences.departure_date)
        end = datetime.fromisoformat(preferences.return_date)
        nights = max(1, (end - start).days)

    selected_flight = next(
        (flight for flight in flights if flight.id == selected_flight_id),
        flights[0] if flights else None,
    )
    if selected_hotel_ids:
        selected_hotels = [hotel for hotel in hotels if hotel.id in selected_hotel_ids]
    else:
        selected_hotels = hotels[:1]

    flight_total = (selected_flight.price.amount * people) if selected_flight else 0
    hotel_total = sum(hotel.total_price.amount for hotel in selected_hotels)
    activities_total = (
        sum((activity.estimated_cost.amount if activity.estimated_cost else 0) for activity in activities[: max(3, nights)])
        * people
    )

    if preferences.travel_style == "luxury":
        food_per_day = 90
    elif preferences.travel_style == "budget":
        food_per_day = 35
    else:
        food_per_day = 55

    food = food_per_day * nights * people
    local_transport = 18 * nights * people
    subtotal = flight_total + hotel_total + activities_total + food + local_transport
    taxes_and_fees = round(subtotal * 0.08)
    emergency_buffer = round(subtotal * 0.10)
    total = subtotal + taxes_and_fees + emergency_buffer

    notes = ["All figures are estimates for planning only."]
    if (selected_flight and selected_flight.is_mock_data) or any(
        hotel.is_mock_data for hotel in selected_hotels
    ):
        notes.append("Mock provider prices are not live availability or booking quotes.")

    return TripBudget(
        currency=currency,
        flights=flight_total,
        hotels=hotel_total,
        activities=activities_total,
        local_transport=local_transport,
        food=food,
        taxes_and_fees=taxes_and_fees,
        emergency_buffer=emergency_buffer,
        total=total,
        per_person=round(total / people),
        is_estimate=True,
        notes=notes,
    )
