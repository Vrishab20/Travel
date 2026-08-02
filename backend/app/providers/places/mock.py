"""Deterministic mock places provider."""
from app.models.activity import ActivityRecommendation
from app.models.flight import Money
from app.providers.places.base import ActivitySearchRequest, PlacesProvider


def _hash_seed(value: str) -> int:
    digest = 0
    for char in value:
        digest = ((digest << 5) - digest + ord(char)) & 0xFFFFFFFF
    return abs(digest)


CATALOG = [
    ("Old Town Walk", "neighbourhood", "Explore historic streets and plazas.", 0, 90),
    ("City Museum", "attraction", "Flagship museum with rotating exhibitions.", 22, 120),
    ("Market Lunch", "restaurant", "Casual local food market tasting.", 28, 75),
    ("River Cruise", "tour", "Short sightseeing cruise along the river.", 35, 60),
    ("Hill Viewpoint", "attraction", "Sunset viewpoint with city panorama.", 0, 45),
    ("Guided Food Tour", "tour", "Neighbourhood bites with a local guide.", 55, 150),
]


class MockPlacesProvider:
    async def search_activities(
        self, request: ActivitySearchRequest
    ) -> list[ActivityRecommendation]:
        cities = request.cities or ["Destination"]
        seed = _hash_seed("|".join(cities + request.interests))
        results: list[ActivityRecommendation] = []

        for city_index, city in enumerate(cities):
            for offset in range(6):
                name, category, description, cost, duration = CATALOG[
                    (seed + offset + city_index) % len(CATALOG)
                ]
                results.append(
                    ActivityRecommendation(
                        id=f"mock-activity-{seed}-{city_index}-{offset}",
                        name=f"{name} ({city})",
                        city=city,
                        category=category,  # type: ignore[arg-type]
                        description=description,
                        estimated_cost=Money(amount=cost, currency="USD") if cost else None,
                        duration_minutes=duration,
                        latitude=48.85 + ((seed + offset) % 20) * 0.01,
                        longitude=2.35 + ((seed + offset) % 15) * 0.01,
                        booking_url="https://example.com/activities/mock",
                        is_mock_data=True,
                        recommendation_reason="Mock activity matched to destination interests.",
                    )
                )
        return results


_: PlacesProvider = MockPlacesProvider()  # type: ignore[assignment]
