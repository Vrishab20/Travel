import type {
  ActivityRecommendation,
  FlightRecommendation,
  HotelRecommendation,
  ItineraryDay,
  TripPreferences,
} from "@/lib/agent/schemas";
import { eachDateInclusive, formatDayLabel } from "./itineraryHelpers";

type GenerateItineraryInput = {
  preferences: TripPreferences;
  selectedFlight?: FlightRecommendation;
  selectedHotels?: HotelRecommendation[];
  activities: ActivityRecommendation[];
};

export function generateItinerary({
  preferences,
  selectedFlight,
  selectedHotels,
  activities,
}: GenerateItineraryInput): ItineraryDay[] {
  if (!preferences.departureDate || !preferences.returnDate) {
    return [];
  }

  const cities =
    preferences.destinationCities.length > 0
      ? preferences.destinationCities
      : [preferences.destinationCountry];

  const dates = eachDateInclusive(preferences.departureDate, preferences.returnDate);
  const hotel = selectedHotels?.[0];
  const pace = preferences.pace ?? "balanced";
  const maxActivities = pace === "relaxed" ? 2 : pace === "packed" ? 4 : 3;

  return dates.map((date, index) => {
    const city = cities[Math.min(index, cities.length - 1)];
    const isArrival = index === 0;
    const isDeparture = index === dates.length - 1;
    const dayActivities = activities.slice(
      (index * 2) % Math.max(activities.length, 1),
      (index * 2) % Math.max(activities.length, 1) + maxActivities,
    );

    const items = [];

    if (isArrival && selectedFlight) {
      items.push({
        id: `item-${date}-arrival`,
        startTime: selectedFlight.arrivalTime.slice(11, 16),
        category: "flight" as const,
        title: `Arrive via ${selectedFlight.airline}`,
        description:
          "Allow buffer time after a long-haul arrival before major sightseeing.",
        location: selectedFlight.destinationAirport,
      });
      items.push({
        id: `item-${date}-checkin`,
        startTime: "15:00",
        category: "hotel" as const,
        title: hotel ? `Check in at ${hotel.name}` : "Hotel check-in",
        description: "Settle in and rest before evening plans.",
        location: hotel?.neighbourhood ?? city,
        latitude: hotel?.latitude,
        longitude: hotel?.longitude,
      });
      items.push({
        id: `item-${date}-easy`,
        startTime: "17:30",
        category: "activity" as const,
        title: dayActivities[0]?.name ?? "Neighbourhood orientation walk",
        description: dayActivities[0]?.description ?? "Keep the first evening light.",
        location: city,
        latitude: dayActivities[0]?.latitude ?? hotel?.latitude,
        longitude: dayActivities[0]?.longitude ?? hotel?.longitude,
        estimatedCost: dayActivities[0]?.estimatedCost,
      });
    } else if (isDeparture) {
      items.push({
        id: `item-${date}-morning`,
        startTime: "09:00",
        category: "activity" as const,
        title: dayActivities[0]?.name ?? "Final morning stroll",
        description: "Keep plans flexible near departure.",
        location: city,
        latitude: dayActivities[0]?.latitude,
        longitude: dayActivities[0]?.longitude,
        estimatedCost: dayActivities[0]?.estimatedCost,
      });
      items.push({
        id: `item-${date}-transit`,
        startTime: "12:30",
        category: "transport" as const,
        title: "Transfer to airport",
        description: "Include check-in and security buffer.",
        location: city,
      });
      items.push({
        id: `item-${date}-depart`,
        startTime: "16:00",
        category: "flight" as const,
        title: "Return departure",
        description: "Confirm terminal and baggage allowances before leaving the hotel.",
        location: city,
      });
    } else {
      items.push({
        id: `item-${date}-morning`,
        startTime: "09:30",
        category: "activity" as const,
        title: dayActivities[0]?.name ?? "Morning highlight",
        description: dayActivities[0]?.description,
        location: city,
        latitude: dayActivities[0]?.latitude,
        longitude: dayActivities[0]?.longitude,
        estimatedCost: dayActivities[0]?.estimatedCost,
      });
      items.push({
        id: `item-${date}-lunch`,
        startTime: "12:30",
        category: "food" as const,
        title: "Local lunch",
        description: preferences.dietaryPreferences?.length
          ? `Account for: ${preferences.dietaryPreferences.join(", ")}`
          : "Casual lunch near the morning activity.",
        location: city,
        estimatedCost: { amount: 25, currency: preferences.budget?.currency ?? "USD" },
      });
      items.push({
        id: `item-${date}-afternoon`,
        startTime: "14:30",
        category: "activity" as const,
        title: dayActivities[1]?.name ?? "Afternoon exploration",
        description: dayActivities[1]?.description ?? "Leave room for transit and rest.",
        location: city,
        latitude: dayActivities[1]?.latitude,
        longitude: dayActivities[1]?.longitude,
        estimatedCost: dayActivities[1]?.estimatedCost,
      });
      items.push({
        id: `item-${date}-free`,
        startTime: "17:00",
        category: "free_time" as const,
        title: "Free time",
        description: "Buffer for rest, shopping, or spontaneous finds.",
        location: city,
      });
      items.push({
        id: `item-${date}-dinner`,
        startTime: "19:30",
        category: "food" as const,
        title: dayActivities.find((a) => a.category === "restaurant")?.name ?? "Dinner",
        description: "Evening meal with a reasonable walk from the hotel.",
        location: city,
        estimatedCost: { amount: 40, currency: preferences.budget?.currency ?? "USD" },
      });
    }

    const estimatedDailyCost = {
      amount: items.reduce((sum, item) => sum + (item.estimatedCost?.amount ?? 0), 0),
      currency: preferences.budget?.currency ?? "USD",
    };

    return {
      date,
      city,
      title: formatDayLabel(date, index, isArrival, isDeparture),
      summary: isArrival
        ? "Arrival day with recovery time and a light evening plan."
        : isDeparture
          ? "Departure day with flexible morning plans and transfer buffer."
          : `Full day in ${city} with paced morning and afternoon plans.`,
      items,
      estimatedDailyCost,
    };
  });
}
