"""Deterministic mock hotel provider."""
from datetime import datetime

from app.models.flight import Money
from app.models.hotel import HotelRecommendation
from app.providers.hotels.base import HotelProvider, HotelSearchRequest

CITY_COORDS: dict[str, tuple[float, float]] = {
    "paris": (2.3522, 48.8566),
    "lyon": (4.8357, 45.7640),
    "nice": (7.2619, 43.7102),
    "london": (-0.1276, 51.5072),
    "tokyo": (139.6917, 35.6895),
    "rome": (12.4964, 41.9028),
    "barcelona": (2.1734, 41.3851),
    "toronto": (-79.3832, 43.6532),
    "default": (2.35, 48.85),
}


def _hash_seed(value: str) -> int:
    digest = 0
    for char in value:
        digest = ((digest << 5) - digest + ord(char)) & 0xFFFFFFFF
    return abs(digest)


def _nights(check_in: str, check_out: str) -> int:
    start = datetime.fromisoformat(check_in)
    end = datetime.fromisoformat(check_out)
    return max(1, (end - start).days)


def _coords(city: str) -> tuple[float, float]:
    key = city.strip().lower()
    for name, coords in CITY_COORDS.items():
        if name in key:
            return coords
    return CITY_COORDS["default"]


class MockHotelProvider:
    async def search_hotels(
        self, request: HotelSearchRequest
    ) -> list[HotelRecommendation]:
        nights = _nights(request.check_in_date, request.check_out_date)
        seed = _hash_seed(
            "|".join(
                [
                    request.city,
                    request.check_in_date,
                    request.check_out_date,
                    str(request.adults),
                ]
            )
        )
        lng, lat = _coords(request.city)
        area = "City center" if seed % 2 == 0 else "Riverside district"

        specs = [
            ("Harbourlight Inn", "budget", 3, 8.2, 95 + (seed % 40), ["Wi-Fi", "Breakfast available"]),
            ("Atelier Maison", "balanced", 4, 8.9, 160 + (seed % 55), ["Wi-Fi", "Gym", "Restaurant"]),
            ("Maison Etoile", "premium", 5, 9.3, 290 + (seed % 80), ["Spa", "Fine dining", "Airport transfer"]),
        ]

        results: list[HotelRecommendation] = []
        for index, (name, category, stars, score, nightly, amenities) in enumerate(specs):
            results.append(
                HotelRecommendation(
                    id=f"mock-hotel-{seed}-{index}",
                    provider="mock-hotels",
                    name=name,
                    city=request.city,
                    neighbourhood=area if category != "premium" else "Historic quarter",
                    star_rating=stars,
                    review_score=score,
                    check_in_date=request.check_in_date,
                    check_out_date=request.check_out_date,
                    nightly_price=Money(amount=nightly, currency="USD"),
                    total_price=Money(amount=nightly * nights, currency="USD"),
                    amenities=amenities,
                    booking_url=f"https://example.com/hotels/mock-{category}",
                    latitude=lat + (0.01 if index == 0 else -0.01 if index == 2 else 0),
                    longitude=lng + (-0.01 if index == 0 else 0.008 if index == 2 else 0),
                    is_mock_data=True,
                    recommendation_category=category,  # type: ignore[arg-type]
                    recommendation_reason=f"{category.title()} option for this destination.",
                )
            )
        return results


_: HotelProvider = MockHotelProvider()  # type: ignore[assignment]
