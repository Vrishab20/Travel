"""Itinerary generation service."""
from datetime import datetime, timedelta

from app.models.activity import ActivityRecommendation
from app.models.flight import FlightRecommendation
from app.models.hotel import HotelRecommendation
from app.models.itinerary import ItineraryDay, ItineraryItem
from app.models.trip_preferences import TripPreferences


def generate_itinerary(
    preferences: TripPreferences,
    flight: FlightRecommendation | None,
    hotels: list[HotelRecommendation],
    activities: list[ActivityRecommendation],
) -> list[ItineraryDay]:
    if not preferences.departure_date or not preferences.return_date:
        return []

    cities = preferences.destination_cities or [preferences.destination_country]
    departure = datetime.fromisoformat(preferences.departure_date).date()
    return_date = datetime.fromisoformat(preferences.return_date).date()
    hotel = hotels[0] if hotels else None
    pace = preferences.pace or "balanced"
    max_activities = 2 if pace == "relaxed" else 4 if pace == "packed" else 3

    days: list[ItineraryDay] = []
    current = departure
    index = 0
    while current <= return_date:
        date_str = current.isoformat()
        city = cities[min(index, len(cities) - 1)]
        day_activities = activities[index * 2 : index * 2 + max_activities] or activities[:max_activities]
        items: list[ItineraryItem] = []
        is_arrival = index == 0
        is_departure = current == return_date

        if is_arrival and flight:
            items.append(
                ItineraryItem(
                    id=f"item-{date_str}-arrival",
                    start_time=flight.arrival_time[11:16] if "T" in flight.arrival_time else "14:00",
                    category="flight",
                    title=f"Arrive via {flight.airline}",
                    description="Allow buffer time after arrival before major sightseeing.",
                    location=flight.destination_airport,
                )
            )
            items.append(
                ItineraryItem(
                    id=f"item-{date_str}-checkin",
                    start_time="15:00",
                    category="hotel",
                    title=f"Check in at {hotel.name}" if hotel else "Hotel check-in",
                    description="Settle in and rest before evening plans.",
                    location=hotel.neighbourhood if hotel and hotel.neighbourhood else city,
                    latitude=hotel.latitude if hotel else None,
                    longitude=hotel.longitude if hotel else None,
                )
            )
            first = day_activities[0] if day_activities else None
            items.append(
                ItineraryItem(
                    id=f"item-{date_str}-easy",
                    start_time="17:30",
                    category="activity",
                    title=first.name if first else "Neighbourhood orientation walk",
                    description=first.description if first else "Keep the first evening light.",
                    location=city,
                    latitude=first.latitude if first else (hotel.latitude if hotel else None),
                    longitude=first.longitude if first else (hotel.longitude if hotel else None),
                    estimated_cost=first.estimated_cost if first else None,
                )
            )
        elif is_departure:
            first = day_activities[0] if day_activities else None
            items.extend(
                [
                    ItineraryItem(
                        id=f"item-{date_str}-morning",
                        start_time="09:00",
                        category="activity",
                        title=first.name if first else "Final morning stroll",
                        description="Keep plans flexible near departure.",
                        location=city,
                        latitude=first.latitude if first else None,
                        longitude=first.longitude if first else None,
                        estimated_cost=first.estimated_cost if first else None,
                    ),
                    ItineraryItem(
                        id=f"item-{date_str}-transit",
                        start_time="12:30",
                        category="transport",
                        title="Transfer to airport",
                        description="Include check-in and security buffer.",
                        location=city,
                    ),
                    ItineraryItem(
                        id=f"item-{date_str}-depart",
                        start_time="16:00",
                        category="flight",
                        title="Return departure",
                        description="Confirm terminal and baggage allowances.",
                        location=city,
                    ),
                ]
            )
        else:
            for slot, activity in enumerate(day_activities[:3]):
                hour = 9 + slot * 3
                items.append(
                    ItineraryItem(
                        id=f"item-{date_str}-{slot}",
                        start_time=f"{hour:02d}:30",
                        category="activity",
                        title=activity.name,
                        description=activity.description,
                        location=city,
                        latitude=activity.latitude,
                        longitude=activity.longitude,
                        estimated_cost=activity.estimated_cost,
                    )
                )
            items.append(
                ItineraryItem(
                    id=f"item-{date_str}-lunch",
                    start_time="12:30",
                    category="food",
                    title="Lunch break",
                    description="Leave time for a sit-down meal.",
                    location=city,
                )
            )

        days.append(
            ItineraryDay(
                date=date_str,
                city=city,
                title=f"Day {index + 1} in {city}",
                summary=f"Balanced day focused on {city}.",
                items=items,
            )
        )
        current += timedelta(days=1)
        index += 1

    return days
