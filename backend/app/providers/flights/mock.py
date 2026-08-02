"""Deterministic mock flight provider."""
from app.models.flight import FlightRecommendation, Money
from app.providers.flights.base import FlightProvider, FlightSearchRequest


def _hash_seed(value: str) -> int:
    digest = 0
    for char in value:
        digest = ((digest << 5) - digest + ord(char)) & 0xFFFFFFFF
    return abs(digest)


def _airport_code(city_or_airport: str) -> str:
    cleaned = city_or_airport.strip().upper()
    if len(cleaned) == 3 and cleaned.isalpha():
        return cleaned
    letters = "".join(ch for ch in cleaned if ch.isalpha())
    return (letters[:3] or "XXX").ljust(3, "X")


class MockFlightProvider:
    """Returns stable fictional flight options."""

    async def search_flights(
        self, request: FlightSearchRequest
    ) -> list[FlightRecommendation]:
        seed = _hash_seed(
            "|".join(
                [
                    request.origin_city,
                    request.destination_city,
                    request.departure_date,
                    request.return_date,
                    request.cabin_class or "economy",
                    str(request.adults),
                ]
            )
        )
        origin = _airport_code(request.origin_city)
        destination = _airport_code(request.destination_city)
        cabin = request.cabin_class or "economy"
        base = 280 + (seed % 220)

        options = [
            FlightRecommendation(
                id=f"mock-flight-{seed}-0",
                provider="mock-flights",
                airline="Atlas Air",
                flight_numbers=[f"AA{100 + (seed % 50)}"],
                origin_airport=origin,
                destination_airport=destination,
                departure_time=f"{request.departure_date}T08:15:00",
                arrival_time=f"{request.departure_date}T20:40:00",
                duration_minutes=505 + (seed % 90),
                stops=0,
                cabin_class=cabin,
                price=Money(amount=round(base * 1.35), currency="USD"),
                baggage_summary="1 personal item + 1 carry-on",
                booking_url="https://example.com/flights/mock-schedule",
                is_mock_data=True,
                recommendation_category="best_schedule",
                recommendation_reason="Direct daytime option with a reliable schedule.",
            ),
            FlightRecommendation(
                id=f"mock-flight-{seed}-1",
                provider="mock-flights",
                airline="Nordic Connect",
                flight_numbers=[f"NC{200 + (seed % 40)}", f"NC{260 + (seed % 30)}"],
                origin_airport=origin,
                destination_airport=destination,
                departure_time=f"{request.departure_date}T11:05:00",
                arrival_time=f"{request.departure_date}T23:55:00",
                duration_minutes=650 + (seed % 80),
                stops=1,
                cabin_class=cabin,
                price=Money(amount=round(base * 0.92), currency="USD"),
                baggage_summary="1 personal item; checked bag from $45",
                booking_url="https://example.com/flights/mock-value",
                is_mock_data=True,
                recommendation_category="best_value",
                recommendation_reason="Lower fare with one connection.",
            ),
            FlightRecommendation(
                id=f"mock-flight-{seed}-2",
                provider="mock-flights",
                airline="Lumen Airways",
                flight_numbers=[f"LU{300 + (seed % 60)}"],
                origin_airport=origin,
                destination_airport=destination,
                departure_time=f"{request.departure_date}T16:40:00",
                arrival_time=f"{request.departure_date}T05:10:00",
                duration_minutes=470 + (seed % 50),
                stops=0,
                cabin_class="premium_economy" if cabin == "economy" else cabin,
                price=Money(amount=round(base * 1.85), currency="USD"),
                baggage_summary="2 checked bags included",
                booking_url="https://example.com/flights/mock-comfort",
                is_mock_data=True,
                recommendation_category="most_comfortable",
                recommendation_reason="Premium comfort option with stronger baggage allowance.",
            ),
        ]

        if request.direct_only:
            options = [flight for flight in options if flight.stops == 0]
        return options


# Satisfy protocol typing
_: FlightProvider = MockFlightProvider()  # type: ignore[assignment]
